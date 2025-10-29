import { Injectable, signal } from '@angular/core';
import { TutoringSession, User, Subject, SessionStatus } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly tutorsSignal = signal<User[]>([
    { id: 101, name: 'Dr. Evelyn Reed', role: 'tutor', subjectIds: ['cs101', 'phy301'] },
    { id: 102, name: 'Prof. Marcus Chen', role: 'tutor', subjectIds: ['math202', 'chem101', 'cs101'] },
  ]);

  private readonly students: User[] = [
    { id: 201, name: 'Alice Johnson', role: 'student' },
    { id: 202, name: 'Bob Williams', role: 'student' },
  ];

  private readonly subjects: Subject[] = [
    { id: 'cs101', name: 'Intro to Programming' },
    { id: 'math202', name: 'Calculus II' },
    { id: 'phy301', name: 'Modern Physics' },
    { id: 'chem101', name: 'General Chemistry' },
  ];

  private sessionsSignal = signal<TutoringSession[]>([
    {
      id: 1,
      student: this.students[0],
      tutor: this.tutorsSignal()[0],
      subject: this.subjects[0],
      topic: 'Understanding Recursion',
      date: new Date(new Date().setDate(new Date().getDate() + 2)),
      durationMinutes: 60,
      status: 'confirmed',
      materials: [{ name: 'Recursion Slides.pdf', url: '#' }]
    },
    {
      id: 2,
      student: this.students[1],
      tutor: this.tutorsSignal()[1],
      subject: this.subjects[1],
      topic: 'Integration Techniques',
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      durationMinutes: 90,
      status: 'pending',
      materials: []
    },
    {
      id: 3,
      student: this.students[0],
      tutor: this.tutorsSignal()[1],
      subject: this.subjects[1],
      topic: 'Limits and Derivatives',
      date: new Date(new Date().setDate(new Date().getDate() - 5)),
      durationMinutes: 60,
      status: 'completed',
      materials: [{ name: 'Practice Problems.pdf', url: '#' }, { name: 'Session Recording.mp4', url: '#' }]
    }
  ]);

  getSessions() {
    return this.sessionsSignal;
  }

  getTutors() {
    return this.tutorsSignal;
  }

  getSubjects() {
    return signal(this.subjects);
  }

  updateSessionStatus(sessionId: number, status: SessionStatus) {
    this.sessionsSignal.update(sessions => 
        sessions.map(s => s.id === sessionId ? { ...s, status } : s)
    );
  }

  updateTutorSubjects(tutorId: number, subjectIds: string[]) {
    this.tutorsSignal.update(tutors =>
      tutors.map(tutor =>
        tutor.id === tutorId ? { ...tutor, subjectIds } : tutor
      )
    );
  }
}