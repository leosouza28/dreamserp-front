import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'userInfo'
})

export class UserInfoPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        console.log('value', value, 'args', args);
        let val = "";
        if (!value?._id) {
            val = 'Não informado';
        } else {
            val = `${value?.nome}`;
        }
        if (!!value?.documento) val += ` (${value?.documento})`;
        return val;
    }
}