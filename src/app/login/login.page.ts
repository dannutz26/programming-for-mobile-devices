import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logInOutline,
  personAddOutline,
  personOutline,
  lockClosedOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
  ],
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);

  mode: 'login' | 'register' = 'login';
  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor() {
    addIcons({
      logInOutline,
      personAddOutline,
      personOutline,
      lockClosedOutline,
      sparklesOutline,
    });
  }

  onModeChange(event: CustomEvent): void {
    this.mode = event.detail.value as 'login' | 'register';
    this.errorMessage = '';
  }

  quickLogin(user: 'alice' | 'bob'): void {
    this.username = user;
    this.password = 'password';
    this.mode = 'login';
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const request$ =
      this.mode === 'login'
        ? this.authService.login(this.username.trim(), this.password)
        : this.authService.register(this.username.trim(), this.password);

    request$.subscribe({
      next: (res) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.showToast(
          this.mode === 'login'
            ? `Welcome back, ${res.user.username}!`
            : `Account created for ${res.user.username}!`,
          'success'
        );
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        this.loading = false;
        const msg =
          err?.error?.error ||
          (this.mode === 'login'
            ? 'Login failed. Check your credentials.'
            : 'Registration failed. Try another username.');
        this.errorMessage = msg;
        this.cdr.detectChanges();
      },
    });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
