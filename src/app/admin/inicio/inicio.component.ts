import { EndpointsService } from 'src/app/services/endpoints.service';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { SessaoService } from 'src/app/services/sessao.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import dayjs from 'dayjs';
import { Subject, Subscription } from 'rxjs';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit {
  empty: boolean = false;
  loading: boolean = false;
  dashboard: any = null;
  quick_menu: any[] = [];

  dashboardAdministrativo: any;

  form!: FormGroup;

  // Chart config - Faturamento Diário
  public lineChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  public lineChartType: ChartType = 'bar';

  // Chart config - Rentabilidade por Produto
  public barChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  public barChartType: ChartType = 'bar';

  // Chart config - Formas de Pagamento
  public pieChartData: ChartConfiguration['data'] = {
    datasets: [],
    labels: []
  };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      }
    }
  };
  public pieChartType: ChartType = 'doughnut';

  sessaoSubjectSubscription!: Subscription;

  constructor(public sessao: SessaoService, private endpointService: EndpointsService, private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      data_inicial: this.fb.control(dayjs().startOf('month').format('YYYY-MM-DD')),
      data_final: this.fb.control(dayjs().endOf('month').format('YYYY-MM-DD')),
    })

    this.sessaoSubjectSubscription = this.sessao.userSubject.subscribe(user => {
      if (user) {
        this.loadQuickMenu();
      }
    })
  }

  ngOnInit(): void {
    this.getDashboardAdmin();
  }


  ngOnDestroy(): void {
    this.quick_menu = [];
    this.sessaoSubjectSubscription.unsubscribe();
  }


  loadQuickMenu() {
    this.quick_menu = [
      {
        label: 'Entrada de Estoque',
        description: 'Registrar a entrada de estoque',
        icon: 'bi bi-clipboard-plus',
        link: '/admin/notas-entradas/form'
      },
      {
        label: 'Nova Venda',
        description: 'Registrar uma nova venda',
        icon: 'bi bi-cash-coin',
        link: '/admin/vendas/pdv'
      },
      {
        label: 'Recebimentos',
        description: 'Gerenciar recebimentos',
        icon: 'bi bi-receipt',
        link: '/admin/financeiro/recebimentos'
      }
    ]
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }

  async getDashboardAdmin() {
    this.loading = true;
    try {
      let data: any = await this.endpointService.getDashboardAdministrativo(this.form.get('data_inicial')?.value, this.form.get('data_final')?.value);
      this.dashboardAdministrativo = data;
      this.endpointService.logDev('Dashboard Administrativo:', this.dashboardAdministrativo);
      this.prepareChartFaturamento();
    } catch (error) {
      console.log(error);
    }
    this.loading = false;
  }

  prepareChartFaturamento() {
    if (!this.dashboardAdministrativo?.dados?.faturamentoDiarioRecebimento) return;

    const labels = this.dashboardAdministrativo.dados.faturamentoDiarioRecebimento.map((item: any) =>
      dayjs(item.data).format('DD/MM')
    );
    const faturado = this.dashboardAdministrativo.dados.faturamentoDiarioRecebimento.map((item: any) => item.totalFaturadoDia);
    const recebido = this.dashboardAdministrativo.dados.faturamentoDiarioRecebimento.map((item: any) => item.totalRecebidoDia);
    const pendente = this.dashboardAdministrativo.dados.faturamentoDiarioRecebimento.map((item: any) => item.totalPendente);

    this.lineChartData = {
      labels: labels,
      datasets: [
        {
          data: faturado,
          label: 'Faturado',
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderWidth: 1
        },
        {
          data: recebido,
          label: 'Recebido',
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, 0.7)',
          borderWidth: 1
        },
        {
          data: pendente,
          label: 'Pendente',
          borderColor: '#ffc107',
          backgroundColor: 'rgba(255, 193, 7, 0.7)',
          borderWidth: 1
        }
      ]
    };

    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += this.formatarValor(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          ticks: {
            callback: (value) => {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          }
        }
      }
    };
  }

  getPercentualRecebido(): number {
    if (!this.dashboardAdministrativo?.dados) return 0;
    const total = this.dashboardAdministrativo.dados.totalFaturado;
    const recebido = this.dashboardAdministrativo.dados.totalRecebido;
    if (total === 0) return 0;
    return (recebido / total) * 100;
  }

  getPercentualPendente(): number {
    return 100 - this.getPercentualRecebido();
  }

  formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  formatarDocumento(documento: string): string {
    if (documento.length === 11) {
      return documento.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (documento.length === 14) {
      return documento.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return documento;
  }

  getTipoDocumento(documento: string): string {
    return documento.length === 11 ? 'CPF' : 'CNPJ';
  }

  query() {
    this.getDashboardAdmin();
  }

  setPeriodo(periodo: string) {
    const hoje = dayjs();
    let dataInicial: string;
    let dataFinal: string;

    switch (periodo) {
      case '7dias':
        dataInicial = hoje.subtract(7, 'days').format('YYYY-MM-DD');
        dataFinal = hoje.format('YYYY-MM-DD');
        break;
      case '15dias':
        dataInicial = hoje.subtract(15, 'days').format('YYYY-MM-DD');
        dataFinal = hoje.format('YYYY-MM-DD');
        break;
      case '30dias':
        dataInicial = hoje.subtract(30, 'days').format('YYYY-MM-DD');
        dataFinal = hoje.format('YYYY-MM-DD');
        break;
      case 'mesAtual':
        dataInicial = hoje.startOf('month').format('YYYY-MM-DD');
        dataFinal = hoje.endOf('month').format('YYYY-MM-DD');
        break;
      case 'mesPassado':
        dataInicial = hoje.subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        dataFinal = hoje.subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        break;
      default:
        return;
    }

    this.form.patchValue({
      data_inicial: dataInicial,
      data_final: dataFinal
    });

    this.query();
  }

  getTotalQtdVendida(): string {
    if (!this.dashboardAdministrativo?.dados?.listaRentabilidade) return '0,00';
    const total = this.dashboardAdministrativo.dados.listaRentabilidade.reduce((acc: number, item: any) => acc + item.qtdVendido, 0);
    return total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  getTotalVendido(): number {
    if (!this.dashboardAdministrativo?.dados?.listaRentabilidade) return 0;
    return this.dashboardAdministrativo.dados.listaRentabilidade.reduce((acc: number, item: any) => acc + item.totalVendido, 0);
  }

  getTotalCusto(): number {
    if (!this.dashboardAdministrativo?.dados?.listaRentabilidade) return 0;
    return this.dashboardAdministrativo.dados.listaRentabilidade.reduce((acc: number, item: any) => acc + item.totalCusto, 0);
  }

  getTotalLucro(): number {
    return this.getTotalVendido() - this.getTotalCusto();
  }

  getMargemLucroTotal(): number {
    const totalVendido = this.getTotalVendido();
    if (totalVendido === 0) return 0;
    return (this.getTotalLucro() / totalVendido) * 100;
  }

}
