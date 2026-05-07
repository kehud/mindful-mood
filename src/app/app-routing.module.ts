import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

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
        loadComponent: () =>
          import('./features/check-in/review-save/review-save.page').then((m) => m.ReviewSavePage),
      },
      {
        path: '',
        redirectTo: 'mood',
        pathMatch: 'full',
      },
    ],
  },
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
