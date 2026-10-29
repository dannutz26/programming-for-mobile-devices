import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketEvent } from '../models/task.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NetworkService } from './network.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly authService = inject(AuthService);
  private readonly networkService = inject(NetworkService);

  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  /** Observable stream of WebSocket events */
  readonly notifications$ = new Subject<WebSocketEvent>();

  /** Open an authenticated WebSocket connection */
  connect(): void {
    const token = this.authService.getToken();
    if (!token || !this.networkService.isOnline) {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.shouldReconnect = true;
    this.createConnection(token);
  }

  /** Close the WebSocket connection and stop reconnecting */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private createConnection(token: string): void {
    try {
      const url = `${environment.wsUrl}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Authenticated WebSocket connected successfully');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as WebSocketEvent;
          this.notifications$.next(data);
        } catch {
          console.error('[WS] Failed to parse WebSocket message:', event.data);
        }
      };

      this.ws.onerror = (event: Event) => {
        console.warn('[WS] WebSocket error:', event);
      };

      this.ws.onclose = (event: CloseEvent) => {
        console.log(`[WS] Connection closed (code: ${event.code}, reason: ${event.reason})`);
        this.ws = null;
        if (this.shouldReconnect && this.networkService.isOnline && this.authService.isAuthenticated()) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('[WS] Failed to instantiate WebSocket:', error);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect && this.networkService.isOnline && this.authService.isAuthenticated()) {
        const token = this.authService.getToken();
        if (token) {
          console.log('[WS] Attempting reconnection...');
          this.createConnection(token);
        }
      }
    }, 4000);
  }
}
