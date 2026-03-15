import { Pipe, PipeTransform } from '@angular/core';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import relativeTime from 'dayjs/plugin/relativeTime' // ES 2015

dayjs.locale('pt-br')
dayjs.extend(relativeTime);

@Pipe({
    name: 'dateFromNow'
})
export class DateFromNowPipe implements PipeTransform {
    transform(value: string = dayjs().format("YYYY-MM-DDTHH:mm:ss"), args?: any): any {
        if (value) {
            return dayjs(value).fromNow();
        }
        return value;
    }
}