import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

type SelectionStep = 'start' | 'end';

@Component({
  selector: 'date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
})
export class DateRangePickerComponent implements OnChanges {
  @Input() label: string = '';
  @Input() start: string | null = null;
  @Input() end: string | null = null;
  @Output() startChange = new EventEmitter<string | null>();
  @Output() endChange = new EventEmitter<string | null>();

  isOpen = false;
  currentMonth = dayjs().startOf('month');
  weeks: (dayjs.Dayjs | null)[][] = [];
  hoverDate: dayjs.Dayjs | null = null;
  selectionStep: SelectionStep = 'start';

  readonly weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.buildCalendar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Only close if not in the middle of selecting the end date
      if (this.selectionStep !== 'end') {
        this.isOpen = false;
      }
    }
  }

  toggle() {
    // Don't close while waiting for end date selection
    if (this.isOpen && this.selectionStep === 'end') {
      return;
    }
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      if (this.start) {
        this.currentMonth = dayjs(this.start).startOf('month');
      }
      this.selectionStep = this.start && !this.end ? 'end' : 'start';
      this.buildCalendar();
    }
  }

  prevMonth() {
    this.currentMonth = this.currentMonth.subtract(1, 'month');
    this.buildCalendar();
  }

  nextMonth() {
    this.currentMonth = this.currentMonth.add(1, 'month');
    this.buildCalendar();
  }

  buildCalendar() {
    const monthStart = this.currentMonth.startOf('month');
    const monthEnd = this.currentMonth.endOf('month');

    const weeks: (dayjs.Dayjs | null)[][] = [];
    let week: (dayjs.Dayjs | null)[] = [];

    // Leading empty days
    for (let i = 0; i < monthStart.day(); i++) {
      week.push(null);
    }

    let day = monthStart;
    while (day.isBefore(monthEnd) || day.isSame(monthEnd, 'day')) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      day = day.add(1, 'day');
    }

    // Trailing empty days
    while (week.length > 0 && week.length < 7) {
      week.push(null);
    }
    if (week.length > 0) weeks.push(week);

    this.weeks = weeks;
  }

  selectDate(day: dayjs.Dayjs) {
    if (this.selectionStep === 'start' || (this.start && this.end)) {
      // Start new selection
      this.startChange.emit(day.format('YYYY-MM-DD'));
      this.endChange.emit(null);
      this.hoverDate = null;
      this.selectionStep = 'end';
    } else {
      // Finish selection
      const startDay = dayjs(this.start!);
      if (day.isBefore(startDay, 'day')) {
        // Clicked before start: swap
        this.startChange.emit(day.format('YYYY-MM-DD'));
        this.endChange.emit(startDay.format('YYYY-MM-DD'));
      } else {
        this.endChange.emit(day.format('YYYY-MM-DD'));
      }
      this.hoverDate = null;
      this.selectionStep = 'start';
      this.isOpen = false;
    }
  }

  onDayHover(day: dayjs.Dayjs | null) {
    if (this.selectionStep === 'end' && this.start && !this.end) {
      this.hoverDate = day;
    }
  }

  isStart(day: dayjs.Dayjs): boolean {
    return !!this.start && day.isSame(dayjs(this.start), 'day');
  }

  isEnd(day: dayjs.Dayjs): boolean {
    return !!this.end && day.isSame(dayjs(this.end), 'day');
  }

  isInRange(day: dayjs.Dayjs): boolean {
    if (!this.start) return false;
    const s = dayjs(this.start);
    const e = this.end ? dayjs(this.end) : this.hoverDate;
    if (!e) return false;
    const rangeStart = s.isBefore(e, 'day') ? s : e;
    const rangeEnd = s.isBefore(e, 'day') ? e : s;
    return day.isAfter(rangeStart, 'day') && day.isBefore(rangeEnd, 'day');
  }

  isToday(day: dayjs.Dayjs): boolean {
    return day.isSame(dayjs(), 'day');
  }

  get displayValue(): string {
    if (this.start && this.end) {
      return `${dayjs(this.start).format('DD/MM/YYYY')} → ${dayjs(this.end).format('DD/MM/YYYY')}`;
    }
    if (this.start) {
      return `${dayjs(this.start).format('DD/MM/YYYY')} → ...`;
    }
    return '';
  }

  get placeholder(): string {
    return this.selectionStep === 'start' || !this.start
      ? 'Selecione o período'
      : 'Selecione a data final';
  }

  get monthLabel(): string {
    return this.currentMonth.locale('pt-br').format('MMMM [de] YYYY');
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    this.startChange.emit(null);
    this.endChange.emit(null);
    this.selectionStep = 'start';
    this.hoverDate = null;
  }
}
