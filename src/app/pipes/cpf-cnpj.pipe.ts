import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'cpfCnpj'
})

export class CpfCnpjPipe implements PipeTransform {
    transform(value: number, args?: any): any {
        if (!value) {
            return value;
        }
        let val = value.toString().replace(/\D/g, '');

        if (val.length <= 11) {
            // CPF mask: 000.000.000-00
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d)/, '$1.$2');
            val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ mask: 00.000.000/0000-00
            val = val.replace(/^(\d{2})(\d)/, '$1.$2');
            val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
            val = val.replace(/(\d{4})(\d)/, '$1-$2');
        }

        return val;
    }
}