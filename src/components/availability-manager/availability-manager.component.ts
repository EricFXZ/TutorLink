import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-availability-manager',
  standalone: true,
  templateUrl: './availability-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AvailabilityManagerComponent {
  close = output<void>();

  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  timeSlots = this.generateTimeSlots();
  
  // Mock initial availability. In a real app, this would be fetched.
  availableSlots = signal<Record<string, Set<string>>>({
    Mon: new Set(['09:00', '09:30', '10:00', '14:00']),
    Tue: new Set(['10:00', '10:30', '11:00', '11:30', '15:30']),
    Wed: new Set(['09:00', '13:00', '13:30']),
    Thu: new Set(['11:00', '11:30', '16:00', '16:30']),
    Fri: new Set(['09:30', '10:00', '14:30', '15:00']),
  });

  private generateTimeSlots(): string[] {
    const slots = [];
    for (let i = 8; i < 18; i++) {
      const hour = i.toString().padStart(2, '0');
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  }

  isAvailable(day: string, time: string): boolean {
    return this.availableSlots()[day]?.has(time) ?? false;
  }

  toggleAvailability(day: string, time: string) {
    this.availableSlots.update(currentSlots => {
      const daySlots = currentSlots[day] ? new Set(currentSlots[day]) : new Set<string>();
      if (daySlots.has(time)) {
        daySlots.delete(time);
      } else {
        daySlots.add(time);
      }
      return { ...currentSlots, [day]: daySlots };
    });
  }

  saveChanges() {
    console.log('Saving availability:', this.availableSlots());
    // Here you would typically call a service to persist the changes.
    this.close.emit();
  }

  closeModal() {
    this.close.emit();
  }
}
