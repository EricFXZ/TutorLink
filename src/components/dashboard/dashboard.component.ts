import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { SessionListComponent } from '../session-list/session-list.component';
import { CalendarComponent } from '../calendar/calendar.component';
import { TutoringSession, UserRole } from '../../models/session.model';
import { AvailabilityManagerComponent } from '../availability-manager/availability-manager.component';
import { SubjectManagerComponent } from '../subject-manager/subject-manager.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SessionListComponent, CalendarComponent, AvailabilityManagerComponent, SubjectManagerComponent, RouterLink]
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private router = inject(Router);

  currentUserRole = computed<UserRole>(() => this.router.url.includes('/student') ? 'student' : 'tutor');
  showRequestModal = signal(false);
  showAvailabilityModal = signal(false);
  showSubjectManagerModal = signal(false);

  allSessions = this.dataService.getSessions();
  subjects = this.dataService.getSubjects();
  tutors = this.dataService.getTutors();

  currentStudentId = 201; // Alice Johnson
  currentTutorId = 101; // Dr. Evelyn Reed

  studentUpcomingSessions = computed(() => this.allSessions().filter(s =>
    s.student.id === this.currentStudentId && s.status === 'confirmed' && s.date > new Date()
  ));
  studentPastSessions = computed(() => this.allSessions().filter(s =>
    s.student.id === this.currentStudentId && (s.status === 'completed' || s.status === 'cancelled')
  ));

  tutorPendingRequests = computed(() => this.allSessions().filter(s =>
    s.tutor.id === this.currentTutorId && s.status === 'pending'
  ));
  tutorUpcomingSessions = computed(() => this.allSessions().filter(s =>
    s.tutor.id === this.currentTutorId && s.status === 'confirmed' && s.date > new Date()
  ));

  newRequest = {
    subjectId: '',
    topic: '',
    tutorId: null as number | null,
    date: ''
  };

  filteredTutors = computed(() => {
    const selectedSubjectId = this.newRequest.subjectId;
    if (!selectedSubjectId) {
      return [];
    }
    return this.tutors().filter(tutor => tutor.subjectIds?.includes(selectedSubjectId));
  });

  onSubjectChange() {
    this.newRequest.tutorId = null;
  }

  openRequestModal() {
    this.showRequestModal.set(true);
  }

  closeRequestModal() {
    this.showRequestModal.set(false);
  }

  openAvailabilityModal() {
    this.showAvailabilityModal.set(true);
  }

  closeAvailabilityModal() {
    this.showAvailabilityModal.set(false);
  }

  openSubjectManagerModal() {
    this.showSubjectManagerModal.set(true);
  }

  closeSubjectManagerModal() {
    this.showSubjectManagerModal.set(false);
  }

  submitRequest() {
    if (!this.newRequest.subjectId || !this.newRequest.topic || !this.newRequest.date || !this.newRequest.tutorId) return;

    const newSession: TutoringSession = {
      id: Date.now(),
      student: { id: this.currentStudentId, name: 'Alice Johnson', role: 'student' },
      tutor: this.tutors().find(t => t.id === Number(this.newRequest.tutorId))!,
      subject: this.subjects().find(s => s.id === this.newRequest.subjectId)!,
      topic: this.newRequest.topic,
      date: new Date(this.newRequest.date),
      durationMinutes: 60,
      status: 'pending',
      materials: []
    };
    this.allSessions.update(sessions => [...sessions, newSession]);
    this.closeRequestModal();
  }
}