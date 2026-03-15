import { Component, OnDestroy, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-clientes-faturas',
  templateUrl: './clientes-faturas.component.html',
  styleUrls: ['./clientes-faturas.component.scss']
})
export class ClientesFaturasComponent implements OnInit, OnDestroy {

  loading: boolean = false;
  dados: any = null;
  expandedGroups: Set<string> = new Set();
  id: string = '';
  apenasEmAberto: boolean = false;

  interval: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private endpointService: EndpointsService,
    private alertService: AlertService,
    private title: Title
  ) {
    this.activatedRoute.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.getItem(params['id']);
      }
    })
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async getItem(id: string, silent = false) {
    if (this.loading) return;
    if (!silent) this.loading = true;
    try {
      const response = await this.endpointService.getFaturasClienteById(id, this.apenasEmAberto);
      // Ver se a resposta é igual ao que já existe

      this.title.setTitle(`Faturas de ${response.pessoa.nome} | TrackBeef`);
      
      if (JSON.stringify(this.dados) === JSON.stringify(response)) {
        // Dados iguais, não faz nada
        this.endpointService.logDev("Dados iguais, não atualiza");
      } else {
        this.endpointService.logDev("Dados diferentes, atualiza");
        
        // Dados diferentes, atualiza
        this.dados = response;
      }

    } catch (error: any) {
      this.alertService.showDanger(error);
    } finally {
      if (!silent) this.loading = false;
      if (!this.interval) {
        console.log("creating loop...");
        // Create loop
        this.interval = setInterval(() => {
          this.getItem(id, true);
        }, 3000);
      }
    }
  }

  toggleGroup(dataKey: string) {
    if (this.expandedGroups.has(dataKey)) {
      this.expandedGroups.delete(dataKey);
    } else {
      this.expandedGroups.add(dataKey);
    }
  }

  isGroupExpanded(dataKey: string): boolean {
    return this.expandedGroups.has(dataKey);
  }

  agruparProdutos(produtos: any[]): any[] {
    return produtos.map((item: any) => {
      const pesos = item.pecas && item.pecas.length > 0
        ? item.pecas.map((peca: any) => `${peca.peso.toFixed(2).replace('.', ',')}`)
        : [];
        
      return {
        produto: item.produto,
        produto_sigla: item.produto_sigla,
        quantidade: item.quantidade,
        unidade_saida: item.unidade_saida,
        valor_total: item.valor_total,
        valor_unitario: item.valor_unitario,
        pesos: pesos
      };
    });
  }

  getStatusClass(venda: any): string {
    if (Math.abs(venda.valor_em_aberto) < 0.01) return 'success';
    if (venda.valor_em_atraso > 0) return 'danger';
    return 'warning';
  }

  getStatusLabel(venda: any): string {
    if (Math.abs(venda.valor_em_aberto) < 0.01) return 'Quitada';
    if (venda.valor_em_atraso > 0) return 'Em Atraso';
    return 'Pendente';
  }

}
