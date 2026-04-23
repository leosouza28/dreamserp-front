import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';

@Component({
  selector: 'app-preview-bordero',
  templateUrl: './preview-bordero.component.html',
  styleUrls: ['./preview-bordero.component.scss']
})
export class PreviewBorderoComponent {

  private activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private api = inject(ApiService);
  private router = inject(Router);

  loading: boolean = false;
  data: any;
  gruposLista: { tipo: string, itens: any[], total: number, expandido: boolean }[] = [];
  formaPagamento: string = "";
  formasPagamento: string[] = ['DINHEIRO', 'PIX'];
  dataPagamento: string = "";
  fechado: boolean = false;

  constructor() {
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) this.getPreviewBordero(params['id']);
    });
  }

  async getPreviewBordero(id: string) {
    try {
      this.loading = true;
      let response: any = await this.api.get(`/v1/admin/borderos/${id}/preview`);
      this.data = response;
      this.formaPagamento = response.forma_pagamento || "";
      this.dataPagamento = response.data_pagamento ? new Date(response.data_pagamento).toISOString().substring(0, 10) : "";
      this.fechado = response.fechado || false;
      this.processarLista(response.lista || []);
    } catch (error) {
    } finally {
      this.loading = false;
    }
  }

  processarLista(lista: any[]) {
    const ordem = ['ENTRADA', 'ENTRADA RESTANTE', 'SALDO', 'DEVOLUCAO'];
    const grupos: { [key: string]: any[] } = {};
    for (const item of lista) {
      const tipo = item.tipoParcela || 'OUTROS';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(item);
    }
    this.gruposLista = ordem
      .filter(tipo => grupos[tipo]?.length > 0 || tipo === 'SALDO')
      .map(tipo => ({
        tipo,
        itens: grupos[tipo] || [],
        total: (grupos[tipo] || []).reduce((acc: number, i: any) => acc + (i.valorParcela || 0), 0),
        expandido: false
      }));
    for (const tipo of Object.keys(grupos)) {
      if (!ordem.includes(tipo)) {
        this.gruposLista.push({
          tipo,
          itens: grupos[tipo],
          total: grupos[tipo].reduce((acc: number, i: any) => acc + (i.valorParcela || 0), 0),
          expandido: false
        });
      }
    }
  }

  get totalBordero(): number {
    const get = (tipo: string) => this.gruposLista.find(g => g.tipo === tipo)?.total ?? 0;
    return get('ENTRADA RESTANTE') + get('SALDO') + get('DEVOLUCAO');
  }

  fechando: boolean = false;

  async fecharBordero() {
    if (!confirm('Deseja realmente fechar este borderô? Esta ação não poderá ser desfeita.')) return;
    try {
      this.fechando = true;
      await this.api.put(`/v1/admin/borderos/${this.data._id}/fechar`, {
        forma_pagamento: this.formaPagamento,
        data_pagamento: this.dataPagamento
      });
      this.fechado = true;
    } catch (error) {
      alert('Erro ao fechar borderô.');
    } finally {
      this.fechando = false;
    }
  }

  abrirReceita(item: any) {
    window.open(window.location.origin + `/admin/comissoes/agencia/detalhes/${item._id}`, '_blank');
  }

}
