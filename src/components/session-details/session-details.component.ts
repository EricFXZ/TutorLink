import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { TutoringSession, UserRole } from '../../models/session.model';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-session-details',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, FormsModule],
  templateUrl: './session-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionDetailsComponent {
  session = input.required<TutoringSession>();
  userRole = input.required<UserRole>();
  close = output<void>();

  private dataService = inject(DataService);

  isTutor = computed(() => this.userRole() === 'tutor');

  // Editing states
  isEditingLink = signal(false);
  editableLink = signal('');

  isEditingComments = signal(false);
  editableComments = signal('');

  isAddingMaterial = signal(false);
  newMaterial = signal({ name: '', url: '' });

  closeModal() {
    this.close.emit();
  }

  // --- Session Link Methods ---
  editLink() {
    this.editableLink.set(this.session().sessionLink ?? '');
    this.isEditingLink.set(true);
  }

  saveLink() {
    this.dataService.updateSessionDetails(this.session().id, { sessionLink: this.editableLink() });
    this.isEditingLink.set(false);
  }

  cancelEditLink() {
    this.isEditingLink.set(false);
  }

  // --- Materials Methods ---
  addMaterial() {
    this.isAddingMaterial.set(true);
  }

  saveMaterial() {
    if (!this.newMaterial().name || !this.newMaterial().url) return;
    const updatedMaterials = [...this.session().materials, this.newMaterial()];
    this.dataService.updateSessionDetails(this.session().id, { materials: updatedMaterials });
    this.newMaterial.set({ name: '', url: '' });
    this.isAddingMaterial.set(false);
  }

  removeMaterial(index: number) {
    const updatedMaterials = [...this.session().materials];
    updatedMaterials.splice(index, 1);
    this.dataService.updateSessionDetails(this.session().id, { materials: updatedMaterials });
  }

  cancelAddMaterial() {
    this.isAddingMaterial.set(false);
    this.newMaterial.set({ name: '', url: '' });
  }

  // --- Comments Methods ---
  editComments() {
    this.editableComments.set(this.session().comments ?? '');
    this.isEditingComments.set(true);
  }

  saveComments() {
    this.dataService.updateSessionDetails(this.session().id, { comments: this.editableComments() });
    this.isEditingComments.set(false);
  }

  cancelEditComments() {
    this.isEditingComments.set(false);
  }
}