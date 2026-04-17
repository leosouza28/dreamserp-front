import { Component, inject, isDevMode, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
      parcelas: this.fb.control([])
    });

    this.searchForm = this.fb.group({
      tipo_data: ['emissao'],
      data_inicial: [null],
      data_final: [null],
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
    this.activatedRoute.params.subscribe(params => {
      console.log(params);
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
    this.localFiltersForm.get('scores.a')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.b')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.c')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.d')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('scores.e')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_ate')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('valedasminas_porcentagem_paga_mais')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('nome_cliente')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());
    this.localFiltersForm.get('identificador_receita')?.valueChanges.subscribe(() => this.aplicarFiltrosLocais());

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
      console.log(bordero)
      
      // Carrega as parcelas já vinculadas ao bordero
      if (bordero.parcelas && Array.isArray(bordero.parcelas)) {
        this.parcelasAdicionadas = bordero.parcelas;
      }
      
      this.form.patchValue({
        _id: bordero._id,
        data_inicial: bordero.data_inicial.split("T")[0],
        data_final: bordero.data_final.split("T")[0],
        identificador: bordero.identificador,
        pessoa: bordero.pessoa,
        forma_pagamento: bordero?.forma_pagamento || "",
        parcelas: this.parcelasAdicionadas
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
      // Copia as datas para o form de busca
      this.searchForm.patchValue({
        data_inicial: dataInicial,
        data_final: dataFinal,
        tipo_data: 'vencimento'
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
    } catch (error: any) {
      this.alert.showDanger(error);
    } finally {
      this.loading = false;
    }
  }

  async buscarParcelas() {
    try {
      if (!this.searchForm.get('data_inicial')?.value || !this.searchForm.get('data_final')?.value) {
        this.alert.showWarning("Preencha as datas para buscar");
        return;
      }

      this.loadingSearch = true;
      const { tipo_data, tipo_entrada, tipo_entrada_restante, tipo_saldo, tipo_devolucao, data_inicial, data_final, nome_cliente, numero_titulo } = this.searchForm.getRawValue();
      
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
      if (nome_cliente) params['nome_cliente'] = nome_cliente;
      if (numero_titulo) params['numero_titulo'] = numero_titulo;


      params['exclui_liquidados'] = 1; // Exclui parcelas já liquidadas, pois não podem ser adicionadas ao borderô
      const resultado = await this.api.getParcelasComissoes(params);
      
      // Filtra as parcelas para excluir as que ja foram adicionadas ao borderô
      const idsAdicionadas = this.parcelasAdicionadas.map(p => p._id || p.id);
      this.parcelasDisponiveis = (resultado.lista || []).filter((p: any) => !idsAdicionadas.includes(p._id || p.id));
      
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

    this.parcelasDisponiveisFilteradas = this.parcelasDisponiveis.filter(item => {
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
  }

  adicionarParcela(parcela: any) {
    // Verifica se já foi adicionada
    if (this.parcelasAdicionadas.some(p => p._id === parcela._id)) {
      this.alert.showWarning("Esta parcela já foi adicionada");
      return;
    }

    this.parcelasAdicionadas.push(parcela);
    this.parcelasDisponiveis = this.parcelasDisponiveis.filter(p => p._id !== parcela._id);
    this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);
  }

  removerParcela(parcelaId: string) {
    const parcela = this.parcelasAdicionadas.find(p => p._id === parcelaId);
    if (parcela) {
      this.parcelasAdicionadas = this.parcelasAdicionadas.filter(p => p._id !== parcelaId);
      this.parcelasDisponiveis.push(parcela);
      this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);
      
      // Emite evento para atualizar com debounce
      this.atualizarParcelas$.next();
    }
  }

  isParcelaAdicionada(parcelaId: string): boolean {
    return this.parcelasAdicionadas.some(p => p._id === parcelaId);
  }

  get totalCredito(): number {
    return (this.parcelasAdicionadas ?? []).reduce((acc, item) => {
      const valor = Number(item?.parcelas?.valor_parcela || 0);
      return valor > 0 ? acc + valor : acc;
    }, 0);
  }

  get totalDebito(): number {
    return (this.parcelasAdicionadas ?? []).reduce((acc, item) => {
      const valor = Number(item?.parcelas?.valor_parcela || 0);
      return valor < 0 ? acc + Math.abs(valor) : acc;
    }, 0);
  }

  get subtotal(): number {
    return (this.parcelasAdicionadas ?? []).reduce((acc, item) => acc + Number(item?.parcelas?.valor_parcela || 0), 0);
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

  temParcelasSelecionadas(): boolean {
    return this.parcelasSelecionadas.size > 0;
  }

  adicionarParcelasSelecionadas(): void {
    const parcelasToAdd: any[] = [];

    for (const parcelaId of this.parcelasSelecionadas) {
      const parcela = this.parcelasDisponiveis.find(p => (p._id || p.id) === parcelaId);
      if (parcela && !this.parcelasAdicionadas.some(p => (p._id || p.id) === parcelaId)) {
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
      this.parcelasDisponiveis = this.parcelasDisponiveis.filter(p => (p._id || p.id) !== (parcela._id || parcela.id));
    }

    // Atualiza o form
    this.form.get('parcelas')?.setValue(this.parcelasAdicionadas);
    
    // Limpa seleção
    this.parcelasSelecionadas.clear();
    
    this.alert.showSuccess(`${parcelasToAdd.length} parcela(s) adicionada(s)`);
  }

  desmarcarTodas(): void {
    this.parcelasSelecionadas.clear();
  }

  marcarTodas(): void {
    for (const parcela of this.parcelasDisponiveisFilteradas) {
      this.parcelasSelecionadas.add(parcela._id || parcela.id);
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
}
