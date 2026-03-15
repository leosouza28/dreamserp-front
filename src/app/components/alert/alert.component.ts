import { Component, isDevMode } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import { AlertService, Alert } from '../../services/alert.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class AlertComponent {
  alerts: Alert[] = [];

  constructor(private alertService: AlertService) {
    this.alertService.alerts$.subscribe((alert) => {
      if (isDevMode()) console.log('Alert received:', alert);
      this.alerts.push(alert);
      setTimeout(() => this.removeAlert(alert), 3000); // auto dismiss after 3s
    });
  }

  removeAlert(alert: Alert) {
    this.alerts = this.alerts.filter(a => a !== alert);
  }
}
