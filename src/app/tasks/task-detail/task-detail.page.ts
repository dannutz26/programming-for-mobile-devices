import { Component, inject, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonChip,
  ModalController,
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
  personOutline,
  cloudOfflineOutline,
  cameraOutline,
  mapOutline,
  navigateOutline,
  pinOutline,
  trashOutline,
  saveOutline,
  closeOutline,
  sparklesOutline,
} from 'ionicons/icons';

import { Task, TaskLocation } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { PhotoService } from '../../services/photo.service';
import { MapModalComponent } from '../../components/map-modal/map-modal.component';
import {
  customModalEnterAnimation,
  customModalLeaveAnimation,
  pulseElement,
} from '../../animations/custom-animations';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
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
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonChip,
  ],
})
export class TaskDetailPage implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly photoService = inject(PhotoService);
  private readonly toastController = inject(ToastController);
  private readonly modalController = inject(ModalController);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('statusBtn', { read: ElementRef, static: false }) statusBtnRef?: ElementRef<HTMLElement>;

  task: Task | null = null;
  loading = true;
  error = '';
  updating = false;
  isEditing = false;
  private taskId = '';

  // Editable Form fields
  editTitle = '';
  editDescription = '';
  editPriority: 'low' | 'medium' | 'high' = 'medium';
  editPhotoUrl?: string;
  editLocalPhotoPath?: string;
  editLocation?: TaskLocation;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      calendarOutline,
      flagOutline,
      arrowBackOutline,
      createOutline,
      personOutline,
      cloudOfflineOutline,
      cameraOutline,
      mapOutline,
      navigateOutline,
      pinOutline,
      trashOutline,
      saveOutline,
      closeOutline,
      sparklesOutline,
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
        this.syncEditFields(task);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TaskDetailPage] Load error:', err);
        this.error = 'Failed to load task details.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private syncEditFields(task: Task) {
    this.editTitle = task.title;
    this.editDescription = task.description;
    this.editPriority = task.priority;
    this.editPhotoUrl = task.photoUrl;
    this.editLocalPhotoPath = task.localPhotoPath;
    this.editLocation = task.location ? { ...task.location } : undefined;
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.task) {
      this.syncEditFields(this.task);
    }
    this.cdr.detectChanges();
  }

  // --- Photo Handling (Take photo, Save to device, Upload) ---
  async takePhoto(): Promise<void> {
    try {
      const captured = await this.photoService.takePhoto();

      // Show immediate preview
      this.editPhotoUrl = captured.dataUrl;
      this.cdr.detectChanges();

      // Save to device storage (Capacitor Filesystem)
      try {
        const localPath = await this.photoService.savePhotoToDevice(this.taskId, captured.dataUrl);
        this.editLocalPhotoPath = localPath;
        console.log('[TaskDetailPage] Photo saved on device storage:', localPath);
      } catch (e) {
        console.warn('Device storage save failed:', e);
      }

      // Upload to server if not creating brand new item
      if (this.task && !this.task.id.startsWith('offline-')) {
        try {
          const uploadedUrl = await this.photoService.uploadPhoto(this.task.id, captured.dataUrl);
          this.editPhotoUrl = uploadedUrl;
          void this.showToast('Photo uploaded and saved to device!', 'success');
        } catch (uploadErr) {
          console.log('[TaskDetailPage] Photo upload deferred (offline):', uploadErr);
          void this.showToast('Photo saved locally on device (offline)', 'warning');
        }
      } else {
        void this.showToast('Photo captured and saved on device', 'success');
      }

      this.cdr.detectChanges();
    } catch (err) {
      console.warn('Photo capture canceled or failed:', err);
    }
  }

  removePhoto(): void {
    this.editPhotoUrl = undefined;
    this.editLocalPhotoPath = undefined;
    this.cdr.detectChanges();
  }

  // --- Map Handling ---
  async openSelectLocationMap(): Promise<void> {
    const modal = await this.modalController.create({
      component: MapModalComponent,
      componentProps: {
        mode: 'select',
        initialLocation: this.editLocation,
        taskTitle: this.editTitle || this.task?.title || 'Task Location',
      },
      enterAnimation: customModalEnterAnimation,
      leaveAnimation: customModalLeaveAnimation,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm' && data) {
      this.editLocation = data as TaskLocation;
      this.cdr.detectChanges();
    }
  }

  async openLocateMap(): Promise<void> {
    if (!this.task?.location) return;

    const modal = await this.modalController.create({
      component: MapModalComponent,
      componentProps: {
        mode: 'view',
        initialLocation: this.task.location,
        taskTitle: this.task.title,
      },
      enterAnimation: customModalEnterAnimation,
      leaveAnimation: customModalLeaveAnimation,
    });

    await modal.present();
  }

  clearLocation(): void {
    this.editLocation = undefined;
    this.cdr.detectChanges();
  }

  // --- Save Edits ---
  saveEdits(): void {
    if (!this.task || !this.editTitle.trim()) return;

    this.updating = true;
    this.cdr.detectChanges();

    const updates: Partial<Task> = {
      title: this.editTitle.trim(),
      description: this.editDescription.trim(),
      priority: this.editPriority,
      photoUrl: this.editPhotoUrl,
      localPhotoPath: this.editLocalPhotoPath,
      location: this.editLocation,
    };

    this.taskService.updateTask(this.task.id, updates).subscribe({
      next: (updated) => {
        this.task = updated;
        this.isEditing = false;
        this.updating = false;
        this.cdr.detectChanges();
        void this.showToast('Task updated successfully!', 'success');
      },
      error: (err) => {
        console.error('Update failed:', err);
        this.updating = false;
        this.cdr.detectChanges();
        void this.showToast('Failed to save changes', 'danger');
      },
    });
  }

  // --- Toggle Status with Animation ---
  toggleStatus(): void {
    if (!this.task) return;

    // Trigger pulse animation on button
    if (this.statusBtnRef?.nativeElement) {
      const anim = pulseElement(this.statusBtnRef.nativeElement, 300);
      anim.play();
    }

    this.updating = true;
    this.cdr.detectChanges();
    const newStatus = this.task.status === 'pending' ? 'completed' : 'pending';

    this.taskService.updateTask(this.task.id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        this.updating = false;
        this.cdr.detectChanges();

        const isOffline = updatedTask._unsynced;
        void this.showToast(
          isOffline
            ? `Task marked as ${updatedTask.status} (offline - saved locally)`
            : `Task marked as ${updatedTask.status}`,
          isOffline ? 'warning' : 'success'
        );
      },
      error: (err) => {
        console.error('[TaskDetailPage] Update error:', err);
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
