import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { Observable, catchError, map, of, shareReplay, startWith } from 'rxjs';

import {
  ReflectionTemplate,
  ReflectionTemplateTranslation,
  ReflectionTemplateTranslations,
} from '../models/reflection-template.model';

@Injectable({
  providedIn: 'root',
})
export class ReflectionTemplateService {
  private readonly firestore = inject(Firestore);

  readonly activeTemplates$ = this.loadActiveTemplates();

  private loadActiveTemplates(): Observable<readonly ReflectionTemplate[]> {
    const templatesRef = collection(this.firestore, 'reflectionTemplates');
    const templatesQuery = query(templatesRef, orderBy('order', 'asc'));

    return collectionData(templatesQuery, { idField: 'id' }).pipe(
      map((items) =>
        items
          .map((item) => this.toReflectionTemplate(item))
          .filter((template): template is ReflectionTemplate => template !== null),
      ),
      map((templates) => templates.filter((template) => template.isActive === true)),
      map((templates) => this.sortTemplates(templates)),
      catchError(() => of([])),
      startWith([]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private toReflectionTemplate(data: unknown): ReflectionTemplate | null {
    if (!isRecord(data)) {
      return null;
    }

    const label = readString(data, 'label');
    const type = readString(data, 'type');
    const translations = readTranslations(data, 'translations');
    const minCheckins = readNumber(data, 'minCheckins');
    const order = readNumber(data, 'order');
    const isActive = readBoolean(data, 'isActive');
    const updatedAt = readTimestamp(data, 'updatedAt');

    if (
      label === null ||
      type === null ||
      translations === null ||
      minCheckins === null ||
      order === null ||
      isActive === null ||
      updatedAt === null
    ) {
      return null;
    }

    const id = readString(data, 'id');

    return {
      ...(id ? { id } : {}),
      label,
      type,
      translations,
      minCheckins,
      order,
      isActive,
      updatedAt,
    };
  }

  private sortTemplates(templates: readonly ReflectionTemplate[]): ReflectionTemplate[] {
    return [...templates].sort((a, b) => a.order - b.order);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(data: Record<string, unknown>, key: string): boolean | null {
  const value = data[key];

  return typeof value === 'boolean' ? value : null;
}

function readTimestamp(data: Record<string, unknown>, key: string): Timestamp | null {
  const value = data[key];

  return value instanceof Timestamp ? value : null;
}

function readTranslations(
  data: Record<string, unknown>,
  key: string,
): ReflectionTemplateTranslations | null {
  const value = data[key];

  if (!isRecord(value)) {
    return null;
  }

  const en = readTranslation(value['en']);
  const he = readTranslation(value['he']);

  return en === null || he === null ? null : { en, he };
}

function readTranslation(value: unknown): ReflectionTemplateTranslation | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value, 'title');
  const body = readString(value, 'body');

  return title === null || body === null ? null : { title, body };
}
