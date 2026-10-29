import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tasks',
    loadComponent: () =>
      import('./tasks/task-list/task-list.page').then((m) => m.TaskListPage),
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./tasks/task-detail/task-detail.page').then(
        (m) => m.TaskDetailPage
      ),
  },
  {
    path: '',
    redirectTo: 'tasks',
    pathMatch: 'full',
  },
];
