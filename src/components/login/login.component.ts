import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  private router = inject(Router);

  isLoginView = signal(true);

  // Registration form model
  registration = {
    username: '',
    email: '',
    password: '',
    name: '',
    accountNumber: ''
  };

  login() {
    // In a real app, you'd have authentication logic here.
    // For this mockup, we'll just navigate.
    this.router.navigate(['/student']);
  }
  
  register() {
    console.log('Registering user:', this.registration);
    // After registration, switch back to login view
    this.isLoginView.set(true);
    // In a real app, you might show a success message.
  }

  toggleView() {
    this.isLoginView.update(value => !value);
  }
}