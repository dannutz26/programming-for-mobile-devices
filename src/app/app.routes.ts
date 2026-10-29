import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
    canActivate: [loginGuard],
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./tasks/task-list/task-list.page').then((m) => m.TaskListPage),
    canActivate: [authGuard],
  },
  {
    path: 'tasks/:id',
    loadComponent: () =>
      import('./tasks/task-detail/task-detail.page').then(
        (m) => m.TaskDetailPage
      ),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'tasks',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
