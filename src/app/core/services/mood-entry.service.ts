import { Injectable, inject } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, query, where } from '@angular/fire/firestore';
import { FirebaseError } from 'firebase/app';
import { BehaviorSubject, catchError, firstValueFrom, map, of, shareReplay, switchMap, take, tap } from 'rxjs';

import { CheckInDraft, MoodEntry, MoodLevel } from '../models/mood-entry.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class MoodEntryService {
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(Firestore);
  private readonly draftSubject = new BehaviorSubject<CheckInDraft>(this.createDraft());
  private readonly entriesLoadingSubject = new BehaviorSubject(false);
  private readonly entriesErrorSubject = new BehaviorSubject<string | null>(null);

  readonly draft$ = this.draftSubject.asObservable();
  readonly entriesLoading$ = this.entriesLoadingSubject.asObservable();
  readonly entriesError$ = this.entriesErrorSubject.asObservable();
  readonly entries$ = this.authService.currentUser$.pipe(
    tap(() => {
      this.entriesLoadingSubject.next(true);
      this.entriesErrorSubject.next(null);
    }),
    switchMap((user) => {
      if (!user) {
        this.entriesLoadingSubject.next(false);
        return of([]);
      }

      const entriesRef = collection(this.firestore, this.entriesPath());
      const entriesQuery = query(entriesRef, where('userId', '==', user.uid));

      return collectionData(entriesQuery, { idField: 'id' }).pipe(
        map((entries) =>
          (entries as MoodEntry[]).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        ),
        tap(() => this.entriesLoadingSubject.next(false)),
        catchError((error) => {
          this.entriesErrorSubject.next(this.getErrorMessage(error));
          this.entriesLoadingSubject.next(false);
          return of([]);
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  get draftSnapshot(): CheckInDraft {
    return this.draftSubject.value;
  }

  updateDraft(patch: Partial<CheckInDraft>): void {
    this.draftSubject.next({
      ...this.draftSubject.value,
      ...patch,
    });
  }

  resetDraft(): void {
    this.draftSubject.next(this.createDraft());
  }

  async saveDraft(): Promise<MoodEntry> {
    const user = await firstValueFrom(this.authService.currentUser$.pipe(take(1)));

    if (!user) {
      throw new Error('You need to be logged in before saving a check-in.');
    }

    const uid = user.uid;
    const draft = this.draftSubject.value;
    const entryPayload: Omit<MoodEntry, 'id'> = {
      userId: uid,
      moodLevel: draft.moodLevel,
      emotions: [...draft.emotions],
      influences: [...draft.influences],
      journalNote: draft.journalNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(this.firestore, this.entriesPath()), entryPayload);
    const entry: MoodEntry = {
      id: docRef.id,
      ...entryPayload,
    };

    this.resetDraft();
    return entry;
  }

  getErrorMessage(error: unknown): string {
    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        return 'You do not have permission to access these check-ins yet.';
      }

      if (error.code === 'unavailable') {
        return 'Firestore is unavailable right now. Please try again.';
      }

      return error.message;
    }

    return error instanceof Error ? error.message : 'Something went wrong while loading mood entries.';
  }

  private createDraft(): CheckInDraft {
    return {
      moodLevel: 4 as MoodLevel,
      emotions: [],
      influences: [],
      journalNote: '',
    };
  }

  private entriesPath(): string {
    return 'moodEntries';
  }
}
