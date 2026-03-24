import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-listar-crm',
  templateUrl: './listar-crm.component.html',
  styleUrls: ['./listar-crm.component.scss']
})
export class ListarCrmComponent implements OnInit {

  data: any = { lista: [], total: 0 };
  form: FormGroup;
  loading: boolean = false;

  constructor(
    private endpointsService: EndpointsService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      q: this.fb.control(''),
      page: this.fb.control('1'),
      perpage: this.fb.control('10'),
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(({ ...params }) => {
      if (Object.keys(params).length === 0) this.initializeRoute(true);
      else this.busca(params);
    });
  }

  initializeRoute(init = false) {
    let q = { ...this.form.getRawValue() };
    if (q?.page) q.page = Number(q.page);
    if (q?.perpage) q.perpage = Number(q.perpage);
    if (init) this.router.navigate([window.location.pathname], { queryParams: q, replaceUrl: true });
    return q;
  }

  query() {
    this.router.navigate([window.location.pathname], {
      queryParams: { ...this.initializeRoute() }
    });
  }

  async busca(q: any) {
    if (this.loading) return;
    this.loading = true;
    try {
      for (let i in q) this.form.get(i)?.setValue(q[i]);
      this.data = await this.endpointsService.getCrms(this.form.getRawValue());
    } catch (error) {
      console.error('Erro ao buscar CRMs', error);
    }
    this.loading = false;
  }

  abrirCrm(item: any) {
    this.router.navigate(['/admin/crm/form'], {
      queryParams: { id: item._id },
      state: { crm: item }
    });
  }
}
