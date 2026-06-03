const OPTION_ICON_FALLBACK = 'ellipse-outline';

export const EMOTION_ICONS: Record<string, string> = {
  Afraid: 'warning-outline',
  Amazed: 'sparkles-outline',
  Amused: 'happy-outline',
  Angry: 'flame-outline',
  Annoyed: 'alert-circle-outline',
  Anxious: 'warning-outline',
  Ashamed: 'eye-off-outline',
  Bored: 'remove-circle-outline',
  Calm: 'water-outline',
  Confident: 'shield-checkmark-outline',
  Content: 'heart-outline',
  Disappointed: 'sad-outline',
  Distracted: 'scan-outline',
  Embarrassed: 'person-circle-outline',
  Excited: 'flash-outline',
  Focused: 'eye-outline',
  Frustrated: 'thunderstorm-outline',
  Grateful: 'sparkles-outline',
  Guilty: 'lock-closed-outline',
  Happy: 'sunny-outline',
  Hopeful: 'heart-circle-outline',
  Indifferent: 'remove-circle-outline',
  Irritated: 'alert-circle-outline',
  Lonely: 'person-outline',
  Loved: 'heart-outline',
  Neutral: 'ellipse-outline',
  Other: 'ellipsis-horizontal-circle-outline',
  Overwhelmed: 'layers-outline',
  Proud: 'ribbon-outline',
  Relaxed: 'leaf-outline',
  Relieved: 'checkmark-circle-outline',
  Sad: 'sad-outline',
  Satisfied: 'checkmark-circle-outline',
  Stressed: 'pulse-outline',
  Tired: 'moon-outline',
  Worried: 'help-circle-outline',
};

export const INFLUENCE_ICONS: Record<string, string> = {
  'Current Events': 'newspaper-outline',
  Dating: 'heart-outline',
  Exercise: 'barbell-outline',
  Family: 'people-outline',
  Fitness: 'barbell-outline',
  Food: 'restaurant-outline',
  Friends: 'people-circle-outline',
  Health: 'heart-outline',
  Hobbies: 'color-palette-outline',
  Money: 'cash-outline',
  News: 'newspaper-outline',
  Other: 'ellipsis-horizontal-circle-outline',
  Partner: 'heart-circle-outline',
  Relationships: 'people-outline',
  School: 'school-outline',
  'Self-care': 'leaf-outline',
  Sleep: 'moon-outline',
  'Social Media': 'chatbubbles-outline',
  'Social media': 'chatbubbles-outline',
  Spirituality: 'sparkles-outline',
  Tasks: 'checkbox-outline',
  Travel: 'airplane-outline',
  Weather: 'partly-sunny-outline',
  Work: 'briefcase-outline',
};

export function emotionIconForLabel(...labels: readonly string[]): string {
  return iconForLabels(EMOTION_ICONS, labels);
}

export function influenceIconForLabel(...labels: readonly string[]): string {
  return iconForLabels(INFLUENCE_ICONS, labels);
}

function iconForLabels(iconMap: Record<string, string>, labels: readonly string[]): string {
  for (const label of labels) {
    const icon = iconMap[label];

    if (icon) {
      return icon;
    }
  }

  return OPTION_ICON_FALLBACK;
}
