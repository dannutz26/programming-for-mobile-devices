import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly ngZone = inject(NgZone);

  // Manual simulation mode: 'auto' (actual browser network), 'online', or 'offline'
  private simulationMode: 'auto' | 'online' | 'offline' = 'auto';

  private readonly isOnlineSubject = new BehaviorSubject<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  readonly isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange());
      window.addEventListener('offline', () => this.handleNetworkChange());
    }
  }

  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  get isSimulated(): boolean {
    return this.simulationMode !== 'auto';
  }

  get currentMode(): 'auto' | 'online' | 'offline' {
    return this.simulationMode;
  }

  /** Toggle simulated offline/online for easy demonstration in browser */
  toggleSimulation(): void {
    if (this.simulationMode === 'auto') {
      this.setSimulationMode('offline');
    } else if (this.simulationMode === 'offline') {
      this.setSimulationMode('online');
    } else {
      this.setSimulationMode('auto');
    }
  }

  setSimulationMode(mode: 'auto' | 'online' | 'offline'): void {
    this.simulationMode = mode;
    this.handleNetworkChange();
  }

  private handleNetworkChange(): void {
    let effectiveOnline: boolean;
    if (this.simulationMode === 'offline') {
      effectiveOnline = false;
    } else if (this.simulationMode === 'online') {
      effectiveOnline = true;
    } else {
      effectiveOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    }

    this.ngZone.run(() => {
      console.log(`[NETWORK] Status changed -> ${effectiveOnline ? 'ONLINE' : 'OFFLINE'} (mode: ${this.simulationMode})`);
      this.isOnlineSubject.next(effectiveOnline);
    });
  }
}
