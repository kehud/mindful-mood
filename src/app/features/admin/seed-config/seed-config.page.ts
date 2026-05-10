import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Firestore, doc, getDoc, writeBatch } from '@angular/fire/firestore';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom, take } from 'rxjs';

import { AppUser } from '../../../core/models/user-profile.model';
import { AuthService } from '../../../core/services/auth.service';
import {
  DEFAULT_EMOTION_OPTIONS,
  DEFAULT_INFLUENCE_OPTIONS,
  DEFAULT_MOOD_OPTIONS,
} from '../../../core/services/config.service';

type ConfigCollectionName = 'moodOptions' | 'emotionOptions' | 'influenceOptions';

interface SeedDocument {
  collectionName: ConfigCollectionName;
  id: string;
  data: Record<string, number | string | number[] | Record<string, string | undefined> | undefined>;
}

const SEED_DOCUMENTS: readonly SeedDocument[] = [
  ...DEFAULT_MOOD_OPTIONS.map((option) => ({
    collectionName: 'moodOptions' as const,
    id: `mood-${option.value}`,
    data: {
      value: option.value,
      label: option.label,
      ...(option.translations ? { translations: option.translations } : {}),
      icon: option.icon,
      color: option.color,
      order: option.order,
    },
  })),
  ...DEFAULT_EMOTION_OPTIONS.map((option) => ({
    collectionName: 'emotionOptions' as const,
    id: slugify(option.label),
    data: {
      label: option.label,
      order: option.order,
      ...(option.translations ? { translations: option.translations } : {}),
      ...(option.moodRange ? { moodRange: [...option.moodRange] } : {}),
      ...(option.category ? { category: option.category } : {}),
    },
  })),
  ...DEFAULT_INFLUENCE_OPTIONS.map((option) => ({
    collectionName: 'influenceOptions' as const,
    id: slugify(option.label),
    data: {
      label: option.label,
      order: option.order,
      ...(option.translations ? { translations: option.translations } : {}),
    },
  })),
];

@Component({
  selector: 'app-seed-config',
  standalone: true,
  imports: [IonicModule, NgIf, RouterLink],
  templateUrl: './seed-config.page.html',
  styleUrls: ['./seed-config.page.scss'],
})
export class SeedConfigPage {
  private readonly authService = inject(AuthService);
  private readonly firestore = inject(Firestore);

  readonly totalDocumentCount = SEED_DOCUMENTS.length;
  currentUser: AppUser | null = this.authService.currentUserSnapshot;
  isChecking = true;
  isSeeding = false;
  configExists = false;
  missingDocumentCount = SEED_DOCUMENTS.length;
  successMessage = '';
  errorMessage = '';

  constructor() {
    void this.refreshConfigStatus();
  }

  get isLoading(): boolean {
    return this.isChecking || this.isSeeding;
  }

  get canSeed(): boolean {
    return !this.isLoading;
  }

  async seedConfig(): Promise<void> {
    this.isSeeding = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      this.currentUser = await this.getAuthenticatedUser();
      const batch = writeBatch(this.firestore);

      SEED_DOCUMENTS.forEach((seedDocument) => {
        batch.set(this.seedDocRef(seedDocument), seedDocument.data);
      });

      await batch.commit();
      this.configExists = true;
      this.missingDocumentCount = 0;
      this.successMessage = `Updated ${SEED_DOCUMENTS.length} config documents.`;
    } catch (error) {
      this.errorMessage = this.toErrorMessage(error);
    } finally {
      this.isSeeding = false;
    }
  }

  private async refreshConfigStatus(): Promise<void> {
    this.isChecking = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      this.currentUser = await this.getAuthenticatedUser();
      const missingDocuments = await this.getMissingDocuments();
      this.configExists = missingDocuments.length === 0;
      this.missingDocumentCount = missingDocuments.length;

      if (this.configExists) {
        this.successMessage = 'Config already exists. You can update it here.';
      }
    } catch (error) {
      this.errorMessage = this.toErrorMessage(error);
    } finally {
      this.isChecking = false;
    }
  }

  private async getMissingDocuments(): Promise<SeedDocument[]> {
    const snapshots = await Promise.all(
      SEED_DOCUMENTS.map(async (seedDocument) => ({
        seedDocument,
        snapshot: await getDoc(this.seedDocRef(seedDocument)),
      })),
    );

    return snapshots
      .filter(({ snapshot }) => !snapshot.exists())
      .map(({ seedDocument }) => seedDocument);
  }

  private seedDocRef(seedDocument: SeedDocument) {
    return doc(this.firestore, seedDocument.collectionName, seedDocument.id);
  }

  private async getAuthenticatedUser(): Promise<AppUser> {
    const user = this.authService.currentUserSnapshot ?? await firstValueFrom(this.authService.currentUser$.pipe(take(1)));

    if (!user) {
      throw new Error('Sign in before seeding Firestore config.');
    }

    return user;
  }

  private setAlreadySeededState(): void {
    this.configExists = true;
    this.missingDocumentCount = 0;
    this.successMessage = 'Config already exists. You can update it here.';
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unable to seed config.';
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
