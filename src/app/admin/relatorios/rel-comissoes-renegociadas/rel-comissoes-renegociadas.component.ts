import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AlertService } from 'src/app/services/alert.service';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-rel-comissoes-renegociadas',
  templateUrl: './rel-comissoes-renegociadas.component.html',
  styleUrls: ['./rel-comissoes-renegociadas.component.scss']
})
export class RelComissoesRenegociadasComponent {


  form!: FormGroup;
  loading: boolean = false;

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private alert = inject(AlertService);

  constructor() {
    this.form = this.fb.group({
      id: "rel_comissoes_renegociadas",
      data_inicial: this.fb.control("2025-10-01"),
      data_final: this.fb.control("2026-03-31"),
      output: this.fb.control("xlsx"),
    })
  }


  async onSubmit() {
    this.loading = true;
    try {
      let url = '/v1/admin/relatorios';
      let output = this.form.value.output;
      if (output == 'html') {
        let response: any = await this.api.get(url);
        let w = window.open();
        w!.document.write(response);
      }
      if (output == 'xlsx') {
        let response: any = await this.api.get(url, this.form.getRawValue(), undefined, 'blob');
        this.api.handleRelatorio(output, response.body, `rel_comissoes_renegociadas_${new Date().toISOString()}`);
      }
    } catch (error: any) {
      this.alert.showDanger(error)
    } finally {
      this.loading = false;
    }
  }

}
