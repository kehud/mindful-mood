import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-wellness-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './wellness-header.component.html',
  styleUrls: ['./wellness-header.component.scss'],
})
export class WellnessHeaderComponent {
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() subtitle = '';
}
