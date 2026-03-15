import {
  Component,
  Input,
  forwardRef,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

export interface SelectOption<T = any> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-multi-checkbox-select',
  templateUrl: './multi-checkbox-select.component.html',
  styleUrls: ['./multi-checkbox-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiCheckboxSelectComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiCheckboxSelectComponent<T = any>
  implements ControlValueAccessor {
  /* ---------- API ---------- */
  @Input() options: SelectOption<T>[] = [];
  @Input() placeholder = 'Selecione';
  @Input() separator = ', ';

  /* ---------- estado interno ---------- */
  value: T[] = [];
  open = false;
  disabled = false;

  /* ---------- ControlValueAccessor ---------- */
  private onChange: (_: T[]) => void = () => { };
  private onTouched: () => void = () => { };

  writeValue(val: T[] | null): void {
    this.value = Array.isArray(val) ? val : [];
  }
  registerOnChange(fn: (_: T[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) this.open = false;
  }

  /* ---------- helpers ---------- */
  toggleDropdown(): void {
    if (this.disabled) return;
    this.open = !this.open;
  }

  isChecked(v: T): boolean {
    return this.value.includes(v);
  }
  toggleValue(v: T, event: any): void {
    if (event?.target?.checked && !this.value.includes(v)) {
      this.value = [...this.value, v];
    } else if (!event?.target?.checked) {
      this.value = this.value.filter((x) => x !== v);
    }
    this.onChange(this.value);
  }

  get summary(): string {
    if (!this.value.length) {
      return this.placeholder;
    }
    
    // Mapear valores para labels
    const selectedLabels = this.value
      .map(v => {
        const option = this.options.find(opt => opt.value === v);
        return option ? option.label : v;
      })
      .filter(label => label); // Remove valores não encontrados
    
    return selectedLabels.join(this.separator);
  }

  /* ---------- fecha ao clicar fora ---------- */
  constructor(private host: ElementRef<HTMLElement>) { }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (this.open && !this.host.nativeElement.contains(ev.target as Node)) {
      this.open = false;
      this.onTouched();
    }
  }
}
