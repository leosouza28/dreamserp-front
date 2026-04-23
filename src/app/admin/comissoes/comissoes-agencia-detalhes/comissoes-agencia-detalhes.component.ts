import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-comissoes-agencia-detalhes',
  templateUrl: './comissoes-agencia-detalhes.component.html',
  styleUrls: ['./comissoes-agencia-detalhes.component.scss']
})
export class ComissoesAgenciaDetalhesComponent {
  private readonly VALE_DAS_MINAS_PARK_URL = 'https://valedasminaspark.lsdevelopers.dev/admin/vendas/listar';
  private readonly VALE_DAS_MINAS_PARK_TITULO_URL = 'https://valedasminaspark.lsdevelopers.dev/admin/titulos/operar';
  readonly valorParcelaCurrencyOptions = {
    align: 'left',
    allowNegative: true,
    allowZero: true,
    decimal: ',',
    precision: 2,
    prefix: '',
    suffix: '',
    thousands: '.',
    nullable: true,
    min: null,
    max: null,
  };

  loading: boolean = false;
  loadingCancel: boolean = false;
  loadingEdit: boolean = false;

  private activatedRoute = inject(ActivatedRoute);
  private endpointService = inject(EndpointsService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private modalService = inject(NgbModal);

  dados: any;
  receitaId: string = '';

  // Seleção múltipla
  selected = new Set<string>();

  // Modal de edição/criação
  @ViewChild('modalEditarParcela') modalEditarParcelaRef!: TemplateRef<any>;
  @ViewChild('modalCancelarParcela') modalCancelarParcelaRef!: TemplateRef<any>;
  @ViewChild('modalExcluirParcela') modalExcluirParcelaRef!: TemplateRef<any>;
  private editModalRef: NgbModalRef | null = null;
  private cancelModalRef: NgbModalRef | null = null;
  private deleteModalRef: NgbModalRef | null = null;
  parcelaEditando: any = null;
  parcelasParaCancelar: any[] = [];
  parcelasParaExcluir: any[] = [];
  cancelMode: 'single' | 'bulk' = 'single';
  deleteMode: 'single' | 'bulk' = 'single';
  loadingDelete: boolean = false;
  parcelaMode: 'criar' | 'editar' = 'editar';
  editForm: FormGroup = this.fb.group({
    id_parcela: [''],
    tipo: [''],
    forma_pagamento: [''],
    status: [''],
    parcela: [null],
    total_parcelas: [null],
    label_parcelas: [''],
    valor_parcela: [null],
    data_vencimento: [null],
    data_recebimento: [null],
  });
  cancelForm: FormGroup = this.fb.group({
    observacao: [''],
  });

  readonly TIPOS = ['ENTRADA', 'ENTRADA RESTANTE', 'SALDO', 'DEVOLUCAO'];
  readonly FORMAS_PAGAMENTO = ['DINHEIRO', 'PIX', 'MAQUINA_DREAMS', "BOLETO_DREAMS"];
  readonly STATUS_OPCOES = ['PENDENTE', 'LIQUIDADO', 'CANCELADO'];

  get totalParcelas(): number {
    return (this.dados?.parcelas ?? []).reduce((acc: number, p: any) => acc + (p.valor_parcela ?? 0), 0);
  }

  get allSelected(): boolean {
    return !!this.dados?.parcelas?.length && this.dados.parcelas.every((p: any) => this.selected.has(p._id));
  }

  get totalCancelamentoSelecionado(): number {
    return this.parcelasParaCancelar.reduce((acc: number, p: any) => acc + (p.valor_parcela ?? 0), 0);
  }

  get isEditStatusLiquidado(): boolean {
    return this.editForm.get('status')?.value === 'LIQUIDADO';
  }

  get isValeDasMinasPark(): boolean {
    return (this.dados?.identificador || '').includes('VALE_DAS_MINAS_PARK');
  }

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      this.receitaId = params['id'];
      this.loadData(this.receitaId);
    });

    this.editForm.get('status')?.valueChanges.subscribe((status) => {
      if (status !== 'LIQUIDADO') {
        this.editForm.patchValue({ data_recebimento: null }, { emitEvent: false });
      }
    });

    this.editForm.get('tipo')?.valueChanges.subscribe((tipo) => {
      if (tipo === 'DEVOLUCAO') {
        const valor = this.editForm.get('valor_parcela')?.value;
        if (valor !== null && valor !== undefined && valor > 0) {
          this.editForm.patchValue({ valor_parcela: -valor }, { emitEvent: false });
        }
      }
    });
  }

  async loadData(id: string) {
    try {
      this.loading = true;
      let data = await this.endpointService.getParcelasComissoesById(id);
      this.endpointService.logDev(JSON.stringify(data, null, 2));
      this.dados = data;
      this.selected.clear();
    } catch (error: any) {
      this.alertService.showDanger(error);
    } finally {
      this.loading = false;
    }
  }

  toggleSelect(parcelaId: string) {
    if (this.selected.has(parcelaId)) {
      this.selected.delete(parcelaId);
    } else {
      this.selected.add(parcelaId);
    }
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selected.clear();
    } else {
      (this.dados?.parcelas ?? []).forEach((p: any) => this.selected.add(p._id));
    }
  }

  abrirModalCancelarParcela(parcela: any) {
    if (this.loadingCancel || !parcela) return;
    this.cancelMode = 'single';
    this.parcelasParaCancelar = [parcela];
    this.cancelForm.reset({ observacao: '' });
    this.cancelModalRef = this.modalService.open(this.modalCancelarParcelaRef, {
      centered: true,
      size: 'lg',
      scrollable: true,
      backdrop: 'static',
    });
  }

  abrirModalCancelarSelecionadas() {
    if (!this.selected.size || this.loadingCancel) return;
    this.cancelMode = 'bulk';
    this.parcelasParaCancelar = (this.dados?.parcelas ?? []).filter((p: any) => this.selected.has(p._id));
    this.cancelForm.reset({ observacao: '' });
    this.cancelModalRef = this.modalService.open(this.modalCancelarParcelaRef, {
      centered: true,
      size: 'lg',
      scrollable: true,
      backdrop: 'static',
    });
  }
  abrirTituloValeDasMinasPark() {
    if (!this.isValeDasMinasPark) return;
    let id = this.dados.identificador.split("VALE_DAS_MINAS_PARK_")[1];
    window.open(`${this.VALE_DAS_MINAS_PARK_TITULO_URL}?_id=${id}&tab=3`, '_blank', 'noopener,noreferrer');
  }

  async confirmarCancelamento() {
    if (!this.parcelasParaCancelar.length || this.loadingCancel) return;
    try {
      this.loadingCancel = true;
      const observacao = this.cancelForm.get('observacao')?.value?.trim() || undefined;
      if (this.cancelMode === 'single') {
        const parcela = this.parcelasParaCancelar[0];
        await this.endpointService.cancelarParcelaReceita(this.receitaId, parcela._id, observacao);
        this.alertService.showSuccess('Parcela cancelada com sucesso.');
      } else {
        const parcelaIds = this.parcelasParaCancelar.map((p: any) => p._id);
        await this.endpointService.cancelarParcelasReceita(this.receitaId, parcelaIds, observacao);
        this.alertService.showSuccess('Parcelas canceladas com sucesso.');
      }
      this.cancelModalRef?.close();
      this.cancelModalRef = null;
      await this.loadData(this.receitaId);
    } catch (error: any) {
      this.alertService.showDanger(error?.message || 'Erro ao cancelar parcelas.');
    } finally {
      this.loadingCancel = false;
    }
  }

  abrirModalEditar(parcela: any) {
    this.parcelaMode = 'editar';
    this.parcelaEditando = parcela;
    const toDateInput = (v: any) => v ? new Date(v).toISOString().substring(0, 10) : null;
    let fp = '';
    if (parcela?.forma_pagamento != 'A DEFINIR') {
      fp = parcela?.forma_pagamento || '';
    }
    const valorBruto = parcela.valor_parcela ?? null;
    const valorAjustado = parcela.tipo === 'DEVOLUCAO' && valorBruto !== null && valorBruto > 0
      ? -valorBruto
      : valorBruto;

    this.editForm.setValue({
      id_parcela: parcela.id_parcela || '',
      tipo: parcela.tipo || '',
      forma_pagamento: fp,
      status: parcela.status || '',
      parcela: parcela.parcela || null,
      total_parcelas: parcela.total_parcelas || null,
      label_parcelas: parcela.label_parcelas || '',
      valor_parcela: valorAjustado,
      data_vencimento: toDateInput(parcela.data_vencimento),
      data_recebimento: parcela.status === 'LIQUIDADO' ? toDateInput(parcela.data_recebimento) : null,
    });
    this.editModalRef = this.modalService.open(this.modalEditarParcelaRef, {
      centered: true,
      backdrop: 'static',
    });
  }

  abrirModalCriarParcela() {
    if (this.loadingEdit) return;
    this.parcelaMode = 'criar';
    this.parcelaEditando = null;
    this.editForm.reset({
      id_parcela: '',
      tipo: '',
      forma_pagamento: '',
      status: '',
      parcela: null,
      total_parcelas: null,
      label_parcelas: '',
      valor_parcela: null,
      data_vencimento: null,
      data_recebimento: null,
    });
    this.editModalRef = this.modalService.open(this.modalEditarParcelaRef, {
      centered: true,
      backdrop: 'static',
    });
  }

  abrirModalDuplicarParcela(parcela: any) {
    if (this.loadingEdit) return;
    this.parcelaMode = 'criar';
    this.parcelaEditando = null;
    const toDateInput = (v: any) => v ? new Date(v).toISOString().substring(0, 10) : null;
    let fp = '';
    if (parcela?.forma_pagamento != 'A DEFINIR') {
      fp = parcela?.forma_pagamento || '';
    }
    const valorBruto = parcela.valor_parcela ?? null;
    const valorAjustado = parcela.tipo === 'DEVOLUCAO' && valorBruto !== null && valorBruto > 0
      ? -valorBruto
      : valorBruto;

    this.editForm.setValue({
      id_parcela: parcela?.id_parcela ? parcela.id_parcela : "",
      tipo: parcela.tipo || '',
      forma_pagamento: fp,
      status: parcela.status || '',
      parcela: parcela.parcela || null,
      total_parcelas: parcela.total_parcelas || null,
      label_parcelas: parcela.label_parcelas || '',
      valor_parcela: valorAjustado,
      data_vencimento: toDateInput(parcela.data_vencimento),
      data_recebimento: parcela.status === 'LIQUIDADO' ? toDateInput(parcela.data_recebimento) : null,
    });
    this.editModalRef = this.modalService.open(this.modalEditarParcelaRef, {
      centered: true,
      backdrop: 'static',
    });
  }

  async salvarEdicao() {
    if (this.loadingEdit) return;
    try {
      this.loadingEdit = true;

      if (this.parcelaMode === 'editar' && !this.parcelaEditando) return;

      if (this.parcelaMode === 'editar') {
        // Edição de parcela existente
        await this.endpointService.editarParcelaReceita(
          this.receitaId,
          this.parcelaEditando._id,
          this.editForm.value
        );
        this.alertService.showSuccess('Parcela atualizada com sucesso.');
      } else {
        // Criação de nova parcela
        const novaParcelaData = this.editForm.value;
        await this.endpointService.criarParcelaReceita(this.receitaId, novaParcelaData);
        this.alertService.showSuccess('Parcela criada com sucesso.');
      }

      this.editModalRef?.close();
      this.editModalRef = null;
      await this.loadData(this.receitaId);
    } catch (error: any) {
      this.alertService.showDanger(error?.message || 'Erro ao salvar parcela.');
    } finally {
      this.loadingEdit = false;
    }
  }

  abrirModalExcluirParcela(parcela: any) {
    if (this.loadingDelete || !parcela) return;
    this.deleteMode = 'single';
    this.parcelasParaExcluir = [parcela];
    this.deleteModalRef = this.modalService.open(this.modalExcluirParcelaRef, {
      centered: true,
      size: 'lg',
      scrollable: true,
      backdrop: 'static',
    });
  }

  abrirModalExcluirSelecionadas() {
    if (!this.selected.size || this.loadingDelete) return;
    this.deleteMode = 'bulk';
    this.parcelasParaExcluir = (this.dados?.parcelas ?? []).filter((p: any) => this.selected.has(p._id));
    this.deleteModalRef = this.modalService.open(this.modalExcluirParcelaRef, {
      centered: true,
      size: 'lg',
      scrollable: true,
      backdrop: 'static',
    });
  }

  async confirmarExclusao() {
    if (!this.parcelasParaExcluir.length || this.loadingDelete) return;
    try {
      this.loadingDelete = true;
      if (this.deleteMode === 'single') {
        const parcela = this.parcelasParaExcluir[0];
        await this.endpointService.excluirParcelaReceita(this.receitaId, parcela._id);
        this.alertService.showSuccess('Parcela excluída com sucesso.');
      } else {
        const parcelaIds = this.parcelasParaExcluir.map((p: any) => p._id);
        await this.endpointService.excluirParcelasReceita(this.receitaId, parcelaIds);
        this.alertService.showSuccess('Parcelas excluídas com sucesso.');
      }
      this.deleteModalRef?.close();
      this.deleteModalRef = null;
      await this.loadData(this.receitaId);
    } catch (error: any) {
      this.alertService.showDanger(error?.message || 'Erro ao excluir parcelas.');
    } finally {
      this.loadingDelete = false;
    }
  }

  abrirVendaValeDasMinasPark() {
    if (!this.isValeDasMinasPark) return;

    const queryParams = new URLSearchParams({
      q: this.dados?.cliente?.cpf_cnpj || '',
      data_inicial: this.toDateParam(this.dados?.data),
      data_final: this.toDateParam(this.dados?.data),
      page: '1',
      perpage: '1000',
    });

    window.open(`${this.VALE_DAS_MINAS_PARK_URL}?${queryParams.toString()}`, '_blank', 'noopener,noreferrer');
  }

  private toDateParam(value: any): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).substring(0, 10);
    }

    return date.toISOString().substring(0, 10);
  }

}
