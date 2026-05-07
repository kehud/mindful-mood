import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ChipOptionComponent } from '../chip-option/chip-option.component';

@Component({
  selector: 'app-chip-selector',
  standalone: true,
  imports: [ChipOptionComponent, NgFor],
  templateUrl: './chip-selector.component.html',
  styleUrls: ['./chip-selector.component.scss'],
})
export class ChipSelectorComponent {
  @Input() options: readonly string[] = [];
  @Input() selectedValues: readonly string[] = [];
  @Input() ariaLabel = 'Select options';
  @Input() tone: 'mint' | 'peach' | 'blue' = 'mint';

  @Output() selectedValuesChange = new EventEmitter<string[]>();

  isSelected(option: string): boolean {
    return this.selectedValues.includes(option);
  }

  toggleOption(option: string): void {
    const nextValues = this.isSelected(option)
      ? this.selectedValues.filter((value) => value !== option)
      : [...this.selectedValues, option];

    this.selectedValuesChange.emit(nextValues);
  }
}
