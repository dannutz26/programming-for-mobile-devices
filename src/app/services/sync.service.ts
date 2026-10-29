import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { Task } from '../models/task.model';
import { environment } from '../../environments/environment';

interface SyncResult {
  syncedCreated: { clientTempId: string; serverTask: Task }[];
  syncedUpdated: Task[];
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly networkService = inject(NetworkService);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);
  private readonly apiUrl = environment.apiUrl;

  private isSyncing = false;
  private readonly syncCompletedSubject = new BehaviorSubject<number>(0);
  readonly syncCompleted$ = this.syncCompletedSubject.asObservable();

  constructor() {
    // Automatically sync whenever we transition into online mode
    this.networkService.isOnline$
      .pipe(filter((online) => online === true))
      .subscribe(() => {
        if (this.authService.isAuthenticated()) {
          this.syncPendingData();
        }
      });
  }

  async syncPendingData(): Promise<boolean> {
    if (this.isSyncing || !this.networkService.isOnline || !this.authService.isAuthenticated()) {
      return false;
    }

    const unsynced = this.storageService.getUnsyncedTasks();
    if (unsynced.length === 0) {
      return false;
    }

    this.isSyncing = true;
    console.log(`[SYNC] Starting automatic sync of ${unsynced.length} pending offline item(s)...`);

    const created = unsynced.filter((t) => t._isNewOffline);
    const updated = unsynced.filter((t) => !t._isNewOffline);

    try {
      const response = await firstValueFrom(
        this.http.post<SyncResult>(`${this.apiUrl}/tasks/sync`, { created, updated })
      );

      // Update local storage with confirmed server tasks
      response.syncedCreated.forEach((item) => {
        this.storageService.markSynced(item.clientTempId, item.serverTask);
      });

      response.syncedUpdated.forEach((item) => {
        this.storageService.markSynced(item.id, item);
      });

      this.storageService.refreshUnsyncedCount();
      const totalSynced = response.syncedCreated.length + response.syncedUpdated.length;

      console.log(`[SYNC] Successfully synced ${totalSynced} item(s) to server.`);
      await this.showToast(`Synced ${totalSynced} offline item(s) with server`, 'success');
      this.syncCompletedSubject.next(Date.now());
      return true;
    } catch (err) {
      console.error('[SYNC] Failed to sync offline data to server:', err);
      await this.showToast('Failed to sync offline items. Will retry when connected.', 'warning');
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      position: 'top',
      color,
    });
    await toast.present();
  }
}
