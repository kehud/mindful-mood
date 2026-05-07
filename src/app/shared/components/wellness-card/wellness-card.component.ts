import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-wellness-card',
  standalone: true,
  imports: [NgIf],
  templateUrl: './wellness-card.component.html',
  styleUrls: ['./wellness-card.component.scss'],
})
export class WellnessCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() tone: 'plain' | 'mint' | 'peach' | 'blue' = 'plain';
}
