import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
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
  IonButtons,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonChip,
  IonFab,
  IonFabButton,
  IonCard,
  IonCardContent,
  ToastController,
  ModalController,
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
  wifiOutline,
  cloudOfflineOutline,
  syncOutline,
  logOutOutline,
  addOutline,
  personCircleOutline,
  cloudUploadOutline,
} from 'ionicons/icons';

import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { NetworkService } from '../../services/network.service';
import { StorageService } from '../../services/storage.service';
import { SyncService } from '../../services/sync.service';
import { TaskCreateModalComponent } from '../task-create/task-create.modal';

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
    IonButtons,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonChip,
    IonFab,
    IonFabButton,
    IonCard,
    IonCardContent,
  ],
})
export class TaskListPage implements OnInit, OnDestroy {
  readonly taskService = inject(TaskService);
  readonly notificationService = inject(NotificationService);
  readonly authService = inject(AuthService);
  readonly networkService = inject(NetworkService);
  readonly storageService = inject(StorageService);
  readonly syncService = inject(SyncService);
  private readonly toastController = inject(ToastController);
  private readonly modalController = inject(ModalController);
  private readonly cdr = inject(ChangeDetectorRef);

  private subscriptions = new Subscription();

  tasks: Task[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  statusFilter: 'all' | 'pending' | 'completed' = 'all';

  // Pagination state
  currentPage = 1;
  pageSize = 5;
  totalTasks = 0;
  totalPages = 1;
  infiniteScrollDisabled = false;

  // Unsynced / Offline state
  unsyncedCount = 0;
  isOnline = true;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      searchOutline,
      filterOutline,
      listOutline,
      chevronForwardOutline,
      wifiOutline,
      cloudOfflineOutline,
      syncOutline,
      logOutOutline,
      addOutline,
      personCircleOutline,
      cloudUploadOutline,
    });
  }

  ngOnInit(): void {
    // Monitor online/offline status
    this.subscriptions.add(
      this.networkService.isOnline$.subscribe((online) => {
        this.isOnline = online;
        this.cdr.detectChanges();
      })
    );

    // Monitor unsynced items count
    this.subscriptions.add(
      this.storageService.unsyncedCount$.subscribe((count) => {
        this.unsyncedCount = count;
        this.cdr.detectChanges();
      })
    );

    // Refresh when sync completes
    this.subscriptions.add(
      this.syncService.syncCompleted$.subscribe(() => {
        this.resetAndLoadTasks();
      })
    );

    this.loadTasks(1, false);
  }

  ionViewWillEnter(): void {
    this.notificationService.connect();

    // Subscribe to secured WebSocket notifications
    const notifSub = this.notificationService.notifications$.subscribe(
      async (event) => {
        if (event.type === 'task.updated') {
          const payload = event.payload as {
            taskId: string;
            title: string;
            status: string;
            task?: Task;
          };
          await this.showToast(
            `Task "${payload.title}" updated (${payload.status})`,
            'primary'
          );
          this.resetAndLoadTasks();
        } else if (event.type === 'task.created') {
          const payload = event.payload as { task: Task };
          await this.showToast(
            `New task created: "${payload.task.title}"`,
            'secondary'
          );
          this.resetAndLoadTasks();
        } else if (event.type === 'notification.test') {
          const payload = event.payload as { message: string };
          await this.showToast(payload.message, 'tertiary');
        } else if (event.type === 'connection.established') {
          console.log('[TaskListPage] WebSocket connected securely');
        }
      }
    );
    this.subscriptions.add(notifSub);

    // Recheck storage count
    this.storageService.refreshUnsyncedCount();
  }

  ionViewWillLeave(): void {
    this.notificationService.disconnect();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.notificationService.disconnect();
  }

  /** Reset pagination and reload from page 1 */
  resetAndLoadTasks(): void {
    this.currentPage = 1;
    this.infiniteScrollDisabled = false;
    this.loadTasks(1, false);
  }

  /** Load a specific page of tasks */
  loadTasks(page: number, append = false): void {
    if (!append) {
      this.loading = true;
    }
    this.error = '';
    this.cdr.detectChanges();

    this.taskService
      .getTasks(page, this.pageSize, this.searchTerm, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.currentPage = res.page;
          this.totalTasks = res.total;
          this.totalPages = res.totalPages;

          if (append) {
            // Append newly loaded page
            const existingIds = new Set(this.tasks.map((t) => t.id));
            const newItems = res.tasks.filter((t) => !existingIds.has(t.id));
            this.tasks = [...this.tasks, ...newItems];
          } else {
            this.tasks = res.tasks;
          }

          // Disable infinite scroll if we reached the end
          this.infiniteScrollDisabled =
            this.currentPage >= this.totalPages || this.tasks.length >= this.totalTasks;

          this.loading = false;
          this.storageService.refreshUnsyncedCount();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[TaskListPage] Load error:', err);
          this.error = 'Failed to load tasks.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  /** Infinite scroll triggered by ion-infinite-scroll */
  loadMore(event: CustomEvent): void {
    const target = event.target as HTMLIonInfiniteScrollElement;

    if (this.currentPage >= this.totalPages) {
      this.infiniteScrollDisabled = true;
      target.complete();
      return;
    }

    const nextPage = this.currentPage + 1;
    this.taskService
      .getTasks(nextPage, this.pageSize, this.searchTerm, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.currentPage = res.page;
          this.totalTasks = res.total;
          this.totalPages = res.totalPages;

          const existingIds = new Set(this.tasks.map((t) => t.id));
          const newItems = res.tasks.filter((t) => !existingIds.has(t.id));
          this.tasks = [...this.tasks, ...newItems];

          if (this.currentPage >= this.totalPages || this.tasks.length >= this.totalTasks) {
            this.infiniteScrollDisabled = true;
          }

          target.complete();
          this.cdr.detectChanges();
        },
        error: () => {
          target.complete();
        },
      });
  }

  /** Pull to refresh */
  doRefresh(event: CustomEvent): void {
    const refresher = event.target as HTMLIonRefresherElement;
    this.taskService
      .getTasks(1, this.pageSize, this.searchTerm, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.tasks = res.tasks;
          this.currentPage = res.page;
          this.totalTasks = res.total;
          this.totalPages = res.totalPages;
          this.infiniteScrollDisabled = this.currentPage >= this.totalPages;
          this.storageService.refreshUnsyncedCount();
          refresher.complete();
          this.cdr.detectChanges();
        },
        error: () => {
          refresher.complete();
        },
      });
  }

  onSearchChange(event: CustomEvent): void {
    this.searchTerm = (event.detail.value as string) ?? '';
    this.resetAndLoadTasks();
  }

  onStatusFilterChange(event: CustomEvent): void {
    this.statusFilter = event.detail.value as 'all' | 'pending' | 'completed';
    this.resetAndLoadTasks();
  }

  /** Manual trigger for sync */
  async syncNow(): Promise<void> {
    await this.syncService.syncPendingData();
    this.resetAndLoadTasks();
  }

  /** Toggle network simulation for demonstration */
  toggleNetwork(): void {
    this.networkService.toggleSimulation();
    const mode = this.networkService.currentMode;
    const isNowOnline = this.networkService.isOnline;
    this.showToast(
      `Network status: ${isNowOnline ? 'ONLINE' : 'OFFLINE'} (Mode: ${mode.toUpperCase()})`,
      isNowOnline ? 'success' : 'warning'
    );
  }

  /** Open Task Creation Modal */
  async openCreateModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: TaskCreateModalComponent,
    });
    await modal.present();

    const { data } = await modal.onWillDismiss<Task>();
    if (data) {
      this.resetAndLoadTasks();
    }
  }

  logout(): void {
    this.notificationService.disconnect();
    this.authService.logout();
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
