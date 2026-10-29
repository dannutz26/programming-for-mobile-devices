import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { PaginatedTasks, Task } from '../models/task.model';
import { environment } from '../../environments/environment';
import { NetworkService } from './network.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly networkService = inject(NetworkService);
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetch paginated tasks.
   * If online: requests REST API and merges results into local storage.
   * If offline or REST fails: computes pagination, search, and filter from local storage!
   */
  getTasks(
    page = 1,
    limit = 5,
    search = '',
    status: 'all' | 'pending' | 'completed' = 'all'
  ): Observable<PaginatedTasks> {
    if (this.networkService.isOnline) {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());

      if (search && search.trim()) {
        params = params.set('search', search.trim());
      }
      if (status && status !== 'all') {
        params = params.set('status', status);
      }

      return this.http.get<PaginatedTasks>(`${this.apiUrl}/tasks`, { params }).pipe(
        tap((res) => {
          // Merge fetched tasks into local storage cache
          this.storageService.mergeServerTasks(res.tasks);
        }),
        catchError((err) => {
          console.warn('[TaskService] REST getTasks failed, falling back to local storage:', err);
          return of(this.getTasksFromLocalStorage(page, limit, search, status));
        })
      );
    } else {
      console.log('[TaskService] Offline mode active: loading tasks from local storage');
      return of(this.getTasksFromLocalStorage(page, limit, search, status));
    }
  }

  /**
   * Fetch a single task by ID.
   * Tries online REST first, falls back to local storage if offline or fails.
   */
  getTask(id: string): Observable<Task> {
    if (this.networkService.isOnline) {
      return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`).pipe(
        tap((task) => {
          this.storageService.saveTask(task);
        }),
        catchError(() => {
          return of(this.getTaskFromLocalStorage(id));
        })
      );
    } else {
      return of(this.getTaskFromLocalStorage(id));
    }
  }

  /**
   * Create a new task.
   * In online mode: calls POST /api/tasks.
   * In offline mode or if call fails: stores locally with _unsynced: true, _isNewOffline: true.
   */
  createTask(data: Partial<Task>): Observable<Task> {
    const username = this.authService.getUsername();
    const tempId = `offline-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const localTask: Task = {
      id: tempId,
      title: data.title || 'Untitled Task',
      description: data.description || '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString(),
      userId: username,
      _unsynced: true,
      _isNewOffline: true,
    };

    if (this.networkService.isOnline) {
      return this.http.post<Task>(`${this.apiUrl}/tasks`, { ...data, clientTempId: tempId }).pipe(
        tap((serverTask) => {
          this.storageService.saveTask({ ...serverTask, _unsynced: false, _isNewOffline: false });
        }),
        catchError((err) => {
          console.warn('[TaskService] Online creation failed, saving to local offline storage:', err);
          this.storageService.saveTask(localTask);
          return of(localTask);
        })
      );
    } else {
      console.log('[TaskService] Offline: saving new task locally with _unsynced=true');
      this.storageService.saveTask(localTask);
      return of(localTask);
    }
  }

  /**
   * Update a task.
   * In online mode: calls PATCH /api/tasks/:id.
   * In offline mode or if call fails: updates locally with _unsynced: true.
   */
  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const existing = this.getTaskFromLocalStorage(id);
    const updatedLocally: Task = {
      ...existing,
      ...updates,
      _unsynced: true,
    };

    if (this.networkService.isOnline && !id.startsWith('offline-')) {
      return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, updates).pipe(
        tap((serverTask) => {
          this.storageService.saveTask({ ...serverTask, _unsynced: false });
        }),
        catchError((err) => {
          console.warn('[TaskService] Online update failed, saving locally with _unsynced=true:', err);
          this.storageService.saveTask(updatedLocally);
          return of(updatedLocally);
        })
      );
    } else {
      console.log(`[TaskService] Offline: saving task #${id} update locally with _unsynced=true`);
      this.storageService.saveTask(updatedLocally);
      return of(updatedLocally);
    }
  }

  // --- Helpers for local storage operations ---

  private getTasksFromLocalStorage(
    page: number,
    limit: number,
    search: string,
    status: string
  ): PaginatedTasks {
    let list = this.storageService.getStoredTasks();

    if (status && status !== 'all') {
      list = list.filter((t) => t.status === status);
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term)
      );
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pageTasks = list.slice(startIndex, endIndex);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tasks: pageTasks,
      total,
      page,
      totalPages,
    };
  }

  private getTaskFromLocalStorage(id: string): Task {
    const found = this.storageService.getStoredTasks().find((t) => t.id === id);
    if (found) return found;

    return {
      id,
      title: 'Unknown Task',
      description: 'Task could not be found locally.',
      status: 'pending',
      priority: 'low',
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}
