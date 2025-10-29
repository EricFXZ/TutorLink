import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-subject-manager',
  standalone: true,
  templateUrl: './subject-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class SubjectManagerComponent {
  close = output<void>();
  dataService = inject(DataService);

  tutorId = input.required<number>();

  allSubjects = this.dataService.getSubjects();
  tutor = computed(() => this.dataService.getTutors()().find(t => t.id === this.tutorId()));

  selectedSubjectIds = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const currentSubjectIds = this.tutor()?.subjectIds ?? [];
      this.selectedSubjectIds.set(new Set(currentSubjectIds));
    }, { allowSignalWrites: true });
  }

  toggleSubject(subjectId: string) {
    this.selectedSubjectIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(subjectId)) {
        newIds.delete(subjectId);
      } else {
        newIds.add(subjectId);
      }
      return newIds;
    });
  }

  saveChanges() {
    this.dataService.updateTutorSubjects(this.tutorId(), Array.from(this.selectedSubjectIds()));
    this.close.emit();
  }

  closeModal() {
    this.close.emit();
  }
}