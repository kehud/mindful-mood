import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

interface ToolCard {
  readonly titleKey: string;
  readonly subtitleKey: string;
  readonly icon: string;
  readonly tone: 'teal' | 'peach' | 'violet' | 'plum';
}

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [IonicModule, NgFor, TranslatePipe],
  templateUrl: './tools.page.html',
  styleUrls: ['./tools.page.scss'],
})
export class ToolsPage {
  private readonly recommendationLimit = 3;

  readonly tools: readonly ToolCard[] = [
    {
      titleKey: 'tools.breathe',
      subtitleKey: 'tools.breatheSubtitle',
      icon: 'radio-button-on-outline',
      tone: 'teal',
    },
    {
      titleKey: 'tools.reflect',
      subtitleKey: 'tools.reflectSubtitle',
      icon: 'pencil-outline',
      tone: 'peach',
    },
    {
      titleKey: 'tools.ground',
      subtitleKey: 'tools.groundSubtitle',
      icon: 'leaf-outline',
      tone: 'violet',
    },
    {
      titleKey: 'tools.sleep',
      subtitleKey: 'tools.sleepSubtitle',
      icon: 'moon-outline',
      tone: 'plum',
    },
  ];

  readonly recommendedTools = this.createRecommendedTools(this.tools);

  trackTool(_index: number, tool: ToolCard): string {
    return tool.titleKey;
  }

  private createRecommendedTools(tools: readonly ToolCard[]): readonly ToolCard[] {
    return this.pickRandomTools(tools, this.recommendationLimit);
  }

  private pickRandomTools(tools: readonly ToolCard[], count: number): readonly ToolCard[] {
    const seen = new Set<string>();
    const uniqueTools = tools.filter((tool) => {
      if (seen.has(tool.titleKey)) {
        return false;
      }

      seen.add(tool.titleKey);
      return true;
    });
    const shuffledTools = [...uniqueTools];

    for (let index = shuffledTools.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledTools[index], shuffledTools[swapIndex]] = [shuffledTools[swapIndex], shuffledTools[index]];
    }

    return shuffledTools.slice(0, Math.min(count, shuffledTools.length));
  }
}
