import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { EndpointsService } from 'src/app/services/endpoints.service';

export interface Pessoa {
  _id: string;
  documento: string;
  nome: string;
  telefone: string;
  data_nascimento: string;
}

@Component({
  selector: 'cliente-quick-form',
  templateUrl: './cliente-quick-form.component.html',
  styleUrls: ['./cliente-quick-form.component.scss']
})
export class ClienteQuickFormComponent {
  @Input() searchFn!: (documento: string) => Observable<Pessoa | null>;
  @Output() pessoaEncontrada = new EventEmitter<Pessoa>();
  @Output() pessoaCadastrada = new EventEmitter<Pessoa>();

  documentoForm: FormGroup;
  clienteForm: FormGroup;
  mostraFormularioExtra = false;
  loading = false;
  loading_cadastro = false;
  error_modal_1: any;
  error_modal_2: any;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private endpoint: EndpointsService
  ) {
    this.documentoForm = this.fb.group({
      documento: ['', [Validators.required]]
    });

    this.clienteForm = this.fb.group({
      label_form: 'Buscar cliente',
      label_instruction: '',
      _id: [''],
      documento: ['', Validators.required],
      nome: ['', Validators.required],
      telefone: ['', Validators.required],
      data_nascimento: ['']
    });
  }

  async buscar() {
    if (this.loading || this.documentoForm.invalid) return;
    this.loading = true;
    const documento = this.documentoForm.value.documento;
    if (!documento) return;
    this.error_modal_1 = '';
    try {
      let response: any = await this.searchFn(documento);
      if (response) {
        this.clienteForm.patchValue({
          label_form: 'Cliente encontrado',
          label_instruction: "Edição não habilitada, caso queira corrigir algum dado desse cliente, abra o cadastro dele.",
          _id: response?._id || '',
          documento: response?.documento || '',
          nome: response?.nome || '',
          telefone: response?.telefone_principal?.valor || '',
          data_nascimento: response?.data_nascimento_form || ''
        });
        this.clienteForm.disable();
        this.mostraFormularioExtra = true;
      } else {
        this.clienteForm.patchValue({
          label_form: 'Novo cliente',
          label_instruction: "Informe os dados básicos para continuar e criar esse cliente.",
          _id: '',
          documento,
          nome: '',
          telefone: '',
          data_nascimento: ''
        });
      }
    } catch (error: any) {
      if (error?.message?.indexOf('Nenhum cliente encontrado') > -1) {
        this.mostraFormularioExtra = true;
        this.clienteForm.patchValue({ documento });
        this.clienteForm.get('documento')?.disable();
      } else {
        this.error_modal_1 = error;
      }
    }
    this.loading = false;
  }


  dismissModal() {
    this.activeModal.dismiss();
  }

  async cadastrar() {
    if (this.clienteForm.invalid || this.loading_cadastro) return;
    this.error_modal_2 = '';
    this.loading_cadastro = true;
    try {
      let values = this.clienteForm.getRawValue();
      if (!!values?._id) {
        this.endpoint.logDev('Cliente existente, definir...', values);
        this.pessoaCadastrada.emit(values);
        this.activeModal.close(); // opcional, fecha o modal
      } else {
        let new_user = await this.endpoint.postUsuarioSimples(values);
        this.endpoint.logDev('Novo cliente, definir...', new_user);
        this.pessoaCadastrada.emit(new_user);
      }
    } catch (error) {
      this.error_modal_2 = error;
    }
    this.loading_cadastro = false;
  }


  back1() {
    this.resetClienteForm();
    this.documentoForm.patchValue({ documento: '' })
    setTimeout(() => {
      document.getElementById('documento-query')?.focus();
    }, 250);
  }

  resetClienteForm() {
    this.clienteForm.reset();
    this.clienteForm.patchValue({
      label_form: 'Buscar cliente',
      label_instruction: '',
      _id: '',
      documento: '',
      nome: '',
      telefone: '',
      data_nascimento: ''
    });
    this.mostraFormularioExtra = false;
  }

  get labelForm() {
    let label = ''
    if (this.clienteForm.get('label_form')?.value) {
      label = this.clienteForm.get('label_form')?.value
    }
    return label
  }
  get labelInstruction() {
    let label = ''
    if (this.clienteForm.get('label_instruction')?.value) {
      label = this.clienteForm.get('label_instruction')?.value
    }
    return label
  }

  get buttonActionLabel() {
    let label = ''
    if (this.clienteForm.get('_id')?.value) {
      label = 'Confirmar'
    } else {
      label = 'Cadastrar e confirmar'
    }
    return label
  }
}
