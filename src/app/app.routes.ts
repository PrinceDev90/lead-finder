import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(module => module.DashboardComponent) },
  { path: 'leads', loadComponent: () => import('./features/leads/leads.component').then(module => module.LeadsComponent) },
  { path: 'coverage', loadComponent: () => import('./features/coverage/district-coverage.component').then(module => module.DistrictCoverageComponent) },
  { path: 'paste', loadComponent: () => import('./features/paste-lead/paste-lead.component').then(module => module.PasteLeadComponent) },
  { path: '**', redirectTo: 'dashboard' },
];
