import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models/task.model';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'ionic2_auth_token';
const USER_KEY = 'ionic2_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          this.setSession(res.token, res.user);
        })
      );
  }

  register(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, { username, password })
      .pipe(
        tap((res) => {
          this.setSession(res.token, res.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUsername(): string {
    return this.currentUserSubject.value?.username || 'anonymous';
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && token.length > 10;
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }
}
