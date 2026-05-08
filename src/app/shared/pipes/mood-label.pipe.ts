import { Pipe, PipeTransform } from '@angular/core';

const labels: Record<number, string> = {
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
  transform(value: number): string {
    if (!Number.isFinite(value) || value < 1) {
      return 'Not set';
    }

    const level = Math.round(value);
    return labels[level] ?? `Mood ${level}`;
  }
}
