import { ChangeDetectionStrategy, Component, input, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

interface Day {
  date: Date;
  name: string;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe]
})
export class CalendarComponent {
  isTutorView = input<boolean>(false);
  currentDate = signal(new Date());

  weekDays = computed<Day[]>(() => {
    const startOfWeek = this.getStartOfWeek(this.currentDate());
    const days: Day[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push({
        date: date,
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: this.isSameDay(date, new Date()),
      });
    }
    return days;
  });

  timeSlots = this.generateTimeSlots();

  private getStartOfWeek(date: Date): Date {
    const dt = new Date(date);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(dt.setDate(diff));
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private generateTimeSlots(): string[] {
    const slots = [];
    for (let i = 8; i < 18; i++) {
      slots.push(`${i}:00`);
      slots.push(`${i}:30`);
    }
    return slots;
  }

  previousWeek() {
    this.currentDate.update(date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }

  nextWeek() {
    this.currentDate.update(date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }
  
  isSlotAvailable(day: Day, time: string): boolean {
    if (this.isTutorView()) return false;
    const hour = parseInt(time.split(':')[0]);
    const dayOfWeek = day.date.getDay();
    // Mock availability: Mon-Fri, 9am-5pm
    return dayOfWeek > 0 && dayOfWeek < 6 && hour >= 9 && hour < 17;
  }

  isSlotBooked(day: Day, time: string): boolean {
    const hour = parseInt(time.split(':')[0]);
    const dayOfWeek = day.date.getDay();
     // Mock booking: Tuesday at 10:00
    return dayOfWeek === 2 && hour === 10;
  }
}
