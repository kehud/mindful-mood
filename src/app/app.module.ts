import { NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeHe from '@angular/common/locales/he';
import { Capacitor } from '@capacitor/core';
import { provideFirebaseApp } from '@angular/fire/app';
import { provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { getApp, initializeApp } from 'firebase/app';
import { getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { reflectTabTransitionAnimation } from './shared/animations/reflect-tab-transition.animation';

registerLocaleData(localeHe);

function provideFirebaseAuth() {
  const app = getApp();

  if (!Capacitor.isNativePlatform()) {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      navAnimation: reflectTabTransitionAnimation,
    }),
    AppRoutingModule,
  ],
  providers: [
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => provideFirebaseAuth()),
    provideFirestore(() => getFirestore()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
