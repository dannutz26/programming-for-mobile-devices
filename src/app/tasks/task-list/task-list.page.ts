import { Component, inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  searchOutline,
  filterOutline,
  listOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss'],
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class TaskListPage implements OnInit, OnDestroy {
  private readonly taskService = inject(TaskService);
  private readonly notificationService = inject(NotificationService);
  private readonly toastController = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'completed' = 'all';

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      searchOutline,
      filterOutline,
      listOutline,
      chevronForwardOutline,
    });
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  ionViewWillEnter(): void {
    if (this.tasks.length === 0) {
      this.loadTasks();
    }
    this.notificationService.connect();

    const notifSub = this.notificationService.notifications$.subscribe(
      async (event) => {
        if (event.type === 'task.updated') {
          const payload = event.payload as {
            taskId: string;
            title: string;
            status: string;
          };
          await this.showToast(
            `Task "${payload.title}" marked as ${payload.status}`,
            'primary'
          );
          this.loadTasks();
        } else if (event.type === 'notification.test') {
          const payload = event.payload as { message: string };
          await this.showToast(payload.message, 'tertiary');
        } else if (event.type === 'connection.established') {
          console.log('WebSocket connected');
        }
      }
    );
    this.subscriptions.add(notifSub);
  }

  ionViewWillLeave(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.notificationService.disconnect();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.notificationService.disconnect();
  }

  loadTasks(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filterTasks();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load tasks:', err);
        this.error = 'Failed to load tasks. Is the server running?';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  filterTasks(): void {
    let result = this.tasks;

    // Filter by status
    if (this.statusFilter !== 'all') {
      result = result.filter((t) => t.status === this.statusFilter);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(term));
    }

    this.filteredTasks = result;
  }

  onSearchChange(event: CustomEvent): void {
    this.searchTerm = (event.detail.value as string) ?? '';
    this.filterTasks();
  }

  onStatusFilterChange(event: CustomEvent): void {
    this.statusFilter = event.detail.value as
      | 'all'
      | 'pending'
      | 'completed';
    this.filterTasks();
  }

  doRefresh(event: CustomEvent): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filterTasks();
        (event.target as HTMLIonRefresherElement).complete();
      },
      error: () => {
        (event.target as HTMLIonRefresherElement).complete();
      },
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'medium';
    }
  }

  getStatusColor(status: string): string {
    return status === 'completed' ? 'success' : 'warning';
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
