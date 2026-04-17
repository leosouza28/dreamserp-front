import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

type ResumoTipoCard = {
  tipo: string;
  label: string;
  quantidade: number;
  total: number;
  liquidado: number;
  pendente: number;
  cancelado: number;
};

@Component({
  selector: 'app-comissoes-agencia',
  templateUrl: './comissoes-agencia.component.html',
  styleUrls: ['./comissoes-agencia.component.scss']
})
export class ComissoesAgenciaComponent implements OnInit {
  private readonly TIPOS_CARD = [
    { tipo: 'ENTRADA', label: 'Entrada' },
    { tipo: 'ENTRADA RESTANTE', label: 'Entrada Restante' },
    { tipo: 'SALDO', label: 'Saldo' },
    { tipo: 'DEVOLUCAO', label: 'Devolucao' },
  ];

  data: any = {
    lista: [],
    total: 0,
    resumo: []
  }
  dataFilterada: any = {
    lista: [],
    total: 0,
  }
  resumoTiposData: ResumoTipoCard[] = [];
  loading: boolean = false;
  loadingAddComissao: boolean = false;
  form: FormGroup;
  localFiltersForm: FormGroup;
  addComissaoForm: FormGroup;
  ultimaReceitaProcessada: any = null;

  @ViewChild('modalAdicionarComissao') modalAdicionarComissaoRef!: TemplateRef<any>;
  @ViewChild('modalPosProcessamentoComissao') modalPosProcessamentoComissaoRef!: TemplateRef<any>;
  private addComissaoModalRef: NgbModalRef | null = null;
  private posProcessamentoModalRef: NgbModalRef | null = null;

  get totalValor(): number {
    return (this.dataFilterada.lista ?? []).reduce((acc: number, item: any) => acc + (item.parcelas?.valor_parcela || 0), 0);
  }


  get resumoTipos(): ResumoTipoCard[] {
    // Se há filtros locais aplicados, recalcula o resumo da lista filtrada
    const localFiltersValue = this.localFiltersForm.getRawValue();
    const temFiltros = 
      localFiltersValue.status?.recebeu || 
      localFiltersValue.status?.nao_recebeu ||
      Object.values(localFiltersValue.scores || {}).some((v: any) => v) ||
      localFiltersValue.valedasminas_porcentagem_paga_ate ||
      localFiltersValue.valedasminas_porcentagem_paga_mais;

    // Se tem filtros, recalcula baseado na lista filtrada
    if (temFiltros) {
      return this.calcularResumoFiltrado();
    }

    // Caso contrário, retorna o resumo do backend (ou cards vazios se não houver dados)
    return this.garantirTodosOsTipos(this.resumoTiposData);
  }

  private garantirTodosOsTipos(resumo: ResumoTipoCard[]): ResumoTipoCard[] {
    const tiposMap: Record<string, ResumoTipoCard> = {};

    // Inicia com todos os tipos em 0
    this.TIPOS_CARD.forEach(tipo => {
      tiposMap[tipo.tipo] = {
        tipo: tipo.tipo,
        label: tipo.label,
        quantidade: 0,
        total: 0,
        liquidado: 0,
        pendente: 0,
        cancelado: 0
      };
    });

    // Sobrescreve com dados do resumo se existirem
    resumo.forEach(item => {
      if (tiposMap[item.tipo]) {
        tiposMap[item.tipo] = item;
      }
    });

    // Retorna na ordem correta
    return this.TIPOS_CARD.map(tipo => tiposMap[tipo.tipo]);
  }

  private calcularResumoFiltrado(): ResumoTipoCard[] {
    const mapa: Record<string, ResumoTipoCard> = {};

    // Inicia com todos os tipos em 0
    this.TIPOS_CARD.forEach(tipo => {
      mapa[tipo.tipo] = {
        tipo: tipo.tipo,
        label: tipo.label,
        quantidade: 0,
        total: 0,
        liquidado: 0,
        pendente: 0,
        cancelado: 0
      };
    });

    for (const item of this.dataFilterada.lista ?? []) {
      const tipo = item?.parcelas?.tipo || 'SEM TIPO';
      const valor = Number(item?.parcelas?.valor_parcela || 0);
      const status = this.normalizeStatus(item?.parcelas?.status);

      if (!mapa[tipo]) {
        mapa[tipo] = {
          tipo,
          label: this.formatTipoLabel(tipo),
          quantidade: 0,
          total: 0,
          liquidado: 0,
          pendente: 0,
          cancelado: 0,
        };
      }

      mapa[tipo].quantidade += 1;
      mapa[tipo].total += valor;

      if (status === 'LIQUIDADO') {
        mapa[tipo].liquidado += valor;
        continue;
      }

      if (status === 'CANCELADO') {
        mapa[tipo].cancelado += valor;
        continue;
      }

      mapa[tipo].pendente += valor;
    }

    // Retorna na ordem correta
    return this.TIPOS_CARD.map(tipo => mapa[tipo.tipo]);
  }

