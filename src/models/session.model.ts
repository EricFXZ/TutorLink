export type UserRole = 'student' | 'tutor';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  subjectIds?: string[];
}

export interface Subject {
  id: string;
  name: string;
}

export type SessionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface TutoringSession {
  id: number;
  student: User;
  tutor: User;
  subject: Subject;
  topic: string;
  date: Date;
  durationMinutes: number;
  status: SessionStatus;
  materials: { name: string; url: string }[];
}