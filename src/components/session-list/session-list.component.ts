import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
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

  // --- Confirmation Modal State ---
  showConfirmation = signal(false);
  sessionToActOn = signal<TutoringSession | null>(null);
  confirmationAction = signal<'reject' | 'cancel' | 'pay' | 'unpay' | null>(null);
  confirmationDetails = signal({
    title: '',
    message: '',
    icon: 'warning' as 'warning' | 'payment' | 'info',
    iconBgColor: 'bg-red-100',
    iconTextColor: 'text-red-600',
    confirmButtonClass: 'bg-red-600 hover:bg-red-700',
    confirmButtonText: 'Confirm'
  });

  selectedSessionId = signal<string | null>(null);
  selectedSession = computed(() => {
    const id = this.selectedSessionId();
    if (!id) return null;
    return this.sessions().find(s => s.id === id) ?? null;
  });

  toggleMenu(sessionId: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeMenuId.update(id => (id === sessionId ? null : sessionId));
  }
  
  closeMenu() {
    this.activeMenuId.set(null);
  }

  viewSessionDetails(session: TutoringSession) {
    this.selectedSessionId.set(session.id);
  }

  closeDetailsModal() {
    this.selectedSessionId.set(null);
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

  markAsCompleted(sessionId: string) {
    this.dataService.updateSessionStatus(sessionId, 'completed');
    this.closeMenu();
  }

  initiateAction(session: TutoringSession, action: 'reject' | 'cancel' | 'pay' | 'unpay') {
    this.sessionToActOn.set(session);
    this.confirmationAction.set(action);

    switch (action) {
      case 'reject':
        this.confirmationDetails.set({
          title: 'Reject Session Request',
          message: 'Are you sure you want to reject this request? This cannot be undone.',
          icon: 'warning', iconBgColor: 'bg-red-100 dark:bg-red-900', iconTextColor: 'text-red-600 dark:text-red-400',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700', confirmButtonText: 'Reject'
        });
        break;
      case 'cancel':
        this.confirmationDetails.set({
          title: 'Cancel Session',
          message: 'Are you sure you want to cancel this session? This cannot be undone.',
          icon: 'warning', iconBgColor: 'bg-red-100 dark:bg-red-900', iconTextColor: 'text-red-600 dark:text-red-400',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700', confirmButtonText: 'Cancel Session'
        });
        break;
      case 'pay':
        const paymentAmount = (session.durationMinutes / 60 * 170).toFixed(2);
        this.confirmationDetails.set({
          title: 'Confirm Payment',
          message: `Mark this session as paid? Payment to tutor: Lps ${paymentAmount}.`,
          icon: 'payment', iconBgColor: 'bg-green-100 dark:bg-green-900', iconTextColor: 'text-green-600 dark:text-green-400',
          confirmButtonClass: 'bg-green-600 hover:bg-green-700', confirmButtonText: 'Mark as Paid'
        });
        break;
      case 'unpay':
        this.confirmationDetails.set({
          title: 'Reverse Payment',
          message: 'Are you sure you want to mark this session as unpaid?',
          icon: 'warning', iconBgColor: 'bg-yellow-100 dark:bg-yellow-900', iconTextColor: 'text-yellow-600 dark:text-yellow-400',
          confirmButtonClass: 'bg-yellow-500 hover:bg-yellow-600', confirmButtonText: 'Mark as Unpaid'
        });
        break;
    }
    this.showConfirmation.set(true);
    this.closeMenu();
  }

  onConfirmAction() {
    const session = this.sessionToActOn();
    const action = this.confirmationAction();
    if (session && action) {
      switch (action) {
        case 'reject':
        case 'cancel':
          this.dataService.updateSessionStatus(session.id, 'cancelled');
          break;
        case 'pay':
          this.dataService.updateSessionPaymentStatus(session.id, true);
          break;
        case 'unpay':
          this.dataService.updateSessionPaymentStatus(session.id, false);
          break;
      }
    }
    this.resetConfirmationState();
  }

  onCancelConfirmation() {
    this.resetConfirmationState();
  }

  private resetConfirmationState() {
    this.showConfirmation.set(false);
    this.sessionToActOn.set(null);
    this.confirmationAction.set(null);
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