  private endpointService = inject(EndpointsService);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalService = inject(NgbModal);

  constructor() {
    this.form = this.fb.group({
      tipo_data: ['vencimento'],
      tipo_entrada: [false],
      tipo_entrada_restante: [false],
      tipo_saldo: [false],
      tipo_devolucao: [false],
      data_inicial: [null],
      data_final: [null]
    });

    this.addComissaoForm = this.fb.group({
      origem: ['valedasminaspark'],
      titulo_serie_hash: [''],
    });

    this.localFiltersForm = this.fb.group({
      status: this.fb.group({
        recebeu: [false],
        nao_recebeu: [false]
      }),
      scores: this.fb.group({
        a: [false],
        b: [false],
        c: [false],
        d: [false],
        e: [false]
      }),
      valedasminas_porcentagem_paga_ate: [''],
      valedasminas_porcentagem_paga_mais: [''],
      nome_cliente: [''],
      identificador_receita: ['']
    });
  }

  ngOnInit(): void {
    // Restaura os filtros da URL ao entrar na tela
    this.route.queryParams.subscribe(qp => {
      const tipos = (qp['tipo'] || '').split(',').filter(Boolean);
      this.form.patchValue({
        tipo_data: qp['tipo_data'] || 'vencimento',
        tipo_entrada: tipos.includes('ENTRADA'),
        tipo_entrada_restante: tipos.includes('ENTRADA RESTANTE'),
        tipo_saldo: tipos.includes('SALDO'),
        tipo_devolucao: tipos.includes('DEVOLUCAO'),
        data_inicial: qp['data_inicial'] || '2025-10-01',
        data_final: qp['data_final'] || '2025-10-31'
      });
      this.getData();
    });

    // Listeners para filtros locais
    this.localFiltersForm.get('status.recebeu')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('status.nao_recebeu')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.a')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.b')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.c')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.d')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.e')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_ate')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_mais')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('nome_cliente')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('identificador_receita')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
  }

  async getData() {
    if (this.loading) return;
    try {
      this.loading = true;
      console.log(this.form.value);
      const { tipo_data, tipo_entrada, tipo_entrada_restante, tipo_saldo, tipo_devolucao, data_inicial, data_final } = this.form.value;
      const params: any = {};
      if (tipo_data) params['tipo_data'] = tipo_data;
      const tipos: string[] = [];
      if (tipo_entrada) tipos.push('ENTRADA');
      if (tipo_entrada_restante) tipos.push('ENTRADA RESTANTE');
      if (tipo_saldo) tipos.push('SALDO');
      if (tipo_devolucao) tipos.push('DEVOLUCAO');
      if (tipos.length > 0) params['tipo'] = tipos.join(',');
      if (data_inicial) params['data_inicial'] = data_inicial;
      if (data_final) params['data_final'] = data_final;

      // Persiste os filtros na URL
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        replaceUrl: true,
      });

      let data = await this.endpointService.getParcelasComissoes(params);
      this.endpointService.logDev(data);
      this.data = data;
      // Armazena o resumo do backend
      this.resumoTiposData = data.resumo || [];
      // Aplica filtros locais após buscar
      this.aplicarFiltrosLocais();
    } catch (error) {
      this.endpointService.logDev(error);
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltrosLocais(): void {
    if (!this.data.lista || this.data.lista.length === 0) {
      this.dataFilterada = { lista: [], total: 0 };
      return;
    }

    const formValue = this.localFiltersForm.getRawValue();
    const { status, scores, valedasminas_porcentagem_paga_ate, valedasminas_porcentagem_paga_mais, nome_cliente, identificador_receita } = formValue;

    // Map de scores selecionados
    const scoresMap: { [key: string]: string } = {
      a: 'A',
      b: 'B',
      c: 'C',
      d: 'D',
      e: 'E'
    };

    const scoresSelecionados = Object.keys(scores)
      .filter(key => scores[key])
      .map(key => scoresMap[key]);

    const listaFilterada = this.data.lista.filter((item: any) => {
      // Filtro 1: status (Recebeu / Não Recebeu)
      if (status.recebeu || status.nao_recebeu) {
        const itemRecebeu = item.parcelas?.valedasminas_recebeu_mes_referencia;
        const statusMatch = (status.recebeu && itemRecebeu) || (status.nao_recebeu && !itemRecebeu);
        if (!statusMatch) {
          return false;
        }
      }

      // Filtro 2: cliente.score (múltiplos scores podem ser selecionados)
      if (scoresSelecionados.length > 0) {
        if (!scoresSelecionados.includes(item.cliente?.score)) {
          return false;
        }
      }

      // Filtro 3: valedasminas_porcentagem_paga - até X%
      if (valedasminas_porcentagem_paga_ate) {
        const percentualAte = Number(valedasminas_porcentagem_paga_ate);
        if (!item.valedasminas_porcentagem_paga || item.valedasminas_porcentagem_paga > percentualAte) {
          return false;
        }
      }

      // Filtro 4: valedasminas_porcentagem_paga - mais que X%
      if (valedasminas_porcentagem_paga_mais) {
        const percentualMais = Number(valedasminas_porcentagem_paga_mais);
        if (!item.valedasminas_porcentagem_paga || item.valedasminas_porcentagem_paga <= percentualMais) {
          return false;
        }
      }

      // Filtro 5: nome do cliente
      if (nome_cliente) {
        const nomeClienteNormalizado = (nome_cliente || '').toLowerCase();
        const itemNome = (item.cliente?.nome || '').toLowerCase();
        if (!itemNome.includes(nomeClienteNormalizado)) {
          return false;
        }
      }

      // Filtro 6: identificador da receita (numero do titulo)
      if (identificador_receita) {
        const identificadorNormalizado = (identificador_receita || '').toLowerCase();
        const itemIdentificador = (item.numero_titulo || '').toLowerCase();
        if (!itemIdentificador.includes(identificadorNormalizado)) {
          return false;
        }
      }

      return true;
    });

    this.dataFilterada = {
      lista: listaFilterada,
      total: listaFilterada.length
    };
  }

  get scoresDisponiveis(): string[] {
    const scores = new Set<string>();
    for (const item of this.data.lista ?? []) {
      if (item.cliente?.score) {
        scores.add(item.cliente.score);
      }
    }
    return Array.from(scores).sort();
  }

  get scoresAltos(): string[] {
    return ['A', 'B', 'C'].filter(score => this.scoresDisponiveis.includes(score));
  }

  get scoresBaixos(): string[] {
    return ['D', 'E'].filter(score => this.scoresDisponiveis.includes(score));
  }

  abrirModalAdicionarComissao() {
    this.addComissaoForm.reset({
      origem: 'valedasminaspark',
      titulo_serie_hash: '',
    });

    this.addComissaoModalRef = this.modalService.open(this.modalAdicionarComissaoRef, {
      centered: true,
      backdrop: 'static',
    });
  }

  async processarAdicionarComissao() {
    if (this.loadingAddComissao) return;

    const origem = this.addComissaoForm.get('origem')?.value;
    const tituloSerieHash = (this.addComissaoForm.get('titulo_serie_hash')?.value || '').trim();

    if (!origem) {
      this.alertService.showDanger('Selecione uma opção de origem.');
      return;
    }

    if (!tituloSerieHash) {
      this.alertService.showDanger('Informe o titulo_serie_hash.');
      return;
    }

    try {
      this.loadingAddComissao = true;

      if (origem === 'valedasminaspark') {
        const data = await this.endpointService.syncOneValedasminaspark(tituloSerieHash);
        this.endpointService.logDev(data);
        this.ultimaReceitaProcessada = data;
      }

      this.addComissaoModalRef?.close();
      this.addComissaoModalRef = null;
      this.posProcessamentoModalRef = this.modalService.open(this.modalPosProcessamentoComissaoRef, {
        centered: true,
        backdrop: 'static',
      });
    } catch (error: any) {
      this.alertService.showDanger(error?.message || 'Erro ao processar comissão.');
    } finally {
      this.loadingAddComissao = false;
    }
  }

  async atualizarPaginaAtualComissoes() {
    this.posProcessamentoModalRef?.close();
    this.posProcessamentoModalRef = null;
    await this.getData();
    this.alertService.showSuccess('Listagem de comissões atualizada.');
  }

  visualizarReceitaProcessada() {
    const receitaId = this.ultimaReceitaProcessada?._id;
    if (!receitaId) {
      this.alertService.showDanger('Não foi possível localizar o ID da receita processada.');
      return;
    }

    this.posProcessamentoModalRef?.close();
    this.posProcessamentoModalRef = null;
    this.router.navigate(['/admin/comissoes/agencia/detalhes', receitaId]);
  }

  private normalizeStatus(status: string | null | undefined): 'LIQUIDADO' | 'PENDENTE' | 'CANCELADO' {
    if (status === 'LIQUIDADO' || status === 'RECEBIDO') return 'LIQUIDADO';
    if (status === 'CANCELADO' || status === 'CANCELADA') return 'CANCELADO';
    return 'PENDENTE';
  }

  private formatTipoLabel(tipo: string): string {
    return tipo
      .toLowerCase()
      .split(' ')
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

}
