import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonicModule, TranslatePipe],
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  constructor(private readonly router: Router) {}

  openCheckIn(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl('/check-in/mood');
  }
}
