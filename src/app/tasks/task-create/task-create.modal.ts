import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-create-modal',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Create New Task</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss(null)">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form (ngSubmit)="saveTask()">
        <ion-list lines="inset">
          <ion-item>
            <ion-label position="stacked">Title *</ion-label>
            <ion-input
              [(ngModel)]="title"
              name="title"
              placeholder="e.g. Finish homework assignment"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Description</ion-label>
            <ion-textarea
              [(ngModel)]="description"
              name="description"
              rows="3"
              placeholder="Detailed task description..."
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Priority</ion-label>
            <ion-select [(ngModel)]="priority" name="priority">
              <ion-select-option value="low">Low</ion-select-option>
              <ion-select-option value="medium">Medium</ion-select-option>
              <ion-select-option value="high">High</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Due Date</ion-label>
            <ion-datetime-button datetime="datetime"></ion-datetime-button>
            <ion-modal [keepContentsMounted]="true">
              <ng-template>
                <ion-datetime
                  id="datetime"
                  [(ngModel)]="dueDate"
                  name="dueDate"
                  presentation="date-time"
                ></ion-datetime>
              </ng-template>
            </ion-modal>
          </ion-item>
        </ion-list>

        <ion-button
          expand="block"
          type="submit"
          color="primary"
          class="ion-margin-top"
          [disabled]="!title.trim() || saving"
        >
          {{ saving ? 'Saving...' : 'Create Task' }}
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [
    `
      ion-list {
        margin-bottom: 20px;
      }
    `,
  ],
})
export class TaskCreateModalComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly taskService = inject(TaskService);
  private readonly toastCtrl = inject(ToastController);

  title = '';
  description = '';
  priority: 'low' | 'medium' | 'high' = 'medium';
  dueDate = new Date(Date.now() + 86400000 * 3).toISOString();
  saving = false;

  dismiss(data: Task | null): void {
    this.modalCtrl.dismiss(data);
  }

  saveTask(): void {
    if (!this.title.trim()) return;

    this.saving = true;
    this.taskService
      .createTask({
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        dueDate: this.dueDate,
        status: 'pending',
      })
      .subscribe({
        next: async (createdTask) => {
          this.saving = false;
          const isOffline = createdTask._unsynced;
          const toast = await this.toastCtrl.create({
            message: isOffline
              ? `Task created offline (saved locally)`
              : `Task "${createdTask.title}" created successfully!`,
            duration: 3000,
            color: isOffline ? 'warning' : 'success',
            position: 'top',
          });
          await toast.present();
          this.dismiss(createdTask);
        },
        error: async (err) => {
          this.saving = false;
          console.error('Failed to create task:', err);
          const toast = await this.toastCtrl.create({
            message: 'Failed to create task',
            duration: 3000,
            color: 'danger',
          });
          await toast.present();
        },
      });
  }
}
