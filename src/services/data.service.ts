import { effect, inject, Injectable, signal } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  onSnapshot,
  query,
  updateDoc,
  addDoc,
  Timestamp,
  arrayUnion,
  getDoc,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { TutoringSession, User, Subject, SessionStatus } from '../models/session.model';
import { AuthService } from './auth.service';
import { getFirestore } from "firebase/firestore";

// Helper function to convert Firestore doc to TypeScript object
const fromDoc = <T>(docSnap: any): T => ({ id: docSnap.id, ...docSnap.data() } as T);

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private authService = inject(AuthService);
  private db: Firestore = getFirestore();

  private readonly sessionsSignal = signal<TutoringSession[]>([]);
  private readonly tutorsSignal = signal<User[]>([]);
  private readonly subjectsSignal = signal<Subject[]>([]);
  private readonly usersSignal = signal<User[]>([]); // To cache all users for lookups

  constructor() {
    // Set up listeners once auth is ready
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.initializeDataListeners();
      } else {
        // Clear data on logout
        this.sessionsSignal.set([]);
        this.tutorsSignal.set([]);
        this.subjectsSignal.set([]);
        this.usersSignal.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private initializeDataListeners() {
    // 1. Listen to all users to create a local cache for populating session data
    const usersQuery = query(collection(this.db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => fromDoc<User>(doc));
      this.usersSignal.set(users);
      this.tutorsSignal.set(users.filter(u => u.role === 'tutor'));
    });

    // 2. Listen to all subjects
    const subjectsQuery = query(collection(this.db, 'subjects'));
    onSnapshot(subjectsQuery, (snapshot) => {
      this.subjectsSignal.set(snapshot.docs.map(doc => fromDoc<Subject>(doc)));
    });

    // 3. Listen to all sessions and populate related data
    const allSessionsQuery = query(collection(this.db, 'sessions'));
    onSnapshot(allSessionsQuery, async (snapshot) => {
      const sessionDocs = snapshot.docs;
      const users = this.usersSignal();
      const subjects = this.subjectsSignal();

      if (users.length === 0 || subjects.length === 0) {
        // This may run before users/subjects are loaded, so we wait.
        // A more robust solution might use RxJS combineLatest if signals weren't used.
        // With signals, effect will re-run, so this is okay for now.
        return;
      }

      const userMap = new Map(users.map(u => [u.id, u]));
      const subjectMap = new Map(subjects.map(s => [s.id, s]));

      const sessions: TutoringSession[] = sessionDocs.map(doc => {
        const data = doc.data();
        const tutor = userMap.get(data.tutorId);
        const subject = subjectMap.get(data.subjectId);
        const student = data.studentId ? userMap.get(data.studentId) : undefined;
        const attendees = data.attendeeIds ? data.attendeeIds.map((id: string) => userMap.get(id)).filter(Boolean) as User[] : [];

        return {
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          tutor: tutor!,
          subject: subject!,
          student: student,
          attendees: attendees,
        } as TutoringSession;
      }).filter(s => s.tutor && s.subject && (s.isGlobal || s.student)); // Filter out sessions with missing refs

      this.sessionsSignal.set(sessions);
    });
  }


  getSessions() { return this.sessionsSignal; }
  getTutors() { return this.tutorsSignal; }
  getSubjects() { return this.subjectsSignal; }

  async updateSessionStatus(sessionId: string, status: SessionStatus) {
    const sessionRef = doc(this.db, 'sessions', sessionId);
    await updateDoc(sessionRef, { status });
  }

  async updateSessionDetails(sessionId: string, details: Partial<Pick<TutoringSession, 'sessionLink' | 'comments' | 'materials'>>) {
    const sessionRef = doc(this.db, 'sessions', sessionId);
    await updateDoc(sessionRef, details);
  }

  async updateTutorSubjects(tutorId: string, subjectIds: string[]) {
    const tutorRef = doc(this.db, 'users', tutorId);
    await updateDoc(tutorRef, { subjectIds });
  }

  async addStudentToGlobalSession(sessionId: string, studentId: string) {
    const sessionRef = doc(this.db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      attendeeIds: arrayUnion(studentId)
    });
  }

  async createTutoringRequest(sessionData: Partial<TutoringSession>) {
    const tutor = await this.getUserById(sessionData.tutorId!);
    const subject = this.subjectsSignal().find(s => s.id === sessionData.subjectId!);
    const student = await this.getUserById(sessionData.studentId!);

    if (!tutor || !subject || !student) {
      throw new Error("Invalid tutor, subject, or student for new session.");
    }

    const sessionDoc = {
      ...sessionData,
      date: Timestamp.fromDate(sessionData.date!),
      status: 'pending' as SessionStatus,
      tutorName: tutor.name, // denormalized
      subjectName: subject.name, // denormalized
      studentName: student.name, // denormalized
    };
    await addDoc(collection(this.db, 'sessions'), sessionDoc);
  }

  async createGlobalSession(sessionData: Partial<TutoringSession>) {
    const tutor = await this.getUserById(sessionData.tutorId!);
    const subject = this.subjectsSignal().find(s => s.id === sessionData.subjectId!);

    if (!tutor || !subject) {
      throw new Error("Invalid tutor or subject for new global session.");
    }

    const sessionDoc = {
      ...sessionData,
      date: Timestamp.fromDate(sessionData.date!),
      status: 'confirmed' as SessionStatus,
      attendeeIds: [],
      tutorName: tutor.name, // denormalized
      subjectName: subject.name, // denormalized
    };
    await addDoc(collection(this.db, 'sessions'), sessionDoc);
  }

  private async getUserById(userId: string): Promise<User | undefined> {
    let user = this.usersSignal().find(u => u.id === userId);
    if (user) return user;

    // If not in cache, fetch from DB as a fallback
    const userRef = doc(this.db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return fromDoc<User>(docSnap);
    }
    return undefined;
  }
  
  public async seedDatabase() {
    console.log('Checking if database needs seeding...');

    // 1. Seed Subjects
    const subjectsCollectionRef = collection(this.db, 'subjects');
    const subjectsSnapshot = await getDocs(query(subjectsCollectionRef, limit(1)));
    let subjectIds: string[] = [];

    if (subjectsSnapshot.empty) {
      console.log('Seeding subjects...');
      const subjectsToAdd = [
        { name: 'Calculus I' },
        { name: 'Programming Foundations' },
        { name: 'Organic Chemistry' },
        { name: 'Spanish Language' },
        { name: 'World History' },
        { name: 'Physics for Engineers' }
      ];
      const subjectPromises = subjectsToAdd.map(subject => addDoc(subjectsCollectionRef, subject));
      const subjectRefs = await Promise.all(subjectPromises);
      subjectIds = subjectRefs.map(ref => ref.id);
      console.log('Subjects seeded.');
    } else {
       const allSubjectsSnapshot = await getDocs(subjectsCollectionRef);
       subjectIds = allSubjectsSnapshot.docs.map(doc => doc.id);
    }

    // 2. Seed Tutors
    const usersCollectionRef = collection(this.db, 'users');
    const tutorsQuery = query(usersCollectionRef, where('role', '==', 'tutor'), limit(1));
    const tutorsSnapshot = await getDocs(tutorsQuery);

    if (tutorsSnapshot.empty) {
      console.log('Seeding tutors...');
      if (subjectIds.length < 6) {
          console.error("Not enough subjects to seed tutors. Need at least 6.");
          return;
      }

      const tutorsToAdd: Omit<User, 'id'>[] = [
        {
          name: 'Dr. Evelyn Reed',
          email: 'e.reed@tutor.link',
          role: 'tutor',
          username: 'evelynreed',
          subjectIds: [subjectIds[0], subjectIds[5]] // Calculus I, Physics
        },
        {
          name: 'Prof. Alan Grant',
          email: 'a.grant@tutor.link',
          role: 'tutor',
          username: 'alangrant',
          subjectIds: [subjectIds[2], subjectIds[4]] // Organic Chemistry, World History
        },
        {
          name: 'Dr. Ellie Sattler',
          email: 'e.sattler@tutor.link',
          role: 'tutor',
          username: 'elliesattler',
          subjectIds: [subjectIds[1], subjectIds[3]] // Programming, Spanish
        }
      ];

      const tutorPromises = tutorsToAdd.map(tutor => addDoc(usersCollectionRef, tutor));
      await Promise.all(tutorPromises);
      console.log('Tutors seeded.');
    }
     console.log('Database seeding check complete.');
  }
}
