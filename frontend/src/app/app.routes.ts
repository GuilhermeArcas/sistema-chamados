import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'chamados',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/chamados/chamados-lista.component').then((m) => m.ChamadosListaComponent),
  },
    {
    path: 'chamados/novo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/chamados/chamado-novo.component').then((m) => m.ChamadoNovoComponent),
  },
  {
    path: 'chamados/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/chamados/chamado-detalhe.component').then((m) => m.ChamadoDetalheComponent),
  },
  
  { path: '', pathMatch: 'full', redirectTo: 'chamados' },
  { path: '**', redirectTo: 'chamados' },
];