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

  form!: FormGroup;


  constructor(public sessao: SessaoService, private endpointService: EndpointsService, private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      data_inicial: this.fb.control(dayjs().startOf('month').format('YYYY-MM-DD')),
      data_final: this.fb.control(dayjs().endOf('month').format('YYYY-MM-DD')),
    })
  }

  ngOnInit(): void {
    this.getDashboardAdmin();
  }

  navigateTo(link: string) {
    this.router.navigate([link]);
  }

  async getDashboardAdmin() {
    this.loading = true;
    try {
    } catch (error) {
      console.log(error);
    }
    this.loading = false;
  }

  query() {
    this.getDashboardAdmin();
  }

  
}
