import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Auth,
  authState,
} from '@angular/fire/auth';
import { FirebaseError } from 'firebase/app';
import {
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  indexedDBLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { from, map, shareReplay, startWith, switchMap, take } from 'rxjs';

import { AppUser, AuthCredentials } from '../models/user-profile.model';
import { LocalizationService } from './localization.service';
import { TranslationKey } from './localization.translations';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly localization = inject(LocalizationService);
  private readonly authPersistence = Capacitor.isNativePlatform() ? indexedDBLocalPersistence : browserLocalPersistence;
  private readonly persistenceReady = setPersistence(this.auth, this.authPersistence);
  readonly canUseGoogleSignIn = !Capacitor.isNativePlatform();

  private readonly firebaseUser$ = from(this.persistenceReady).pipe(
    switchMap(() => authState(this.auth)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly authReady$ = this.firebaseUser$.pipe(
    map(() => true),
    take(1),
    startWith(false),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly currentUser$ = this.firebaseUser$.pipe(
    map((user) => (user ? this.mapFirebaseUser(user) : null)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  readonly isAuthenticated$ = this.currentUser$.pipe(
    map(Boolean),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  get currentUserSnapshot(): AppUser | null {
    return this.auth.currentUser ? this.mapFirebaseUser(this.auth.currentUser) : null;
  }

  get isAuthenticatedSnapshot(): boolean {
    return Boolean(this.auth.currentUser);
  }

  async login(credentials: AuthCredentials): Promise<AppUser> {
    console.log('[AuthService] login called');
    return this.signIn(credentials);
  }

  async signIn(credentials: AuthCredentials): Promise<AppUser> {
    console.log('[AuthService] signIn called');
    try {
      await this.persistenceReady;
      console.log('[AuthService] Firebase signInWithEmailAndPassword called');
      const credential = await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      console.log('[AuthService] auth success: email login', credential.user.uid);
      return this.mapFirebaseUser(credential.user);
    } catch (error) {
      console.error('[AuthService] auth error: email login', error);
      throw error;
    }
  }

  async register(credentials: AuthCredentials, displayName: string): Promise<AppUser> {
    console.log('[AuthService] register called');
    try {
      await this.persistenceReady;
      console.log('[AuthService] Firebase createUserWithEmailAndPassword called');
      const credential = await createUserWithEmailAndPassword(this.auth, credentials.email, credentials.password);
      const trimmedName = displayName.trim();

      if (trimmedName) {
        console.log('[AuthService] Firebase updateProfile called');
        await updateProfile(credential.user, { displayName: trimmedName });
      }

      console.log('[AuthService] auth success: email register', credential.user.uid);
      return this.mapFirebaseUser(credential.user);
    } catch (error) {
      console.error('[AuthService] auth error: email register', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AppUser> {
    console.log('[AuthService] signInWithGoogle called');

    if (!this.canUseGoogleSignIn) {
      throw new Error('Google sign-in is not available in the native app yet. Please use email and password.');
    }

    try {
      await this.persistenceReady;
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      console.log('[AuthService] Firebase signInWithPopup called');
      const credential = await signInWithPopup(this.auth, provider);
      console.log('[AuthService] auth success: Google login', credential.user.uid);
      return this.mapFirebaseUser(credential.user);
    } catch (error) {
      console.error('[AuthService] auth error: Google login', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await this.persistenceReady;
    await signOut(this.auth);
  }

  getErrorMessage(error: unknown): string {
    return this.localization.translate(this.getErrorTranslationKey(error));
  }

  getErrorTranslationKey(error: unknown): TranslationKey {
    if (error instanceof Error && error.message.includes('Google sign-in is not available')) {
      return 'auth.error.googleNativeUnavailable';
    }

    if (!(error instanceof FirebaseError)) {
      return 'auth.error.generic';
    }

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'auth.error.emailAlreadyInUse';
      case 'auth/invalid-email':
        return 'auth.error.invalidEmail';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'auth.error.invalidCredential';
      case 'auth/popup-closed-by-user':
        return 'auth.error.popupClosed';
      case 'auth/weak-password':
        return 'auth.error.weakPassword';
      case 'auth/network-request-failed':
        return 'auth.error.network';
      default:
        return 'auth.error.authenticationFailed';
    }
  }

  private mapFirebaseUser(user: User): AppUser {
    const fallbackName = user.email?.split('@')[0] || 'Mindful Member';

    return {
      uid: user.uid,
      displayName: user.displayName || fallbackName,
      email: user.email ?? '',
      photoURL: user.photoURL,
    };
  }
}
