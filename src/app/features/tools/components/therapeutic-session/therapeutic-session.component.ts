import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { IonicModule } from '@ionic/angular';

import type { ToolDefinition, ToolLocalizedText } from '../../../../core/models/tool.model';
import { LocalizationService } from '../../../../core/services/localization.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import {
  THERAPEUTIC_SESSION_DEFAULT_CONFIG,
  therapeuticSessionConfigForTool,
} from './therapeutic-session.config';
import type { TherapeuticSessionConfig } from './therapeutic-session.config';

// TODO: Replace this fallback once every therapeutic session tool has a configured durationSeconds.
const FALLBACK_SESSION_DURATION_SECONDS = 60;

type BreathingPhase = 'inhale' | 'holdExpanded' | 'exhale' | 'holdContracted';

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
  private breathingPhaseRemainingMs: number = THERAPEUTIC_SESSION_DEFAULT_CONFIG.breathing.inhaleMs;
  private hapticTapTimeoutIds: ReturnType<typeof setTimeout>[] = [];
  private lastRhythmHapticTransitionId: number | null = null;
  private hasPlayedCompletionHaptic = false;
  private hasCompleted = false;
  private totalSessionSeconds = FALLBACK_SESSION_DURATION_SECONDS;

  @Input({ required: true }) tool!: ToolDefinition;
  @Output() readonly exit = new EventEmitter<void>();
  @Output() readonly complete = new EventEmitter<void>();

  sessionConfig: TherapeuticSessionConfig = THERAPEUTIC_SESSION_DEFAULT_CONFIG;
  readonly currentDirection = this.localization.direction;
  remainingSeconds = 0;
  isPaused = false;
  breathingPhase: BreathingPhase = 'inhale';
  breathingPhaseDurationMs: number = THERAPEUTIC_SESSION_DEFAULT_CONFIG.breathing.inhaleMs;

  ngOnInit(): void {
    this.sessionConfig = therapeuticSessionConfigForTool(this.tool);
    this.remainingSeconds = this.resolveDurationSeconds();
    this.totalSessionSeconds = this.remainingSeconds;
    this.breathingPhaseRemainingMs = this.sessionConfig.breathing.inhaleMs;
    this.breathingPhaseDurationMs = this.sessionConfig.breathing.inhaleMs;
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

  showSessionStatsCard(): boolean {
    return this.sessionConfig.ui.showSessionStatsCard;
  }

  cycleProgressLabel(): string {
    return `${this.currentCycle()} / ${this.totalCycles()}`;
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
    this.enterBreathingPhase(0, this.sessionConfig.breathing.inhaleMs);
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
    const durations = this.sessionConfig.breathing;

    switch (phase) {
      case 'inhale':
        return durations.inhaleMs;
      case 'holdExpanded':
        return durations.holdExpandedMs;
      case 'exhale':
        return durations.exhaleMs;
      case 'holdContracted':
        return durations.holdContractedMs;
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
    const haptics = this.sessionConfig.haptics;

    if (
      !haptics.enabled ||
      this.hasCompleted ||
      this.lastRhythmHapticTransitionId === transitionId
    ) {
      return;
    }

    if (phase === 'inhale' && haptics.inhaleTaps > 0) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerTapPattern(haptics.inhaleTaps, haptics.inhaleTapGapMs, haptics.inhaleStyle);
      return;
    }

    if (phase === 'exhale' && haptics.exhaleTaps > 0) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerTapPattern(haptics.exhaleTaps, haptics.exhaleTapGapMs, haptics.exhaleStyle);
      return;
    }

    if (
      phase === 'holdExpanded' &&
      haptics.holdHapticsEnabled &&
      haptics.holdExpandedHapticEnabled
    ) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerTapPattern(1, 0, haptics.holdHapticStyle);
      return;
    }

    if (
      phase === 'holdContracted' &&
      haptics.holdHapticsEnabled &&
      haptics.holdContractedHapticEnabled
    ) {
      this.lastRhythmHapticTransitionId = transitionId;
      this.triggerTapPattern(1, 0, haptics.holdHapticStyle);
    }
  }

  private triggerTapPattern(tapCount: number, gapMs: number, style: ImpactStyle): void {
    this.clearPendingHapticTap();
    this.triggerTap(style);

    const safeTapCount = Math.max(1, Math.floor(tapCount));
    const safeGapMs = Math.max(0, Math.round(gapMs));

    for (let tapIndex = 1; tapIndex < safeTapCount; tapIndex += 1) {
      const timeoutId = setTimeout(() => {
        this.hapticTapTimeoutIds = this.hapticTapTimeoutIds.filter((id) => id !== timeoutId);
        this.triggerTap(style);
      }, safeGapMs * tapIndex);

      this.hapticTapTimeoutIds.push(timeoutId);
    }
  }

  private triggerTap(style: ImpactStyle): void {
    try {
      void Haptics.impact({ style }).catch(() => undefined);
    } catch {
      // Haptics are optional on web/simulator.
    }
  }

  private triggerCompletionHaptic(): void {
    if (
      !this.sessionConfig.haptics.completionEnabled ||
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
    if (!this.hapticTapTimeoutIds.length) {
      return;
    }

    this.hapticTapTimeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
    this.hapticTapTimeoutIds = [];
  }

  private currentCycle(): number {
    const cycleDurationSeconds = this.breathingCycleDurationSeconds();
    const elapsedSeconds = Math.max(0, this.totalSessionSeconds - this.remainingSeconds);

    return Math.min(this.totalCycles(), Math.floor(elapsedSeconds / cycleDurationSeconds) + 1);
  }

  private totalCycles(): number {
    return Math.max(1, Math.ceil(this.totalSessionSeconds / this.breathingCycleDurationSeconds()));
  }

  private breathingCycleDurationSeconds(): number {
    const durations = this.sessionConfig.breathing;
    const cycleDurationMs =
      durations.inhaleMs +
      durations.holdExpandedMs +
      durations.exhaleMs +
      durations.holdContractedMs;

    return Math.max(1, cycleDurationMs / 1000);
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
