import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { TutoringSession, UserRole, SessionStatus } from '../../models/session.model';
import { DataService } from '../../services/data.service';
import { SessionDetailsComponent } from '../session-details/session-details.component';

@Component({
  selector: 'app-session-list',
  standalone: true,
  templateUrl: './session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, TitleCasePipe, SessionDetailsComponent]
})
export class SessionListComponent {
  private dataService = inject(DataService);

  title = input.required<string>();
  sessions = input.required<TutoringSession[]>();
  userRole = input.required<UserRole>();
  currentUserId = input<string | null>(null);
  
  isTutor = computed(() => this.userRole() === 'tutor');

  activeMenuId = signal<string | null>(null);

  showConfirmation = signal(false);
  sessionToActOnId = signal<string | null>(null);
  confirmationDetails = signal({ title: '', message: '' });

  selectedSession = signal<TutoringSession | null>(null);

  toggleMenu(sessionId: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeMenuId.update(id => (id === sessionId ? null : sessionId));
  }
  
  closeMenu() {
    this.activeMenuId.set(null);
  }

  viewSessionDetails(session: TutoringSession) {
    this.selectedSession.set(session);
  }

  closeDetailsModal() {
    this.selectedSession.set(null);
  }

  getStatusColor(status: SessionStatus): string {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  approveRequest(sessionId: string) {
    this.dataService.updateSessionStatus(sessionId, 'confirmed');
    this.closeMenu();
  }

  initiateCancellation(sessionId: string, action: 'reject' | 'cancel') {
    this.sessionToActOnId.set(sessionId);
    if (action === 'reject') {
      this.confirmationDetails.set({
        title: 'Reject Session Request',
        message: 'Are you sure you want to reject this tutoring session request? This action cannot be undone.'
      });
    } else {
      this.confirmationDetails.set({
        title: 'Cancel Session',
        message: 'Are you sure you want to cancel this session? This action cannot be undone.'
      });
    }
    this.showConfirmation.set(true);
    this.closeMenu();
  }

  onConfirmCancellation() {
    const id = this.sessionToActOnId();
    if (id !== null) {
      this.dataService.updateSessionStatus(id, 'cancelled');
    }
    this.resetCancellationState();
  }

  onCancelCancellation() {
    this.resetCancellationState();
  }

  private resetCancellationState() {
    this.showConfirmation.set(false);
    this.sessionToActOnId.set(null);
  }

  joinSession(sessionId: string) {
    const studentId = this.currentUserId();
    if (this.userRole() === 'student' && studentId) {
      this.dataService.addStudentToGlobalSession(sessionId, studentId);
    }
  }

  hasJoined(session: TutoringSession): boolean {
    if (!session.isGlobal || this.userRole() !== 'student') return false;
    const studentId = this.currentUserId();
    if (!studentId) return false;
    return (session.attendeeIds ?? []).includes(studentId);
  }
}