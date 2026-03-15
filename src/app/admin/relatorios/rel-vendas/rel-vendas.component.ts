import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-rel-vendas',
  templateUrl: './rel-vendas.component.html',
  styleUrls: ['./rel-vendas.component.scss']
})
export class RelVendasComponent {

  form!: FormGroup;
  loading: boolean = false;
  clientes: any[] = [];

  constructor(private endpointService: EndpointsService, private alert: AlertService, private fb: FormBuilder) {
    this.form = this.fb.group({
      id: this.fb.control('relatorio-vendas-01'),
      param_data: this.fb.control('data_venda'),
      data_inicial: this.fb.control(dayjs().startOf('month').format('YYYY-MM-DD')),
      data_final: this.fb.control(dayjs().format('YYYY-MM-DD')),
      output: this.fb.control('pdf'),
    })
  }


  ngOnInit(): void {
    this.getClientes()
  }

  async getClientes() {
    try {
      let response = await this.endpointService.getClientesNoAuth();
      this.clientes = response.lista.map((item: any) => {
        return {
          _id: item._id,
          nome: item.nome
        }
      })
    } catch (error) {
      console.log(error);
    }
  }

  async onSubmit() {
    if (this.loading) return;
    this.loading = true;
    try {
      let output = this.form.get('output')?.value;
      if (output == 'pdf') {
        let responseType = 'blob';
        let response = await this.endpointService.get('/v1/admin/relatorios', this.form.getRawValue(), undefined, responseType);
        const blob = new Blob([response.body], { type: output == 'pdf' ? 'application/pdf' : 'application/json' });
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          // Abrir o share se tiver
          if (navigator['share']) {
            const file = new File([blob], `relatorio-fornecimento.${output}`, { type: blob.type });
            try {
              await navigator['share']({ files: [file] });
            } catch (error) {
              this.alert.showDanger('Erro ao compartilhar o arquivo.');
            }
          } else {
            console.log("AKI", blob);
            // Fazer download normal, vem o arquivo aqui.
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio-fornecimento.${output}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }
        } else {
          // Fazer download normal
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `relatorio-fornecimento.${output}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }
      if (output == 'html') {
        let response = await this.endpointService.get('/v1/admin/relatorios', this.form.getRawValue());
        // aqui no response vem o html puro
        let htmlWindow = window.open("", "_blank", "width=900,height=600,scrollbars=yes");
        if (htmlWindow) {
          htmlWindow.document.write(response);
          htmlWindow.document.close();
        }
      }
    } catch (error: any) {
      this.alert.showDanger(error)
    }
    this.loading = false;
  }




}
