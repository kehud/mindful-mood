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
}
