import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-chip-option',
  standalone: true,
  imports: [IonicModule, NgIf],
  templateUrl: './chip-option.component.html',
  styleUrls: ['./chip-option.component.scss'],
})
export class ChipOptionComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() selected = false;
  @Input() tone: 'mint' | 'peach' | 'blue' = 'mint';

  @Output() toggleSelection = new EventEmitter<void>();
}
