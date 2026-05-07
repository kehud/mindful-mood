import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
} from '@angular/fire/auth';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { map, shareReplay } from 'rxjs';

import { AppUser, AuthCredentials } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly persistenceReady = setPersistence(this.auth, browserLocalPersistence);

  readonly currentUser$ = authState(this.auth).pipe(
    map((user) => (user ? this.mapFirebaseUser(user) : null)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  readonly isAuthenticated$ = this.currentUser$.pipe(map(Boolean));

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
    try {
      await this.persistenceReady;
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
    await signOut(this.auth);
  }

  getErrorMessage(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Something went wrong. Please try again.';
    }

    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'That email is already registered. Try logging in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'The email or password does not look right.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was closed before it finished.';
      case 'auth/weak-password':
        return 'Use a password with at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please try again.';
      default:
        return error.message || 'Authentication failed. Please try again.';
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
