import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'peso'
})

export class PesoPipe implements PipeTransform {
    transform(value: number, args?: any): any {
        let val = "";
        if (!!value) val = value.toFixed(2);
        return val;
    }
}