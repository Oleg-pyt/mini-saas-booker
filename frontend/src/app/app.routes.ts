import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'setup',
    loadChildren: () =>
      import('./features/setup/setup.module').then(m => m.SetupModule)
  },
  {
    path: '',
    loadChildren: () =>
      import('./features/main/main.module').then(m => m.MainModule)
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'health',
    loadChildren: () =>
      import('./features/health/health.module').then(m => m.HealthModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
