import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonIcon,
  IonChip,
  IonCard,
  IonCardContent,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, mapOutline, trashOutline, pinOutline, imageOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Task, TaskLocation } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { PhotoService } from '../../services/photo.service';
import { MapModalComponent } from '../../components/map-modal/map-modal.component';
import { customModalEnterAnimation, customModalLeaveAnimation } from '../../animations/custom-animations';

@Component({
  selector: 'app-task-create-modal',
  standalone: true,
  imports: [
    CommonModule,
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
    IonIcon,
    IonChip,
    IonCard,
    IonCardContent,
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

        <!-- Ionic3: Camera & Photo Attachment -->
        <ion-card class="media-card">
          <ion-card-content>
            <div class="section-header">
              <span class="section-title">
                <ion-icon name="camera-outline"></ion-icon> Photo Attachment
              </span>
              <ion-button size="small" fill="outline" (click)="takePhoto()">
                <ion-icon name="camera-outline" slot="start"></ion-icon>
                {{ photoDataUrl ? 'Retake Photo' : 'Take Photo' }}
              </ion-button>
            </div>

            @if (photoDataUrl) {
              <div class="photo-preview-box">
                <img [src]="photoDataUrl" alt="Task photo preview" class="preview-img" />
                <ion-button size="small" fill="clear" color="danger" (click)="removePhoto()">
                  <ion-icon name="trash-outline" slot="start"></ion-icon>
                  Remove Photo
                </ion-button>
              </div>
            } @else {
              <p class="hint-text">No photo attached yet. Tap 'Take Photo' to attach an image.</p>
            }
          </ion-card-content>
        </ion-card>

        <!-- Ionic3: Location & Map Selection -->
        <ion-card class="media-card">
          <ion-card-content>
            <div class="section-header">
              <span class="section-title">
                <ion-icon name="map-outline"></ion-icon> Task Location
              </span>
              <ion-button size="small" fill="outline" (click)="openMapModal()">
                <ion-icon name="map-outline" slot="start"></ion-icon>
                {{ selectedLocation ? 'Change Map' : 'Select on Map' }}
              </ion-button>
            </div>

            @if (selectedLocation) {
              <div class="location-preview-box">
                <ion-chip color="success">
                  <ion-icon name="pin-outline"></ion-icon>
                  <ion-label>
                    {{ selectedLocation.lat | number: '1.4-4' }}, {{ selectedLocation.lng | number: '1.4-4' }}
                  </ion-label>
                </ion-chip>
                @if (selectedLocation.address) {
                  <p class="address-text">{{ selectedLocation.address }}</p>
                }
                <ion-button size="small" fill="clear" color="danger" (click)="clearLocation()">
                  <ion-icon name="trash-outline" slot="start"></ion-icon>
                  Clear Location
                </ion-button>
              </div>
            } @else {
              <p class="hint-text">No location selected. Tap 'Select on Map' to pin coordinates.</p>
            }
          </ion-card-content>
        </ion-card>

        <ion-button
          expand="block"
          type="submit"
          color="primary"
          class="ion-margin-top save-btn"
          [disabled]="!title.trim() || saving"
        >
          <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
          {{ saving ? 'Saving...' : 'Create Task' }}
        </ion-button>
      </form>
    </ion-content>
  `,
  styles: [
    `
      ion-list {
        margin-bottom: 12px;
      }
      .media-card {
        margin: 12px 0;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .section-title {
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--ion-color-primary);
      }
      .hint-text {
        font-size: 0.85rem;
        color: var(--ion-color-step-600, #777);
        margin: 4px 0 0 0;
      }
      .photo-preview-box {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .preview-img {
        width: 100%;
        max-height: 200px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--ion-color-step-200, #ddd);
      }
      .location-preview-box {
        margin-top: 8px;
      }
      .address-text {
        font-size: 0.85rem;
        margin: 4px 0;
        color: var(--ion-color-step-700, #555);
      }
      .save-btn {
        margin-bottom: 24px;
        font-weight: 600;
      }
    `,
  ],
})
export class TaskCreateModalComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly taskService = inject(TaskService);
  private readonly toastCtrl = inject(ToastController);
  private readonly photoService = inject(PhotoService);

  title = '';
  description = '';
  priority: 'low' | 'medium' | 'high' = 'medium';
  dueDate = new Date(Date.now() + 86400000 * 3).toISOString();
  saving = false;

  // Photo & Location state
  photoDataUrl: string | null = null;
  photoBase64: string | null = null;
  selectedLocation: TaskLocation | null = null;

  constructor() {
    addIcons({ cameraOutline, mapOutline, trashOutline, pinOutline, imageOutline, checkmarkCircleOutline });
  }

  async takePhoto() {
    try {
      const photo = await this.photoService.takePhoto();
      this.photoDataUrl = photo.dataUrl;
      this.photoBase64 = photo.base64Data;
    } catch (err) {
      console.warn('Take photo canceled or failed:', err);
    }
  }

  removePhoto() {
    this.photoDataUrl = null;
    this.photoBase64 = null;
  }

  async openMapModal() {
    const modal = await this.modalCtrl.create({
      component: MapModalComponent,
      componentProps: {
        mode: 'select',
        initialLocation: this.selectedLocation || undefined,
        taskTitle: this.title || 'New Task',
      },
      enterAnimation: customModalEnterAnimation,
      leaveAnimation: customModalLeaveAnimation,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.selectedLocation = data as TaskLocation;
    }
  }

  clearLocation() {
    this.selectedLocation = null;
  }

  dismiss(data: Task | null): void {
    this.modalCtrl.dismiss(data);
  }

  async saveTask(): Promise<void> {
    if (!this.title.trim()) return;

    this.saving = true;

    let photoUrl = this.photoDataUrl || undefined;
    let localPhotoPath: string | undefined = undefined;

    // Save photo to device storage using Filesystem
    if (this.photoDataUrl) {
      try {
        localPhotoPath = await this.photoService.savePhotoToDevice('new', this.photoDataUrl);
      } catch (e) {
        console.warn('Could not save to filesystem:', e);
      }

      // Try uploading to server if online
      try {
        const uploadedUrl = await this.photoService.uploadStandalonePhoto(this.photoDataUrl);
        photoUrl = uploadedUrl;
      } catch (e) {
        console.log('Standalone upload skipped (will use dataUrl or sync later):', e);
      }
    }

    this.taskService
      .createTask({
        title: this.title.trim(),
        description: this.description.trim(),
        priority: this.priority,
        dueDate: this.dueDate,
        status: 'pending',
        photoUrl: photoUrl || undefined,
        localPhotoPath,
        location: this.selectedLocation || undefined,
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
