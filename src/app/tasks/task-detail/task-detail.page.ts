import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonSpinner,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  calendarOutline,
  flagOutline,
  arrowBackOutline,
  createOutline,
} from 'ionicons/icons';

import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  imports: [
    DatePipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonSpinner,
  ],
})
export class TaskDetailPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly toastController = inject(ToastController);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  task: Task | null = null;
  loading = true;
  error = '';
  updating = false;
  private taskId = '';

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      calendarOutline,
      flagOutline,
      arrowBackOutline,
      createOutline,
    });
  }

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.taskId) {
      this.loadTask();
    }
  }

  ionViewWillEnter(): void {
    const currentId = this.route.snapshot.paramMap.get('id') ?? '';
    if (currentId && (currentId !== this.taskId || !this.task)) {
      this.taskId = currentId;
      this.loadTask();
    }
  }

  loadTask(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    this.taskService.getTask(this.taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load task:', err);
        this.error = 'Failed to load task details.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleStatus(): void {
    if (!this.task) return;

    this.updating = true;
    this.cdr.detectChanges();
    const newStatus = this.task.status === 'pending' ? 'completed' : 'pending';

    this.taskService
      .updateTask(this.task.id, { status: newStatus })
      .subscribe({
        next: (updatedTask) => {
          this.task = updatedTask;
          this.updating = false;
          this.cdr.detectChanges();
          void this.showToast(
            `Task marked as ${updatedTask.status}`,
            'success'
          );
        },
        error: (err) => {
          console.error('Failed to update task:', err);
          this.updating = false;
          this.cdr.detectChanges();
          void this.showToast('Failed to update task status', 'danger');
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
