export type UserRole = 'student' | 'tutor' | 'career_head';

export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: UserRole;
  username?: string;
  accountNumber?: string;
  subjectIds?: string[]; // For tutors
}

export interface Subject {
  id: string;
  name: string;
}

export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TutoringSession {
  id: string; // Firestore document ID

  // Denormalized data for easy display in lists
  studentName?: string;
  tutorName: string;
  subjectName: string;

  // Populated objects for details view
  student?: User;
  tutor: User;
  subject: Subject;
  
  // IDs for relationships
  studentId?: string;
  tutorId: string;
  subjectId: string;

  topic: string;
  date: Date;
  durationMinutes: number;
  status: SessionStatus;
  materials: { name: string; url: string }[];
  comments?: string;
  sessionLink?: string;
  
  isGlobal?: boolean;
  attendeeIds?: string[];
  attendees?: User[]; // Populated on demand for details view
  maxAttendees?: number;
  createdBy?: string; // Career Head ID
}
