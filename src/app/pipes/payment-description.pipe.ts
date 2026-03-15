import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'paymentDescription'
})

export class PaymentDescriptionPipe implements PipeTransform {
    transform(value: string, args?: any): any {
        let val = "";
        if (!!value) {
            val = value;
            if (value == 'CARTÃO DE CRÉDITO PORTARIA') {
                val = 'CRÉDITO'
            }
            if (value == 'CARTÃO DE DÉBITO PORTARIA') {
                val = 'DÉBITO'
            }
        }
        return val;
    }
}