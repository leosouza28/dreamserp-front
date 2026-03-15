import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'table-template',
  templateUrl: './table-template.component.html',
  styleUrls: ['./table-template.component.scss']
})
export class TableTemplateComponent implements OnInit {
  @Input() loading: boolean = false;
  @Input() total: any = 0;
  @Input() qtdPaginaAtiva: boolean = true;
  @Input() paginacaoAtiva: boolean = true;

  @ViewChild('divParaImprimir', { static: false }) divParaImprimir!: ElementRef;

  params: any = {};

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log(params);
      for (let i in params) this.params[i] = params[i]
    })
  }

  changePages(ev: any) {
    this.router.navigate([window.location.pathname], { queryParams: { ...this.params, perpage: ev.target.value }, replaceUrl: true });
  }

  buttons() {
    let botoes: any = [];
    if (this.params.perpage && this.params.page && this.total) {
      let pagina = Number(this.params.page);
      let perpage = Number(this.params.perpage);
      let totalItems = Number(this.total);
      let totalPaginas = Math.ceil(totalItems / perpage);
      if (pagina <= 2 && totalPaginas >= 3) {
        botoes.push(1);
        botoes.push(2);
        botoes.push(3);
      } else if (pagina >= 3) {
        botoes.push(1);
        botoes.push(pagina - 1)
        botoes.push(pagina)
        if ((pagina + 1) < totalPaginas) {
          botoes.push(pagina + 1)
        }
      } else if (totalPaginas < 4) {
        for (let i = 0; i < totalPaginas; i++) {
          botoes.push(i + 1)
        }
      }
      if (pagina < totalPaginas) {
        botoes.push(totalPaginas)
      }
    }

    botoes = [...new Set(botoes)];

    return botoes;
  }

  setPage(val: number) {
    this.params['page'] = val;
    this.router.navigate([window.location.pathname], { queryParams: { ...this.params }, replaceUrl: true });
  }

  addPage(val: number) {
    let totalPaginas = Math.ceil(Number(this.total) / Number(this.params['perpage']));
    if (this.loading) return;
    if (Object.keys(this.params).length == 0) return;
    let pagina = Number(this.params['page']);
    if (pagina <= 1 && val < 0) return;
    if (pagina >= totalPaginas && val > 0) return;
    pagina += val;
    this.params['page'] = pagina;
    this.router.navigate([window.location.pathname], { queryParams: { ...this.params }, replaceUrl: true });
  }

  imprimirDiv() {
    const conteudoDiv = this.divParaImprimir.nativeElement.innerHTML;
    const janelaImprimir: any = window.open('', '_blank');
    janelaImprimir.document.open();
    janelaImprimir.document.write(`<html>
    <head>
      <title>Estrela Dalva</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
    integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
      <link rel="stylesheet"
      href="https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css">
    <style>
      body{
        font-family: monospace
      }
      .thead-container {
        font-size: 0.785rem;
      }
      .tbody-container {
        font-size: 0.75rem;
      }
    </style>
    </head>
    <body>`);
    janelaImprimir.document.write(conteudoDiv);
    janelaImprimir.document.write('</body></html>');
    janelaImprimir.document.close();
  }

}
