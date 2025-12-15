import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  isLoginView = signal(true);
  errorMessage = signal<string | null>(null);

  // Login form model
  loginCredentials = {
    email: '',
    password: ''
  };

  // Registration form model
  registration = {
    username: '',
    email: '',
    password: '',
    name: '',
    accountNumber: ''
  };

  async login() {
    this.errorMessage.set(null);
    try {
      await this.authService.login(this.loginCredentials.email, this.loginCredentials.password);
      // Navigation is handled by the auth service on success
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'auth/invalid-credential') {
          this.errorMessage.set('Invalid email or password. Please try again or sign up.');
        } else {
          this.errorMessage.set('An unexpected error occurred during login.');
        }
      } else {
        this.errorMessage.set('An unexpected error occurred.');
      }
      console.error('Login error:', error);
    }
  }
  
  async register() {
    this.errorMessage.set(null);
    if (!this.registration.email || !this.registration.password || !this.registration.name || !this.registration.username || !this.registration.accountNumber) {
      this.errorMessage.set('All fields are required for registration.');
      return;
    }
    try {
      await this.authService.register(this.registration);
      alert('Registration successful! Please sign in with your new account.');
      this.isLoginView.set(true);
      this.registration = { username: '', email: '', password: '', name: '', accountNumber: '' };
    } catch (error: any) {
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
            this.errorMessage.set('This email is already registered. Please sign in.');
        } else if (errorCode === 'auth/weak-password') {
            this.errorMessage.set('Password must be at least 6 characters long.');
        } else {
            this.errorMessage.set('An unexpected error occurred during registration.');
        }
    } else {
        this.errorMessage.set('An unexpected error occurred.');
    }
      console.error('Registration error:', error);
    }
  }

  toggleView() {
    this.isLoginView.update(value => !value);
    this.errorMessage.set(null);
  }
}
