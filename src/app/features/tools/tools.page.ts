import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { WellnessHeaderComponent } from '../../shared/components/wellness-header/wellness-header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [IonicModule, TranslatePipe, WellnessHeaderComponent],
  templateUrl: './tools.page.html',
  styleUrls: ['./tools.page.scss'],
})
export class ToolsPage {}
