import { ImpactStyle } from '@capacitor/haptics';

import type { ToolDefinition, ToolTemplate } from '../../../../core/models/tool.model';

export interface TherapeuticSessionBreathingConfig {
  readonly inhaleMs: number;
  readonly holdExpandedMs: number;
  readonly exhaleMs: number;
  readonly holdContractedMs: number;
}

export interface TherapeuticSessionHapticsConfig {
  readonly enabled: boolean;
  readonly inhaleTaps: number;
  readonly inhaleTapGapMs: number;
  readonly exhaleTaps: number;
  readonly exhaleTapGapMs: number;
  readonly inhaleStyle: ImpactStyle;
  readonly exhaleStyle: ImpactStyle;
  readonly holdHapticsEnabled: boolean;
  readonly holdExpandedHapticEnabled: boolean;
  readonly holdContractedHapticEnabled: boolean;
  readonly holdHapticStyle: ImpactStyle;
  readonly completionEnabled: boolean;
}

export interface TherapeuticSessionAuraConfig {
  readonly size: string;
  readonly maxSize: string;
  readonly scaleMin: number;
  readonly scaleMax: number;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly glowOpacity: number;
  readonly glowOpacityExpanded: number;
  readonly blur: string;
}

export interface TherapeuticSessionUiConfig {
  readonly showSessionStatsCard: boolean;
}

export interface TherapeuticSessionConfig {
  readonly breathing: TherapeuticSessionBreathingConfig;
  readonly haptics: TherapeuticSessionHapticsConfig;
  readonly aura: TherapeuticSessionAuraConfig;
  readonly ui: TherapeuticSessionUiConfig;
}

export type TherapeuticSessionConfigOverride = {
  readonly breathing?: Partial<TherapeuticSessionBreathingConfig>;
  readonly haptics?: Partial<TherapeuticSessionHapticsConfig>;
  readonly aura?: Partial<TherapeuticSessionAuraConfig>;
  readonly ui?: Partial<TherapeuticSessionUiConfig>;
};

/*
  Aura tuning guide:
  - Smaller contracted aura: lower aura.scaleMin. Larger expanded aura: raise aura.scaleMax.
  - Faster movement: lower breathing.inhaleMs and breathing.exhaleMs; hold values control pauses.
  - Contracted glow: tune aura.glowOpacity, aura.primaryColor, aura.secondaryColor, and aura.blur.
  - Expanded glow: tune aura.glowOpacityExpanded, aura.scaleMax, and the same color values.
  Example 1 - More dramatic breathing: lower scaleMin, raise scaleMax, shorten inhaleMs/exhaleMs slightly.
  Example 2 - Softer calmer breathing: raise scaleMin, lower scaleMax, increase inhaleMs/exhaleMs, reduce glow intensity.
*/
export const THERAPEUTIC_SESSION_DEFAULT_CONFIG: TherapeuticSessionConfig = {
  breathing: {
    inhaleMs: 3600,
    holdExpandedMs: 1200,
    exhaleMs: 4300,
    holdContractedMs: 1200,
  },
  haptics: {
    enabled: true,
    inhaleTaps: 3,
    inhaleTapGapMs: 85,
    exhaleTaps: 3,
    exhaleTapGapMs: 165,
    inhaleStyle: ImpactStyle.Medium,
    exhaleStyle: ImpactStyle.Medium,
    holdHapticsEnabled: true,
    holdExpandedHapticEnabled: true,
    holdContractedHapticEnabled: true,
    holdHapticStyle: ImpactStyle.Heavy,
    completionEnabled: true,
  },
  aura: {
    size: 'clamp(194px, min(70vw, 31dvh), 288px)',
    maxSize: 'min(calc(100vw - 44px), 372px)',
    scaleMin: 0.76,
    scaleMax: 1.24,
    primaryColor: '100, 207, 209',
    secondaryColor: '248, 198, 188',
    glowOpacity: 0.86,
    glowOpacityExpanded: 1,
    blur: 'clamp(18px, 5.2vw, 28px)',
  },
  ui: {
    showSessionStatsCard: false,
  },
};

export const THERAPEUTIC_SESSION_CONFIG_BY_TEMPLATE: Partial<
  Record<ToolTemplate, TherapeuticSessionConfigOverride>
> = {
  therapeutic_session: {},
};

export const THERAPEUTIC_SESSION_CONFIG_BY_TYPE: Record<string, TherapeuticSessionConfigOverride> = {};

export const THERAPEUTIC_SESSION_CONFIG_BY_TOOL_ID: Record<string, TherapeuticSessionConfigOverride> = {};

export function therapeuticSessionConfigForTool(tool: ToolDefinition): TherapeuticSessionConfig {
  const typeConfig = tool.type ? THERAPEUTIC_SESSION_CONFIG_BY_TYPE[tool.type] : undefined;

  return mergeTherapeuticSessionConfig(
    THERAPEUTIC_SESSION_CONFIG_BY_TEMPLATE[tool.template],
    typeConfig,
    THERAPEUTIC_SESSION_CONFIG_BY_TOOL_ID[tool.id],
  );
}

function mergeTherapeuticSessionConfig(
  ...overrides: readonly (TherapeuticSessionConfigOverride | undefined)[]
): TherapeuticSessionConfig {
  return overrides.reduce<TherapeuticSessionConfig>(
    (config, override) => {
      if (!override) {
        return config;
      }

      return {
        breathing: { ...config.breathing, ...override.breathing },
        haptics: { ...config.haptics, ...override.haptics },
        aura: { ...config.aura, ...override.aura },
        ui: { ...config.ui, ...override.ui },
      };
    },
    THERAPEUTIC_SESSION_DEFAULT_CONFIG,
  );
}
