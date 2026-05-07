import { Pipe, PipeTransform } from '@angular/core';

import { MoodLevel } from '../../core/models/mood-entry.model';

const labels: Record<MoodLevel, string> = {
  1: 'Very unpleasant',
  2: 'Unpleasant',
  3: 'Slightly unpleasant',
  4: 'Neutral',
  5: 'Slightly pleasant',
  6: 'Pleasant',
  7: 'Very pleasant',
};

@Pipe({
  name: 'moodLabel',
  standalone: true,
})
export class MoodLabelPipe implements PipeTransform {
  transform(value: MoodLevel | number): string {
    if (!Number.isFinite(value) || value < 1) {
      return 'Not set';
    }

    const level = Math.min(7, Math.max(1, Math.round(value))) as MoodLevel;
    return labels[level];
  }
}
