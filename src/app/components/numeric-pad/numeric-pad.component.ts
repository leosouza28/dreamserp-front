import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'numeric-pad',
  templateUrl: './numeric-pad.component.html',
  styleUrls: ['./numeric-pad.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumericPadComponent),
      multi: true
    }
  ]
})
export class NumericPadComponent implements ControlValueAccessor {
  public numbers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'backspace'];
  public digits: string = '';
  public displayValue: string = '0,00';
  public isDisabled: boolean = false;

  private onChange = (value: number) => {};
  private onTouched = () => {};

  writeValue(value: number): void {
    const centavos = Math.round((value || 0) * 100);
    this.digits = centavos.toString();
    this.updateDisplay();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onClick(value: string): void {
    if (this.isDisabled) return;

    if (value === 'backspace') {
      this.digits = this.digits.slice(0, -1);
    } else {
      this.digits += value;
    }

    this.updateDisplay();
    this.onTouched();
  }

  updateDisplay(): void {
    const numericValue = parseInt(this.digits || '0', 10);
    const reais = Math.floor(numericValue / 100);
    const centavos = numericValue % 100;

    this.displayValue = `${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
    const floatValue = numericValue / 100;
    this.onChange(floatValue);
  }
}
