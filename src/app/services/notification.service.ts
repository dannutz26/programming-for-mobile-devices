import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketEvent } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  /** Observable stream of WebSocket events */
  readonly notifications$ = new Subject<WebSocketEvent>();

  /** Open a WebSocket connection to the server */
  connect(): void {
    // Avoid duplicate connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    this.shouldReconnect = true;
    this.createConnection();
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

  private createConnection(): void {
    try {
      this.ws = new WebSocket(environment.wsUrl);

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string) as WebSocketEvent;
          this.notifications$.next(data);
        } catch {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };

      this.ws.onerror = (event: Event) => {
        console.error('WebSocket error:', event);
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onopen = () => {
        console.log('WebSocket connection established');
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already scheduled
    }
    console.log('Reconnecting WebSocket in 5 seconds...');
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.shouldReconnect) {
        this.createConnection();
      }
    }, 5000);
  }
}
