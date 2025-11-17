import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { SessionListComponent } from '../session-list/session-list.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { TutoringSession, User, UserRole } from '../../models/session.model';
import { SubjectManagerComponent } from '../subject-manager/subject-manager.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SessionListComponent, CalendarComponent, SubjectManagerComponent, RouterLink]
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private router = inject(Router);
  private authService = inject(AuthService);

  currentUserRole = computed<UserRole>(() => this.authService.currentUserProfile()?.role ?? 'student');
  currentUserProfile = this.authService.currentUserProfile;
  
  showRequestModal = signal(false);
  showSubjectManagerModal = signal(false);
  showGlobalSessionModal = signal(false);

  allSessions = this.dataService.getSessions();
  subjects = this.dataService.getSubjects();
  tutors = this.dataService.getTutors();

  studentUpcomingSessions = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s => {
      const isJoinedGlobal = s.isGlobal && (s.attendeeIds ?? []).includes(user.id);
      const isPersonal = !s.isGlobal && s.studentId === user.id && s.status === 'confirmed';
      return (isJoinedGlobal || isPersonal) && s.date > new Date();
    });
  });

  studentPastSessions = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s => {
      const isJoinedGlobal = s.isGlobal && (s.attendeeIds ?? []).includes(user.id);
      const isPersonal = !s.isGlobal && s.studentId === user.id;
      return (isJoinedGlobal || isPersonal) && (s.status === 'completed' || s.status === 'cancelled' || s.date <= new Date());
    });
  });

  availableGlobalSessions = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s =>
      s.isGlobal &&
      s.date > new Date() &&
      s.status === 'confirmed' &&
      ((s.attendeeIds?.length ?? 0) < (s.maxAttendees ?? Infinity)) &&
      !(s.attendeeIds ?? []).includes(user.id)
    );
  });

  tutorPendingRequests = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s =>
      !s.isGlobal && s.tutorId === user.id && s.status === 'pending'
    );
  });

  tutorUpcomingSessions = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s =>
      s.tutorId === user.id && s.status === 'confirmed' && s.date > new Date()
    );
  });

  tutorPastSessions = computed(() => {
    const user = this.currentUserProfile();
    if (!user) return [];
    return this.allSessions().filter(s => 
      s.tutorId === user.id && (s.status === 'completed' || s.status === 'cancelled' || s.date <= new Date())
    );
  });

  careerHeadUpcomingSessions = computed(() => this.allSessions().filter(s =>
    s.isGlobal && s.date > new Date()
  ));

  careerHeadPastSessions = computed(() => this.allSessions().filter(s =>
    s.isGlobal && s.date <= new Date()
  ));

  newRequestSubjectId = signal('');
  newRequestTopic = signal('');
  newRequestTutorId = signal<string | null>(null);
  newRequestDate = signal('');

  newGlobalSubjectId = signal('');
  newGlobalTopic = signal('');
  newGlobalTutorId = signal<string | null>(null);
  newGlobalDate = signal('');
  newGlobalDuration = signal(90);
  newGlobalMaxAttendees = signal(20);

  filteredTutorsForStudent = computed(() => {
    const selectedSubjectId = this.newRequestSubjectId();
    if (!selectedSubjectId) {
      return [];
    }
    return this.tutors().filter(tutor => tutor.subjectIds?.includes(selectedSubjectId));
  });

  filteredTutorsForGlobal = computed(() => {
    const selectedSubjectId = this.newGlobalSubjectId();
    if (!selectedSubjectId) {
      return this.tutors();
    }
    return this.tutors().filter(tutor => tutor.subjectIds?.includes(selectedSubjectId));
  });

  onSubjectChange() {
    this.newRequestTutorId.set(null);
  }

  onGlobalSubjectChange() {
    this.newGlobalTutorId.set(null);
  }

  openRequestModal() {
    this.showRequestModal.set(true);
  }

  closeRequestModal() {
    this.showRequestModal.set(false);
    this.newRequestSubjectId.set('');
    this.newRequestTopic.set('');
    this.newRequestTutorId.set(null);
    this.newRequestDate.set('');
  }

  openSubjectManagerModal() {
    this.showSubjectManagerModal.set(true);
  }

  closeSubjectManagerModal() {
    this.showSubjectManagerModal.set(false);
  }

  openGlobalSessionModal() {
    this.showGlobalSessionModal.set(true);
  }

  closeGlobalSessionModal() {
    this.showGlobalSessionModal.set(false);
    this.newGlobalSubjectId.set('');
    this.newGlobalTopic.set('');
    this.newGlobalTutorId.set(null);
    this.newGlobalDate.set('');
    this.newGlobalDuration.set(90);
    this.newGlobalMaxAttendees.set(20);
  }

  async submitRequest() {
    const subjectId = this.newRequestSubjectId();
    const topic = this.newRequestTopic();
    const date = this.newRequestDate();
    const tutorId = this.newRequestTutorId();
    const student = this.currentUserProfile();

    if (!subjectId || !topic || !date || !tutorId || !student) return;

    const newSessionData: Partial<TutoringSession> = {
      studentId: student.id,
      tutorId: tutorId,
      subjectId: subjectId,
      topic: topic,
      date: new Date(date),
      durationMinutes: 60,
      materials: []
    };
    try {
      await this.dataService.createTutoringRequest(newSessionData);
      this.closeRequestModal();
    } catch (error) {
      console.error("Failed to create request:", error);
      // Optionally show an error to the user
    }
  }
  
  async submitGlobalSession() {
    const subjectId = this.newGlobalSubjectId();
    const topic = this.newGlobalTopic();
    const date = this.newGlobalDate();
    const tutorId = this.newGlobalTutorId();
    const careerHead = this.currentUserProfile();

    if (!subjectId || !topic || !date || !tutorId || !careerHead) return;

    const newSessionData: Partial<TutoringSession> = {
      tutorId: tutorId,
      subjectId: subjectId,
      topic: topic,
      date: new Date(date),
      durationMinutes: Number(this.newGlobalDuration()),
      materials: [],
      isGlobal: true,
      maxAttendees: Number(this.newGlobalMaxAttendees()),
      createdBy: careerHead.id
    };
    try {
      await this.dataService.createGlobalSession(newSessionData);
      this.closeGlobalSessionModal();
    } catch (error) {
      console.error("Failed to create global session:", error);
    }
  }
}
