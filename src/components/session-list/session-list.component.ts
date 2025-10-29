import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { TutoringSession, UserRole, SessionStatus } from '../../models/session.model';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  templateUrl: './session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, TitleCasePipe]
})
export class SessionListComponent {
  private dataService = inject(DataService);

  title = input.required<string>();
  sessions = input.required<TutoringSession[]>();
  userRole = input.required<UserRole>();
  
  isTutor = computed(() => this.userRole() === 'tutor');

  getStatusColor(status: SessionStatus): string {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  approveRequest(sessionId: number) {
    this.dataService.updateSessionStatus(sessionId, 'confirmed');
  }

  rejectRequest(sessionId: number) {
    this.dataService.updateSessionStatus(sessionId, 'cancelled');
  }
}
