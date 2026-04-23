import { Component, inject, isDevMode, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-bordero-form',
  templateUrl: './bordero-form.component.html',
  styleUrls: ['./bordero-form.component.scss']
})
export class BorderoFormComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  searchForm!: FormGroup;
  localFiltersForm!: FormGroup;
  loading: boolean = false;
  loadingSearch: boolean = false;
  pessoas: any[] = [];
  parcelasDisponiveis: any[] = [];
  parcelasDisponiveisFilteradas: any[] = [];
  parcelasAdicionadas: any[] = [];
  parcelasSelecionadas: Set<string> = new Set();

  private fb: FormBuilder = inject(FormBuilder);
  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private api = inject(EndpointsService);
  private router = inject(Router);
  private alert = inject(AlertService);
  private destroy$ = new Subject<void>();
  private atualizarParcelas$ = new Subject<void>();

  formas_pagamento = ['PIX', 'DINHEIRO'];
  tipos_parcela = [
    { value: 'ENTRADA', label: 'Entrada' },
    { value: 'ENTRADA RESTANTE', label: 'Entrada Restante' },
    { value: 'SALDO', label: 'Saldo' },
    { value: 'DEVOLUCAO', label: 'Devolução' }
  ];

  private readonly ordemTiposParcela: string[] = ['ENTRADA', 'ENTRADA RESTANTE', 'SALDO', 'DEVOLUCAO'];

  constructor() {
    this.form = this.fb.group({
      _id: "",
      data_inicial: this.fb.control('', [Validators.required]),
      data_final: this.fb.control('', [Validators.required]),
      identificador: "",
      pessoa: this.fb.group({
        _id: this.fb.control(''),
        nome: this.fb.control(''),
        documento: this.fb.control(''),
        razao_social: this.fb.control(''),
      }),
      forma_pagamento: "",
      data_pagamento: "",
      parcelas: this.fb.control([]),
      fechado: this.fb.control(false)
    });

    this.searchForm = this.fb.group({
      data_emissao_inicial: [null],
      data_emissao_final: [null],
      data_vencimento_inicial: [null],
      data_vencimento_final: [null],
      tipo_entrada: [false],
      tipo_entrada_restante: [false],
      tipo_saldo: [false],
      tipo_devolucao: [false]
    });

    this.localFiltersForm = this.fb.group({
      status: this.fb.group({
        recebeu: [false],
        nao_recebeu: [false]
      }),
      status_parcela: this.fb.group({
        liquidado: [false],
        pendente: [false],
        cancelado: [false]
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
      busca_geral: ['']
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      if (!!params['id']) {
        this.getBorderoById(params['id']);
      } else {
        if (isDevMode()) {
          this.form.get('data_inicial')?.setValue('2025-10-01');
          this.form.get('data_final')?.setValue('2025-10-31');
          this.aplicarBuscaSeDatasDefinidas();
        }
      }
    })
    this.getPessoas();

    // Listener para aplicar busca quando as datas mudam no form principal
    this.form.get('data_inicial')?.valueChanges.subscribe(() => this.aplicarBuscaSeDatasDefinidas());
    this.form.get('data_final')?.valueChanges.subscribe(() => this.aplicarBuscaSeDatasDefinidas());

    // Listeners para filtros locais
    this.localFiltersForm.get('status.recebeu')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('status.nao_recebeu')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('status_parcela.liquidado')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('status_parcela.pendente')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('status_parcela.cancelado')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.a')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.b')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.c')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.d')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.e')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_ate')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_mais')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('busca_geral')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());

    // Listener com debounce para atualizar parcelas disponíveis
    this.atualizarParcelas$
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.buscarParcelas();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async getPessoas() {
    try {
      let pessoas = await this.api.getPessoas({ perpage: 1000, page: 1 });
      this.pessoas = pessoas.lista;
    } catch (error) {

    }
  }

  async getBorderoById(id: string) {
    this.loading = true;
    try {
      let bordero = await this.api.getBorderoById(id);

      // Carrega as parcelas já vinculadas ao bordero
      if (bordero.parcelas && Array.isArray(bordero.parcelas)) {
        this.parcelasAdicionadas = bordero.parcelas;
      }

      this.form.patchValue({
        _id: bordero._id,
        data_inicial: bordero.data_inicial.split("T")[0],
        data_final: bordero.data_final.split("T")[0],
        data_pagamento: bordero.data_pagamento ? bordero.data_pagamento.split("T")[0] : "",
        identificador: bordero.identificador,
        pessoa: bordero.pessoa,
        forma_pagamento: bordero?.forma_pagamento || "",
        parcelas: this.parcelasAdicionadas,
        fechado: bordero.fechado || false
      })
      // Aplica busca com as datas carregadas
      this.aplicarBuscaSeDatasDefinidas();
    } catch (error) {
      console.log(error);
    } finally {
      this.loading = false;
    }
  }

  aplicarBuscaSeDatasDefinidas() {
    const dataInicial = this.form.get('data_inicial')?.value;
    const dataFinal = this.form.get('data_final')?.value;

    if (dataInicial && dataFinal) {
      // Pré-preenche o range de vencimento com o período do borderô
      this.searchForm.patchValue({
        data_vencimento_inicial: dataInicial,
        data_vencimento_final: dataFinal,
      });
      // Executa a busca
      this.buscarParcelas();
    }
  }

  async submit() {
    try {
      if (!this.form.valid) {
        this.form.markAllAsTouched();
        this.alert.showWarning("Preencha os campos obrigatórios");
        return;
      }
      this.loading = true;
      let value = this.form.getRawValue();

      // Transforma as parcelas em um array de IDs
      const parcelasIds = (this.parcelasAdicionadas || []).map(parcela => ({
        receita_id: parcela._id,
        parcela_id: parcela.parcelas?._id || parcela._id
      }));

      // Substitui as parcelas pelo array de IDs
      value.parcelas = parcelasIds;

      await this.api.setBordero(value);
      this.alert.showSuccess("Borderô salvo com sucesso!");

      if (!value._id) {
        // atualiza a rota com esse novo _id
        this.router.navigate(['/admin/comissoes/bordero/form', value._id], { replaceUrl: true });
      }
    } catch (error: any) {
      this.alert.showDanger(error);
    } finally {
      this.loading = false;
    }
  }

  async buscarParcelas() {
    try {
      this.loadingSearch = true;
      const { data_emissao_inicial, data_emissao_final, data_vencimento_inicial, data_vencimento_final, tipo_entrada, tipo_entrada_restante, tipo_saldo, tipo_devolucao, nome_cliente, numero_titulo } = this.searchForm.getRawValue();

      const params: any = {};
      if (data_emissao_inicial) params['data_emissao_inicial'] = data_emissao_inicial;
      if (data_emissao_final) params['data_emissao_final'] = data_emissao_final;
      if (data_vencimento_inicial) params['data_vencimento_inicial'] = data_vencimento_inicial;
      if (data_vencimento_final) params['data_vencimento_final'] = data_vencimento_final;

      const tipos: string[] = [];
      if (tipo_entrada) tipos.push('ENTRADA');
      if (tipo_entrada_restante) tipos.push('ENTRADA RESTANTE');
      if (tipo_saldo) tipos.push('SALDO');
      if (tipo_devolucao) tipos.push('DEVOLUCAO');
      if (tipos.length > 0) params['tipo'] = tipos.join(',');

      if (nome_cliente) params['nome_cliente'] = nome_cliente;
      if (numero_titulo) params['numero_titulo'] = numero_titulo;


      params['exclui_liquidados'] = 1; // Exclui parcelas já liquidadas, pois não podem ser adicionadas ao borderô
      const resultado = await this.api.getParcelasComissoes(params);

      // Filtra as parcelas para excluir as que ja foram adicionadas ao borderô
      const idsAdicionadas = this.parcelasAdicionadas.map(p => p.parcelas?._id);
      this.parcelasDisponiveis = (resultado.lista || []).filter((p: any) => !idsAdicionadas.includes(p.parcelas?._id));


      // Aplica filtros locais após buscar
      this.aplicarFiltrosLocais();

    } catch (error: any) {
      console.error(error);
      this.alert.showDanger(error?.message || "Erro ao buscar parcelas");
    } finally {
      this.loadingSearch = false;
    }
  }

  aplicarFiltrosLocais(): void {
    if (this.parcelasDisponiveis.length === 0) {
      this.parcelasDisponiveisFilteradas = [];
      return;
    }

    const formValue = this.localFiltersForm.getRawValue();
    const { status, status_parcela, scores, valedasminas_porcentagem_paga_ate, valedasminas_porcentagem_paga_mais, busca_geral } = formValue;

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

    this.parcelasDisponiveisFilteradas = this.parcelasDisponiveis.filter(item => {
      // Filtro 1: status (Recebeu / Não Recebeu)
      if (status.recebeu || status.nao_recebeu) {
        const itemRecebeu = item.parcelas?.valedasminas_recebeu_mes_referencia;
        const statusMatch = (status.recebeu && itemRecebeu) || (status.nao_recebeu && !itemRecebeu);
        if (!statusMatch) {
          return false;
        }
      }

      // Filtro 2: status da parcela (LIQUIDADO, PENDENTE, CANCELADO)
      const statusParcelaSelecionados: string[] = [];
      if (status_parcela.liquidado) statusParcelaSelecionados.push('LIQUIDADO');
      if (status_parcela.pendente) statusParcelaSelecionados.push('PENDENTE');
      if (status_parcela.cancelado) statusParcelaSelecionados.push('CANCELADO');

      if (statusParcelaSelecionados.length > 0) {
        const itemStatus = (item.parcelas?.status || '').toUpperCase();
        if (!statusParcelaSelecionados.includes(itemStatus)) {
          return false;
        }
      }

      // Filtro 3: cliente.score (múltiplos scores podem ser selecionados)
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

      // Filtro 5: busca geral (nome do cliente ou número do título)
      if (busca_geral) {
        const buscaNormalizada = (busca_geral || '').toLowerCase();
        const nomeCliente = (item.cliente?.nome || '').toLowerCase();
        const numeroTitulo = (item.identificador || '').toLowerCase();
        const match = nomeCliente.includes(buscaNormalizada) || numeroTitulo.includes(buscaNormalizada);
        if (!match) {
          return false;
        }
      }

      return true;
    });

    // order by cliente.nome
    this.parcelasDisponiveisFilteradas.sort((a, b) => {
      const nomeA = a.cliente?.nome || '';
      const nomeB = b.cliente?.nome || '';
      return nomeA.localeCompare(nomeB);
    });
  }

  adicionarParcela(parcela: any) {
    // Verifica se já foi adicionada
    if (this.parcelasAdicionadas.some(p => (p.parcelas._id || p.parcelas.id) === (parcela.parcelas._id || parcela.parcelas.id))) {
      this.alert.showWarning("Esta parcela já foi adicionada");
      return;
    }
    if ((parcela.parcelas?.status || '').toUpperCase() === 'CANCELADO') {
      this.alert.showWarning("Parcelas canceladas não podem ser adicionadas ao borderô");
      return;
    }

    this.parcelasAdicionadas.push(parcela);
    this.parcelasDisponiveis = this.parcelasDisponiveis.filter(p => (p.parcelas._id || p.parcelas.id) !== (parcela.parcelas._id || parcela.parcelas.id));
    this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);
    this.salvarEAtualizar();
  }

  removerParcela(parcelaId: string) {
    const parcelaIndex = this.parcelasAdicionadas.findIndex(p => (p.parcelas._id || p.parcelas.id) === parcelaId);
    if (parcelaIndex !== -1) {
      const parcela = this.parcelasAdicionadas[parcelaIndex];
      this.parcelasAdicionadas.splice(parcelaIndex, 1);
      this.parcelasDisponiveis.push(parcela);
      this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);

      // Emite evento para atualizar com debounce
      this.atualizarParcelas$.next();
    }
  }

  isParcelaAdicionada(parcelaId: string): boolean {
    return this.parcelasAdicionadas.some(p => (p.parcelas._id || p.parcelas.id) === parcelaId);
  }

  get totalCredito(): number {
    return (this.parcelasAdicionadas ?? []).reduce((acc, item) => {
      if ((item?.parcelas?.tipo || '').toUpperCase() === 'ENTRADA') return acc;
      const valor = Number(item?.parcelas?.valor_parcela || 0);
      return valor > 0 ? acc + valor : acc;
    }, 0);
  }

  get totalDebito(): number {
    return (this.parcelasAdicionadas ?? []).reduce((acc, item) => {
      if ((item?.parcelas?.tipo || '').toUpperCase() === 'ENTRADA') return acc;
      const valor = Number(item?.parcelas?.valor_parcela || 0);
      return valor < 0 ? acc + Math.abs(valor) : acc;
    }, 0);
  }

  entradaAccordionAberto = false;

  get gruposParcelasAdicionadasPrincipais(): { tipo: string; itens: any[]; subtotal: number }[] {
    return this.gruposParcelasAdicionadasPorTipo.filter(g => g.tipo !== 'ENTRADA');
  }

  get grupoParcelasEntrada(): { tipo: string; itens: any[]; subtotal: number } | null {
    return this.gruposParcelasAdicionadasPorTipo.find(g => g.tipo === 'ENTRADA') ?? null;
  }

  get gruposParcelasAdicionadasPorTipo(): { tipo: string; itens: any[]; subtotal: number }[] {
    const grupos: Record<string, any[]> = {};

    for (const item of this.parcelasAdicionadas ?? []) {
      const tipo = (item?.parcelas?.tipo || 'OUTROS').toUpperCase();
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(item);
    }

    const tiposOrdenados = Object.keys(grupos).sort((a, b) => {
      const idxA = this.ordemTiposParcela.indexOf(a);
      const idxB = this.ordemTiposParcela.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return tiposOrdenados.map(tipo => ({
      tipo,
      itens: grupos[tipo],
      subtotal: grupos[tipo].reduce((acc, item) => acc + Number(item?.parcelas?.valor_parcela || 0), 0)
    }));
  }

  get subtotal(): number {
    return this.totalCredito - this.totalDebito;
  }

  get isBorderoFechado(): boolean {
    return this.form.get('fechado')?.value === true;
  }

  toggleSelecionarParcela(parcelaId: string): void {
    if (this.parcelasSelecionadas.has(parcelaId)) {
      this.parcelasSelecionadas.delete(parcelaId);
    } else {
      this.parcelasSelecionadas.add(parcelaId);
    }
  }

  isParcelasSelecionada(parcelaId: string): boolean {
    return this.parcelasSelecionadas.has(parcelaId);
  }

  private getParcelaId(item: any): string {
    let retorno = item?.parcelas?._id || "";
    return retorno;
  }

  get totalMarcadoFiltrado(): number {
    return (this.parcelasDisponiveisFilteradas ?? []).reduce((acc, item) => {
      const parcelaId = this.getParcelaId(item);
      if (!parcelaId || !this.parcelasSelecionadas.has(parcelaId)) {
        return acc;
      }
      return acc + Number(item?.parcelas?.valor_parcela || 0);
    }, 0);
  }

  get quantidadeMarcadaFiltrada(): number {
    return (this.parcelasDisponiveisFilteradas ?? []).reduce((acc, item) => {
      const parcelaId = this.getParcelaId(item);
      return parcelaId && this.parcelasSelecionadas.has(parcelaId) ? acc + 1 : acc;
    }, 0);
  }

  get gruposParcelasFiltradasPorTipo(): { tipo: string; itens: any[]; subtotal: number }[] {
    const grupos: Record<string, any[]> = {};

    for (const item of this.parcelasDisponiveisFilteradas ?? []) {
      const tipo = (item?.parcelas?.tipo || 'OUTROS').toUpperCase();
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(item);
    }

    const tiposOrdenados = Object.keys(grupos).sort((a, b) => {
      const idxA = this.ordemTiposParcela.indexOf(a);
      const idxB = this.ordemTiposParcela.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return tiposOrdenados.map(tipo => ({
      tipo,
      itens: grupos[tipo],
      subtotal: grupos[tipo].reduce((acc, item) => acc + Number(item?.parcelas?.valor_parcela || 0), 0)
    }));
  }

  temParcelasSelecionadas(): boolean {
    return this.parcelasSelecionadas.size > 0;
  }

  adicionarParcelasSelecionadas(): void {
    const parcelasToAdd: any[] = [];

    for (const parcelaId of this.parcelasSelecionadas) {
      const parcela = this.parcelasDisponiveis.find(p => (p.parcelas._id || p.parcelas.id) === parcelaId);
      if (parcela && !this.parcelasAdicionadas.some(p => (p.parcelas._id || p.parcelas.id) === parcelaId)) {
        if ((parcela.parcelas?.status || '').toUpperCase() === 'CANCELADO') continue;
        parcelasToAdd.push(parcela);
      }
    }

    if (parcelasToAdd.length === 0) {
      this.alert.showWarning("Nenhuma parcela válida selecionada");
      return;
    }

    // Adiciona todas as parcelas
    this.parcelasAdicionadas.push(...parcelasToAdd);

    // Remove das disponíveis
    for (const parcela of parcelasToAdd) {
      this.parcelasDisponiveis = this.parcelasDisponiveis.filter(p => (p.parcelas._id || p.parcelas.id) !== (parcela.parcelas._id || parcela.parcelas.id));
    }

    // Atualiza o form
    this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);

    // Limpa seleção
    this.parcelasSelecionadas.clear();

    this.salvarEAtualizar();
  }

  desmarcarTodas(): void {
    this.parcelasSelecionadas.clear();
  }

  private async salvarEAtualizar(): Promise<void> {
    try {
      this.loading = true;
      const value = this.form.getRawValue();
      value.parcelas = (this.parcelasAdicionadas || []).map(parcela => ({
        receita_id: parcela._id,
        parcela_id: parcela.parcelas?._id || parcela._id
      }));
      await this.api.setBordero(value);
      this.alert.showSuccess('Borderô salvo com sucesso!');
      this.buscarParcelas();
    } catch (error: any) {
      this.alert.showDanger(error);
    } finally {
      this.loading = false;
    }
  }

  marcarTodas(): void {
    for (const parcela of this.parcelasDisponiveisFilteradas) {
      this.parcelasSelecionadas.add(this.getParcelaId(parcela));
    }
  }

  get scoresDisponiveis(): string[] {
    const scores = new Set<string>();
    for (const parcela of this.parcelasDisponiveis) {
      if (parcela.cliente?.score) {
        scores.add(parcela.cliente.score);
      }
    }
    return Array.from(scores).sort();
  }

  exportarCSV(): void {
    if (this.parcelasDisponiveisFilteradas.length === 0) {
      this.alert.showWarning('Nenhuma parcela disponível para exportar');
      return;
    }

    const headers = [
      'Cliente',
      'Documento',
      'Nº Título',
      'Tipo',
      'Valor',
      'Status',
      'Data Emissão',
      'Data Vencimento',
      'Data Recebimento',
      'Score',
      '% Paga'
    ];

    const dados = this.parcelasDisponiveisFilteradas.map(item => [
      item.cliente?.nome || '',
      item.cliente?.documento || '',
      item.numero_titulo || '',
      item.parcelas?.tipo || '',
      item.parcelas?.valor_parcela || '',
      item.parcelas?.status || '',
      item.data ? new Date(item.data).toLocaleDateString('pt-BR') : '',
      item.parcelas?.data_vencimento ? new Date(item.parcelas.data_vencimento).toLocaleDateString('pt-BR') : '',
      item.parcelas?.data_recebimento ? new Date(item.parcelas.data_recebimento).toLocaleDateString('pt-BR') : '',
      item.cliente?.score || '',
      (item.valedasminas_porcentagem_paga || 0).toFixed(2) + '%'
    ]);

    this.gerarCSV(headers, dados, 'parcelas-comissoes.csv');
    this.alert.showSuccess(`${this.parcelasDisponiveisFilteradas.length} parcela(s) exportada(s)`);
  }

  private gerarCSV(headers: string[], dados: any[][], nomeArquivo: string): void {
    const csv = [
      headers.map(h => this.escaparCSV(h)).join(','),
      ...dados.map(linha => linha.map(valor => this.escaparCSV(String(valor))).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escaparCSV(valor: string): string {
    if (valor.includes(',') || valor.includes('"') || valor.includes('\n')) {
      return `"${valor.replace(/"/g, '""')}"`;
    }
    return valor;
  }

  openInPreview(): void {
    const borderoId = this.form.get('_id')?.value;
    if (!borderoId) {
      this.alert.showWarning("Salve o borderô antes de visualizar");
      return;
    }
    let endpoint = '/admin/comissoes/preview-bordero/' + borderoId;
    const url = `${window.location.origin}${endpoint}`;
    window.open(url, '_blank');
  }

  async reabrirBordero() {
    let borderoId = this.form.get('_id')?.value;
    if (!borderoId) {
      this.alert.showWarning("Borderô não encontrado");
      return;
    }

    if (!confirm("Tem certeza que deseja reabrir este borderô?")) {
      return;
    }
    this.loading = true;
    try {
      await this.api.put(`/v1/admin/borderos/${borderoId}/reabrir`, {});
      this.alert.showSuccess("Borderô reaberto com sucesso!");
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
      this.getBorderoById(borderoId);
    }
  }

  async deleteBordero() {
    const borderoId = this.form.get('_id')?.value;
    if (!borderoId) {
      this.alert.showWarning("Borderô não encontrado");
      return;
    }

    if (!confirm("Tem certeza que deseja apagar este borderô? Todas as cobranças serão desvinculadas.")) {
      return;
    }

    this.loading = true;
    try {
      await this.api.deleteBordero(borderoId);
      this.alert.showSuccess("Borderô apagado com sucesso!");
      window.history.back();
    } catch (error: any) {
      this.alert.showDanger(error?.message || "Erro ao apagar o borderô");
    } finally {
      this.loading = false;
    }
  }

}
