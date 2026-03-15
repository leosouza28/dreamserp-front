import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Alert {
    message: string;
    type: 'success' | 'warning' | 'danger';
}

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    private alertsSubject = new Subject<Alert>();
    alerts$ = this.alertsSubject.asObservable();

    showSuccess(message: string) {
        this.alertsSubject.next({ message, type: 'success' });
    }

    showWarning(message: string) {
        this.alertsSubject.next({ message, type: 'warning' });
    }

    showDanger(message: string) {
        this.alertsSubject.next({ message, type: 'danger' });
    }
}
