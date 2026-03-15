import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-form-pessoas',
  templateUrl: './form-pessoas.component.html',
  styleUrls: ['./form-pessoas.component.scss']
})
export class FormPessoasComponent implements OnInit {

  @Input() modal: NgbActiveModal | null = null; // Se for modal, recebe a instância
  @Input() pessoaId: string = ''; // ID da pessoa para edição (quando modal)

  form: FormGroup;
  loading: boolean = false;
  loadingCep: boolean = false;
  isModal: boolean = false;

  docTypes = [
    { value: 'CPF', label: 'CPF' },
    { value: 'CNPJ', label: 'CNPJ' }
  ];

  tipos = [
    { value: 'CLIENTE', label: 'Cliente' },
    { value: 'FORNECEDOR', label: 'Fornecedor' }
  ];

  status = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'BLOQUEADO', label: 'Bloqueado' }
  ];

  tiposTelefone = [
    { value: 'CEL_WHATSAPP', label: 'Celular com WhatsApp' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'CELULAR', label: 'Celular' },
    { value: 'FIXO', label: 'Fixo' }
  ];

  estados: any[] = [];
  cidades: any[] = [];

  user_data: any = null;

  constructor(
    private fb: FormBuilder,
    private endpointService: EndpointsService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {
    this.form = this.fb.group({
      _id: this.fb.control(''),
      tipos: this.fb.control([], [Validators.required]),
      doc_type: this.fb.control('CPF', [Validators.required]),
      documento: this.fb.control('', []),
      nome: this.fb.control('', [Validators.required]),
      razao_social: this.fb.control(''),
      email: this.fb.control('', [Validators.email]),
      data_nascimento: this.fb.control(''),
      sexo: this.fb.control(''),
      status: this.fb.control('ATIVO', [Validators.required]),
      telefones: this.fb.array([]),
      dias_cobranca: this.fb.control(''),
      endereco: this.fb.group({
        cep: this.fb.control(''),
        logradouro: this.fb.control(''),
        numero: this.fb.control(''),
        complemento: this.fb.control(''),
        bairro: this.fb.control(''),
        cidade: this.fb.control(''),
        estado: this.fb.control('')
      })
    });
  }

  get telefones(): FormArray {
    return this.form.get('telefones') as FormArray;
  }

  ngOnInit(): void {
    this.isModal = !!this.modal;
    this.init();

    // Observar mudanças no doc_type para limpar data_nascimento se for CNPJ
    this.form.get('doc_type')?.valueChanges.subscribe(value => {
      if (value === 'CNPJ') {
        this.form.patchValue({ data_nascimento: '' });
      }
    });

    // Observar mudanças no estado para carregar cidades
    this.form.get('endereco.estado')?.valueChanges.subscribe(estado => {
      if (estado) {
        this.loadCidades(estado);
      }
    });

    if (!this.isModal) {
      this.route.queryParams.subscribe((params) => {
        if (params['id']) {
          this.getItem(params['id']);
        }
      });
    } else if (this.pessoaId) {
      this.getItem(this.pessoaId);
    }
  }

  async init() {
    try {
      this.estados = await this.endpointService.getEstados();
    } catch (error: any) {
      this.alert.showDanger(error);
    }
  }

  async loadCidades(estado: string) {
    try {
      this.cidades = await this.endpointService.getCidades(estado);
    } catch (error: any) {
      this.alert.showDanger(error);
    }
  }

  async consultarCEP() {
    const cep = this.form.get('endereco.cep')?.value;
    if (!cep || cep.replace(/\D/g, '').length < 8) return;

    this.loadingCep = true;
    try {
      const data: any = await this.endpointService.getConsultaCEP(cep.replace(/\D/g, ''));
      this.form.patchValue({
        endereco: {
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          complemento: data.complemento
        }
      });

      setTimeout(() => {
        document.getElementById('numero')?.focus();
      }, 250);
    } catch (error: any) {
      this.alert.showDanger('CEP não encontrado');
    }
    this.loadingCep = false;
  }

  adicionarTelefone() {
    const telefoneGroup = this.fb.group({
      tipo: this.fb.control('CEL_WHATSAPP'),
      valor: this.fb.control(''),
      principal: this.fb.control(this.telefones.length === 0) // Primeiro telefone é principal por padrão
    });
    this.telefones.push(telefoneGroup);
  }

  marcarComoPrincipal(index: number) {
    // Desmarcar todos os outros telefones
    this.telefones.controls.forEach((control, i) => {
      control.patchValue({ principal: i === index });
    });
  }

  removerTelefone(index: number) {
    this.telefones.removeAt(index);
  }

  toggleTipo(tipo: string) {
    const tipos = this.form.get('tipos')?.value || [];
    const index = tipos.indexOf(tipo);

    if (index > -1) {
      tipos.splice(index, 1);
    } else {
      tipos.push(tipo);
    }

    this.form.patchValue({ tipos: [...tipos] });
  }

  isTipoSelecionado(tipo: string): boolean {
    const tipos = this.form.get('tipos')?.value || [];
    return tipos.includes(tipo);
  }

  async getItem(pessoa_id: string) {
    if (this.loading) return;
    this.loading = true;
    try {
      let data: any = await this.endpointService.getPessoaById(pessoa_id);

      // Limpar telefones antes de popular
      this.telefones.clear();

      // Popular telefones se existirem
      if (data.telefones && data.telefones.length > 0) {
        data.telefones.forEach((tel: any) => {
          this.telefones.push(this.fb.group({
            tipo: this.fb.control(tel.tipo),
            valor: this.fb.control(tel.valor),
            principal: this.fb.control(tel.principal || false)
          }));
        });
      }
      if(!!data?.data_nascimento){
        data.data_nascimento = data.data_nascimento.split('T')[0];
      }

      this.user_data = data;

      this.form.patchValue(data);

      // Carregar cidades se houver estado
      if (data.endereco?.estado) {
        await this.loadCidades(data.endereco.estado);
        // reset na cidade
        setTimeout(() => {
          this.form.get('endereco.cidade')?.setValue(data.endereco.cidade);
        }, 250);
      }
    } catch (error: any) {
      this.alert.showDanger(error);
    }
    this.loading = false;
  }

  async onSubmit() {
    if (this.loading || this.form.invalid) return;
    this.loading = true;
    try {
      let result = await this.endpointService.postPessoa(this.form.getRawValue());
      this.alert.showSuccess('Operação realizada com sucesso!');
      if (this.isModal && this.modal) {
        this.modal.close(result);
      } else {
        this.back();
      }
    } catch (error: any) {
      this.alert.showDanger(error);
    }
    this.loading = false;
  }

  getTelTipo(index: number): string {
    return this.telefones.at(index).get('tipo')?.value;
  }
  
  back() {
    if (this.isModal && this.modal) {
      this.modal.dismiss();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admin/pessoas']);
    }
  }

}
