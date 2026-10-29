import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly authService = inject(AuthService);

  private readonly unsyncedCountSubject = new BehaviorSubject<number>(0);
  readonly unsyncedCount$: Observable<number> = this.unsyncedCountSubject.asObservable();

  constructor() {
    this.refreshUnsyncedCount();
  }

  private getStorageKey(): string {
    const user = this.authService.getUsername();
    return `ionic2_tasks_${user}`;
  }

  /** Retrieve all locally stored tasks for current user */
  getStoredTasks(): Task[] {
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  }

  /** Overwrite or save all tasks in local storage */
  saveStoredTasks(tasks: Task[]): void {
    localStorage.setItem(this.getStorageKey(), JSON.stringify(tasks));
    this.refreshUnsyncedCount();
  }

  /** Save or update a single task in local storage */
  saveTask(task: Task): void {
    const tasks = this.getStoredTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...task };
    } else {
      tasks.unshift(task);
    }
    this.saveStoredTasks(tasks);
  }

  /** Merge server-fetched tasks into local storage (keeping any unsynced local modifications) */
  mergeServerTasks(serverTasks: Task[]): void {
    const localTasks = this.getStoredTasks();
    const unsyncedLocal = localTasks.filter((t) => t._unsynced);

    // Map existing tasks
    const taskMap = new Map<string, Task>();
    serverTasks.forEach((st) => taskMap.set(st.id, st));

    // Preserve unsynced items
    unsyncedLocal.forEach((ut) => {
      taskMap.set(ut.id, ut);
    });

    const merged = Array.from(taskMap.values());
    this.saveStoredTasks(merged);
  }

  /** Get only tasks that are marked as unsynced */
  getUnsyncedTasks(): Task[] {
    return this.getStoredTasks().filter((t) => t._unsynced === true);
  }

  /** Get count of unsynced items */
  getUnsyncedCount(): number {
    return this.getUnsyncedTasks().length;
  }

  /** Refresh count observable */
  refreshUnsyncedCount(): void {
    const count = this.getUnsyncedCount();
    this.unsyncedCountSubject.next(count);
  }

  /** Mark a task as synced (remove _unsynced flag and update ID if clientTempId) */
  markSynced(clientTempId: string, serverTask?: Task): void {
    const tasks = this.getStoredTasks();
    const index = tasks.findIndex((t) => t.id === clientTempId);
    if (index >= 0) {
      if (serverTask) {
        tasks[index] = { ...serverTask, _unsynced: false, _isNewOffline: false };
      } else {
        tasks[index]._unsynced = false;
        tasks[index]._isNewOffline = false;
      }
      this.saveStoredTasks(tasks);
    }
  }

  /** Clear stored tasks for current user */
  clear(): void {
    localStorage.removeItem(this.getStorageKey());
    this.unsyncedCountSubject.next(0);
  }
}
