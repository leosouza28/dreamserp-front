import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br')
@Pipe({
    name: 'dateSimple'
})
export class DateSimplePipe implements PipeTransform {
    transform(value: string, args?: any): any {
        if (value && !args) {
            let [date] = value.split("T");
            date = date.split("-").reverse().join("/");
            value = date;
        }
        if (value && args == 'extenso') {
            let [date] = value.split("T");
            value = dayjs(date).format("DD [de] MMMM/YY").toUpperCase();
        }
        return value;
    }
}