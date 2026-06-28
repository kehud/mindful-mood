import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { IonicModule } from '@ionic/angular';

import { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

// TODO: Replace this fallback once every therapeutic session tool has a configured durationSeconds.
const FALLBACK_SESSION_DURATION_SECONDS = 60;

type BreathingPhase = 'inhale' | 'holdExpanded' | 'exhale' | 'holdContracted';

// Breathing rhythm tuning: adjust inhale/exhale duration here, and hold duration with the hold*Ms values.
// Aura min/max size, glow, and color strength are controlled by the CSS variables in the component stylesheet.
const BREATHING_PHASE_DURATIONS = {
  inhaleMs: 4200,
  holdExpandedMs: 1200,
  exhaleMs: 5200,
  holdContractedMs: 1200,
} as const;

const BREATHING_PHASE_SEQUENCE: readonly BreathingPhase[] = [
  'inhale',
  'holdExpanded',
  'exhale',
  'holdContracted',
];

const BREATHING_PHASE_LABELS: Record<BreathingPhase, ToolLocalizedText> = {
  inhale: { en: 'Inhale', he: 'שאיפה' },
  holdExpanded: { en: 'Hold', he: 'החזק' },
  exhale: { en: 'Exhale', he: 'נשיפה' },
  holdContracted: { en: 'Hold', he: 'החזק' },
};

const BREATHING_HAPTICS_CONFIG = {
  enableRhythmHaptics: true,
  inhaleHapticsEnabled: true,
  exhaleHapticsEnabled: true,
  completionHapticsEnabled: true,
  inhaleTapGapMs: 90,
  exhaleTapGapMs: 140,
} as const;

@Component({
  selector: 'app-therapeutic-session',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './therapeutic-session.component.html',
  styleUrls: ['./therapeutic-session.component.scss'],
})
export class TherapeuticSessionComponent implements OnInit, OnDestroy {
  private readonly localization = inject(LocalizationService);
  private timerId: ReturnType<typeof setInterval> | null = null;
  private breathingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private breathingPhaseIndex = 0;
  private breathingPhaseTransitionId = 0;
  private breathingPhaseStartedAt = 0;
  private breathingPhaseRemainingMs: number = BREATHING_PHASE_DURATIONS.inhaleMs;
  private hapticTapTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastRhythmHapticTransitionId: number | null = null;
  private hasPlayedCompletionHaptic = false;
  private hasCompleted = false;

  @Input({ required: true }) tool!: ToolDefinition;
  @Output() readonly exit = new EventEmitter<void>();
  @Output() readonly complete = new EventEmitter<void>();

  readonly currentDirection = this.localization.direction;
  remainingSeconds = 0;
  isPaused = false;
  breathingPhase: BreathingPhase = 'inhale';
  breathingPhaseDurationMs: number = BREATHING_PHASE_DURATIONS.inhaleMs;

  ngOnInit(): void {
    this.remainingSeconds = this.resolveDurationSeconds();
    this.startTimer();
    this.startBreathingCycle();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.clearBreathingTimer();
    this.clearPendingHapticTap();
  }

  title(): string {
    return this.localizedText(this.tool.title);
  }

  remainingTimeLabel(): string {
    return this.formatDuration(this.remainingSeconds);
  }

  pauseButtonLabel(): string {
    return this.isPaused ? 'Resume' : 'Pause';
  }

  breathingPhaseLabel(): string {
    return this.localizedText(BREATHING_PHASE_LABELS[this.breathingPhase]);
  }

  breathingPhaseDurationCss(): string {
    return `${this.breathingPhaseDurationMs}ms`;
  }

  isBreathingPhase(phase: BreathingPhase): boolean {
    return this.breathingPhase === phase;
  }

  isRunning(): boolean {
    return !this.isPaused && !this.hasCompleted;
  }

  isCompleted(): boolean {
    return this.hasCompleted;
  }

  exitSession(): void {
    this.clearTimer();
    this.clearBreathingTimer();
    this.clearPendingHapticTap();
    this.exit.emit();
  }

  togglePause(): void {
    if (this.hasCompleted || this.remainingSeconds <= 0) {
      return;
    }

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.clearTimer();
      this.pauseBreathingCycle();
      return;
    }

    this.startTimer();
    this.resumeBreathingCycle();
  }

  private resolveDurationSeconds(): number {
    const durationSeconds = this.tool.durationSeconds;

    return typeof durationSeconds === 'number' && Number.isFinite(durationSeconds) && durationSeconds > 0
      ? Math.max(1, Math.round(durationSeconds))
      : FALLBACK_SESSION_DURATION_SECONDS;
  }

  private startTimer(): void {
    if (this.timerId !== null || this.hasCompleted || this.isPaused) {
      return;
    }

    this.timerId = setInterval(() => this.tick(), 1000);
  }

  private tick(): void {
    if (this.hasCompleted) {
      this.clearTimer();
      return;
    }

    this.remainingSeconds = Math.max(0, this.remainingSeconds - 1);

    if (this.remainingSeconds === 0) {
      this.finishSession();
    }
  }

  private finishSession(): void {
    if (this.hasCompleted) {
      return;
    }

    this.hasCompleted = true;
    this.remainingSeconds = 0;
    this.clearTimer();
    this.clearBreathingTimer();
    this.clearPendingHapticTap();
    this.triggerCompletionHaptic();
    this.complete.emit();
  }

  private clearTimer(): void {
    if (this.timerId === null) {
      return;
    }

    clearInterval(this.timerId);
    this.timerId = null;
  }

  private startBreathingCycle(): void {
    this.enterBreathingPhase(0, BREATHING_PHASE_DURATIONS.inhaleMs);
  }

  private pauseBreathingCycle(): void {
    this.clearPendingHapticTap();

    if (this.breathingTimeoutId === null) {
      return;
    }

    const elapsedMs = Date.now() - this.breathingPhaseStartedAt;
    this.breathingPhaseRemainingMs = Math.max(0, this.breathingPhaseRemainingMs - elapsedMs);
    this.clearBreathingTimer();
  }

  private resumeBreathingCycle(): void {
    if (this.hasCompleted || this.breathingPhaseRemainingMs <= 0) {
      return;
    }

    this.breathingPhaseStartedAt = Date.now();
    this.breathingTimeoutId = setTimeout(() => this.advanceBreathingPhase(), this.breathingPhaseRemainingMs);
  }

  private advanceBreathingPhase(): void {
    if (this.hasCompleted || this.isPaused) {
      return;
    }

    const nextIndex = (this.breathingPhaseIndex + 1) % BREATHING_PHASE_SEQUENCE.length;
    this.enterBreathingPhase(nextIndex, this.durationForBreathingPhase(BREATHING_PHASE_SEQUENCE[nextIndex]));
  }

  private enterBreathingPhase(index: number, durationMs: number): void {
    this.clearBreathingTimer();
    this.breathingPhaseIndex = index;
    this.breathingPhaseTransitionId += 1;
    this.breathingPhase = BREATHING_PHASE_SEQUENCE[index];
    this.breathingPhaseDurationMs = durationMs;
    this.breathingPhaseRemainingMs = durationMs;
    this.breathingPhaseStartedAt = Date.now();
    this.triggerPhaseHaptics(this.breathingPhase, this.breathingPhaseTransitionId);

    if (!this.hasCompleted && !this.isPaused) {
      this.breathingTimeoutId = setTimeout(() => this.advanceBreathingPhase(), durationMs);
    }
  }

  private durationForBreathingPhase(phase: BreathingPhase): number {
    switch (phase) {
      case 'inhale':
        return BREATHING_PHASE_DURATIONS.inhaleMs;
      case 'holdExpanded':
        return BREATHING_PHASE_DURATIONS.holdExpandedMs;
      case 'exhale':
        return BREATHING_PHASE_DURATIONS.exhaleMs;
      case 'holdContracted':
        return BREATHING_PHASE_DURATIONS.holdContractedMs;
    }
  }

  private clearBreathingTimer(): void {
    if (this.breathingTimeoutId === null) {
      return;
    }

    clearTimeout(this.breathingTimeoutId);
    this.breathingTimeoutId = null;
  }

  private triggerPhaseHaptics(phase: BreathingPhase, transitionId: number): void {
    if (
      !BREATHING_HAPTICS_CONFIG.enableRhythmHaptics ||
      this.hasCompleted ||
      this.lastRhythmHapticTransitionId === transitionId
    ) {
      return;
    }

    if (phase === 'inhale' && BREATHING_HAPTICS_CONFIG.inhaleHapticsEnabled) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerDoubleTap(BREATHING_HAPTICS_CONFIG.inhaleTapGapMs);
      return;
    }

    if (phase === 'exhale' && BREATHING_HAPTICS_CONFIG.exhaleHapticsEnabled) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerDoubleTap(BREATHING_HAPTICS_CONFIG.exhaleTapGapMs);
    }
  }

  private triggerDoubleTap(gapMs: number): void {
    this.clearPendingHapticTap();
    this.triggerGentleTap();
    this.hapticTapTimeoutId = setTimeout(() => {
      this.hapticTapTimeoutId = null;
      this.triggerGentleTap();
    }, gapMs);
  }

  private triggerGentleTap(): void {
    try {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    } catch {
      // Haptics are optional on web/simulator.
    }
  }

  private triggerCompletionHaptic(): void {
    if (
      !BREATHING_HAPTICS_CONFIG.completionHapticsEnabled ||
      this.hasPlayedCompletionHaptic
    ) {
      return;
    }

    this.hasPlayedCompletionHaptic = true;

    try {
      void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    } catch {
      // Haptics are optional on web/simulator.
    }
  }

  private clearPendingHapticTap(): void {
    if (this.hapticTapTimeoutId === null) {
      return;
    }

    clearTimeout(this.hapticTapTimeoutId);
    this.hapticTapTimeoutId = null;
  }

  private formatDuration(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private localizedText(text: ToolLocalizedText): string {
    const language = this.localization.currentLanguage();

    return text[language]?.trim() || text.en.trim() || text.he.trim();
  }
}
