import { Injectable, inject } from '@angular/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';
import {
  Auth,
  authState,
} from '@angular/fire/auth';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { map, shareReplay, startWith, take } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AppUser, AuthCredentials } from '../models/user-profile.model';
import { LocalizationService } from './localization.service';
import { TranslationKey } from './localization.translations';

const GOOGLE_SIGN_IN_UNAVAILABLE_ERROR = 'Google sign-in is only available in the installed mobile app.';
const GOOGLE_SIGN_IN_NOT_CONFIGURED_ERROR = 'Google sign-in is not configured yet.';
const GOOGLE_SIGN_IN_MISSING_TOKEN_ERROR = 'Google sign-in did not return an ID token.';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly localization = inject(LocalizationService);
  private readonly googleSignInClientId = environment.googleSignIn.webClientId.trim();
  private googleSignInReady?: Promise<void>;

  readonly canUseGoogleSignIn = Capacitor.isNativePlatform();

  private readonly firebaseUser$ = authState(this.auth).pipe(
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
      throw new Error(GOOGLE_SIGN_IN_UNAVAILABLE_ERROR);
    }

    try {
      await this.initializeNativeGoogleSignIn();

      console.log('[AuthService] native GoogleSignIn.signIn called');
      const googleResult = await GoogleSignIn.signIn();

      if (!googleResult.idToken) {
        throw new Error(GOOGLE_SIGN_IN_MISSING_TOKEN_ERROR);
      }

      const credential = GoogleAuthProvider.credential(googleResult.idToken);
      const userCredential = await signInWithCredential(this.auth, credential);

      console.log('[AuthService] auth success: Google login', userCredential.user.uid);
      return this.mapFirebaseUser(userCredential.user);
    } catch (error) {
      if (this.isAuthCancellation(error)) {
        console.log('[AuthService] auth cancelled: Google login');
      } else {
        console.error('[AuthService] auth error: Google login', error);
      }

      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (Capacitor.isNativePlatform() && this.googleSignInClientId) {
      try {
        await this.initializeNativeGoogleSignIn();
        await GoogleSignIn.signOut();
      } catch (error) {
        console.warn('[AuthService] native Google sign-out could not complete', error);
      }
    }

    await signOut(this.auth);
  }

  getErrorMessage(error: unknown): string {
    return this.localization.translate(this.getErrorTranslationKey(error));
  }

  getErrorTranslationKey(error: unknown): TranslationKey {
    if (this.isAuthCancellation(error)) {
      return 'auth.error.googleCancelled';
    }

    if (error instanceof Error && error.message.includes(GOOGLE_SIGN_IN_UNAVAILABLE_ERROR)) {
      return 'auth.error.googleNativeUnavailable';
    }

    if (error instanceof Error && error.message.includes(GOOGLE_SIGN_IN_NOT_CONFIGURED_ERROR)) {
      return 'auth.error.googleNotConfigured';
    }

    if (error instanceof Error && error.message.includes(GOOGLE_SIGN_IN_MISSING_TOKEN_ERROR)) {
      return 'auth.error.googleMissingToken';
    }

    if (!(error instanceof FirebaseError)) {
      return 'auth.error.generic';
    }

    switch (error.code) {
      case 'auth/account-exists-with-different-credential':
        return 'auth.error.accountExistsWithDifferentCredential';
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
      case 'auth/operation-not-allowed':
        return 'auth.error.providerNotEnabled';
      case 'auth/weak-password':
        return 'auth.error.weakPassword';
      case 'auth/network-request-failed':
        return 'auth.error.network';
      default:
        return 'auth.error.authenticationFailed';
    }
  }

  isAuthCancellation(error: unknown): boolean {
    const code = this.readErrorCode(error).toLowerCase();
    const message = error instanceof Error ? error.message.toLowerCase() : '';

    return code.includes('cancel') ||
      code.includes('user-cancel') ||
      message.includes('cancel') ||
      message.includes('dismiss');
  }

  private async initializeNativeGoogleSignIn(): Promise<void> {
    if (!this.googleSignInClientId) {
      throw new Error(GOOGLE_SIGN_IN_NOT_CONFIGURED_ERROR);
    }

    this.googleSignInReady ??= GoogleSignIn.initialize({
      clientId: this.googleSignInClientId,
    });

    await this.googleSignInReady;
  }

  private readErrorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = error.code;

      return typeof code === 'string' ? code : '';
    }

    return '';
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
