import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-form-crm',
  templateUrl: './form-crm.component.html',
  styleUrls: ['./form-crm.component.scss']
})
export class FormCrmComponent implements OnInit {

  form: FormGroup;
  loading: boolean = false;
  crm_data: any = null;

  docTypes = [
    { value: 'cpf', label: 'CPF' },
    { value: 'cnpj', label: 'CNPJ' }
  ];

  constructor(
    private fb: FormBuilder,
    private endpointService: EndpointsService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      _id: this.fb.control(''),
      doc_type: this.fb.control('cpf'),
      documento: this.fb.control(''),
      nome: this.fb.control('', [Validators.required]),
      tags: this.fb.array([]),
    });
  }

  get tags(): FormArray {
    return this.form.get('tags') as FormArray;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        const stateData = history.state?.crm;
        if (stateData && stateData._id === params['id']) {
          this.populateForm(stateData);
        } else {
          this.getItem(params['id']);
        }
      }
    });
  }

  adicionarTag() {
    this.tags.push(this.fb.group({
      key: this.fb.control('', [Validators.required]),
      value: this.fb.control('', [Validators.required]),
    }));
  }

  removerTag(index: number) {
    this.tags.removeAt(index);
  }

  populateForm(data: any) {
    this.tags.clear();
    if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
      data.tags.forEach((tag: { key: string; value: any }) => {
        this.tags.push(this.fb.group({
          key: this.fb.control(tag.key, [Validators.required]),
          value: this.fb.control(tag.value, [Validators.required]),
        }));
      });
    }
    this.crm_data = data;
    this.form.patchValue({
      _id: data._id,
      documento: data.documento,
      nome: data.nome,
      doc_type: data.doc_type || 'cpf',
    });
  }

  async getItem(id: string) {
    if (this.loading) return;
    this.loading = true;
    try {
      let data: any = await this.endpointService.getCrmById(id);
      this.populateForm(data);
    } catch (error: any) {
      this.alert.showDanger(error?.message || error);
    }
    this.loading = false;
  }

  buildTagsPayload(): { key: string; value: any }[] {
    return this.tags.controls.map(ctrl => ({
      key: ctrl.get('key')?.value,
      value: ctrl.get('value')?.value
    }));
  }

  private async documentoJaExiste(documento: string, idAtual: string): Promise<boolean> {
    try {
      const result: any = await this.endpointService.getCrmByDocumento(documento);
      const items: any[] = result?.lista ?? result?.items ?? result?.data ?? [];
      return items.some((crm: any) => crm.documento === documento && crm._id !== idAtual);
    } catch {
      return false;
    }
  }

  async onSubmit() {
    if (this.loading || this.form.invalid) return;

    const documento: string = this.form.get('documento')?.value ?? '';
    const idAtual: string = this.form.get('_id')?.value ?? '';

    if (documento && !idAtual) {
      this.loading = true;
      const duplicado = await this.documentoJaExiste(documento, idAtual);
      if (duplicado) {
        this.alert.showDanger('Já existe um CRM cadastrado com este CPF/CNPJ.');
        this.loading = false;
        return;
      }
    }

    this.loading = true;
    try {
      const payload = {
        ...this.form.getRawValue(),
        tags: this.buildTagsPayload(),
      };
      await this.endpointService.postCrm(payload);
      this.alert.showSuccess('Operação realizada com sucesso!');
      this.back();
    } catch (error: any) {
      this.alert.showDanger(error);
    }
    this.loading = false;
  }

  back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admin/crm/listar']);
    }
  }
}
