import { Injectable, signal, inject } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, Auth, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, Firestore, getDoc, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { Router } from '@angular/router';
import { User } from '../models/session.model';

const firebaseConfig = {
  apiKey: "AIzaSyDx9XHUD6RGYX2KxLcj1FS105vFofsSpsY",
  authDomain: "tutorlink-c718a.firebaseapp.com",
  projectId: "tutorlink-c718a",
  storageBucket: "tutorlink-c718a.firebasestorage.app",
  messagingSenderId: "993585128697",
  appId: "1:993585128697:web:ec3403766e6e923b48ee28",
  measurementId: "G-M2YSS3G3KM"
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly auth: Auth;
  private readonly db: Firestore;
  
  currentUser = signal<FirebaseUser | null>(null);
  currentUserProfile = signal<User | null>(null);
  authInitialized = signal(false);

  constructor() {
    const app: FirebaseApp = initializeApp(firebaseConfig);
    getAnalytics(app);
    this.auth = getAuth(app);
    this.db = getFirestore(app);

    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.set(user);
      if (user) {
        const userDocRef = doc(this.db, 'users', user.uid);
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            this.currentUserProfile.set({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            console.error("User profile not found in Firestore!");
            this.currentUserProfile.set(null);
            this.logout(); // Log out user if profile doesn't exist
          }
        });
      } else {
        this.currentUserProfile.set(null);
      }
      this.authInitialized.set(true);
    });
  }

  async register(registrationData: { [key: string]: string }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, registrationData.email, registrationData.password);
      const user = userCredential.user;

      const newUser: User = {
        id: user.uid,
        name: registrationData.name,
        email: registrationData.email,
        username: registrationData.username,
        accountNumber: registrationData.accountNumber,
        role: 'student' // Default role
      };

      await setDoc(doc(this.db, "users", user.uid), newUser);
      
      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const userDocRef = doc(this.db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const userProfile = docSnap.data() as User;
        switch (userProfile.role) {
          case 'student':
            this.router.navigate(['/student']);
            break;
          case 'tutor':
            this.router.navigate(['/tutor']);
            break;
          case 'career_head':
            this.router.navigate(['/career-head']);
            break;
          default:
            this.router.navigate(['/student']);
        }
      } else {
        // Fallback, should ideally not happen.
        this.router.navigate(['/student']);
      }
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUserProfile.set(null);
    this.router.navigate(['/login']);
  }
}