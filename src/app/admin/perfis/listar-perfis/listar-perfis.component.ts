import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-listar-perfis',
  templateUrl: './listar-perfis.component.html',
  styleUrls: ['./listar-perfis.component.scss']
})
export class ListarPerfisComponent {

  data: any = { lista: [], total: 0 }
  form: FormGroup;
  loading: boolean = false;

  constructor(
    private endpointsService: EndpointsService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      q: this.fb.control(""),
      page: this.fb.control("1"),
      perpage: this.fb.control("100"),
    });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(({ ...params }) => {
      if (Object.keys(params).length == 0) this.initializeRoute(true);
      else this.busca(params);
    })
  }

  initializeRoute(init = false) {
    let q = { ...this.form.getRawValue() };
    if (q?.page) q.page = Number(q.page);
    if (q?.perpage) q.perpage = Number(q.perpage);
    if (init) this.router.navigate([window.location.pathname], { queryParams: q, replaceUrl: true })
    return q;
  }

  query() {
    this.router.navigate([window.location.pathname], {
      queryParams: { ...this.initializeRoute() }
    })
  }

  async busca(q: any) {
    if (this.loading) return;
    this.loading = true;
    try {
      for (let i in q) this.form.get(i)?.setValue(q[i]);
      let values = this.form.getRawValue();
      let data: any = await this.endpointsService.getPerfis({ ...values });
      this.data = data;
    } catch (error) {
      console.log("Error", error);
    }
    this.loading = false;
  }



}
