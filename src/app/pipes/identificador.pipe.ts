import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'identificador'
})

export class IdentificadorPipe implements PipeTransform {
    transform(value: string, args?: any): any {
        let val = value;
        if (val?.includes("VALE_DAS_MINAS_PARK")) {
            val = val.split("_").pop() ?? val;
        }
        return val;
    }
}