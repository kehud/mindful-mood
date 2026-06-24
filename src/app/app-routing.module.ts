import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { environment } from '../environments/environment';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

const developmentRoutes: Routes = environment.production
  ? []
  : [
      {
        path: 'admin/seed-config',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/admin/seed-config/seed-config.page').then((m) => m.SeedConfigPage),
      },
    ];

const routes: Routes = [
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'tools',
        loadComponent: () =>
          import('./features/tools/tools.page').then((m) => m.ToolsPage),
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('./features/insights/insights.page').then((m) => m.InsightsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'tools/category/:categoryId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tools/pages/category-tools/category-tools.component').then(
        (m) => m.CategoryToolsComponent,
      ),
  },
  {
    path: 'tools/:toolId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/tools/pages/tool-details/tool-details.component').then((m) => m.ToolDetailsPage),
  },
  {
    path: 'check-in',
    canActivate: [authGuard],
    children: [
      {
        path: 'mood',
        loadComponent: () =>
          import('./features/check-in/mood-slider/mood-slider.page').then((m) => m.MoodSliderPage),
      },
      {
        path: 'emotions',
        loadComponent: () =>
          import('./features/check-in/emotion-selection/emotion-selection.page').then(
            (m) => m.EmotionSelectionPage,
          ),
      },
      {
        path: 'influences',
        loadComponent: () =>
          import('./features/check-in/influences-journal/influences-journal.page').then(
            (m) => m.InfluencesJournalPage,
          ),
      },
      {
        path: 'review',
        redirectTo: 'influences',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'mood',
        pathMatch: 'full',
      },
    ],
  },
  ...developmentRoutes,
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'welcome',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
