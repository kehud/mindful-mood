import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ChipOptionComponent } from '../chip-option/chip-option.component';

export interface ChipSelectorOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-chip-selector',
  standalone: true,
  imports: [ChipOptionComponent, NgFor],
  templateUrl: './chip-selector.component.html',
  styleUrls: ['./chip-selector.component.scss'],
})
export class ChipSelectorComponent {
  @Input() options: readonly (string | ChipSelectorOption)[] = [];
  @Input() selectedValues: readonly string[] = [];
  @Input() ariaLabel = 'Select options';
  @Input() tone: 'mint' | 'peach' | 'blue' = 'mint';

  @Output() selectedValuesChange = new EventEmitter<string[]>();

  optionValue(option: string | ChipSelectorOption): string {
    return typeof option === 'string' ? option : option.value;
  }

  optionLabel(option: string | ChipSelectorOption): string {
    return typeof option === 'string' ? option : option.label;
  }

  isSelected(option: string | ChipSelectorOption): boolean {
    return this.selectedValues.includes(this.optionValue(option));
  }

  toggleOption(option: string | ChipSelectorOption): void {
    const optionValue = this.optionValue(option);
    const nextValues = this.isSelected(option)
      ? this.selectedValues.filter((value) => value !== optionValue)
      : [...this.selectedValues, optionValue];

    this.selectedValuesChange.emit(nextValues);
  }
}
