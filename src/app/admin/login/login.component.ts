import { Component, isDevMode, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { SessaoService } from 'src/app/services/sessao.service';
import { ApiService } from '../../services/api.service';



@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  form_activation: FormGroup;
  loading_activation: boolean = false;

  form: FormGroup;
  error: any;
  loading: boolean = false;

  step: number = 1;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public sessao: SessaoService,
    private alert: AlertService,
    private router: Router,
    private endpoint: EndpointsService,
    private modalService: NgbModal
  ) {
    this.form_activation = this.fb.group({
      codigo_ativacao: this.fb.control("", [Validators.required, Validators.maxLength(6), Validators.minLength(6)]),
    });

    this.form = this.fb.group({
      documento: this.fb.control("", [Validators.required]),
      senha: this.fb.control("", [Validators.required])
    });
  }

  ngOnInit(): void {
    this.verificarSessao();
    if (isDevMode()) {
      this.form_activation.patchValue({
        codigo_ativacao: "000000"
      });
      this.form.patchValue({
        documento: "admin",
        senha: "leo1010"
      });
    }
  }

  async verificarSessao() {
    let sessao = this.sessao.getUser();
    if (sessao) {
      this.api.logDev('Logged user', sessao);
      this.router.navigate(['/admin/inicio']);
    }
  }


  async onSubmit() {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    try {
      let { documento, senha } = this.form.value;
      let data = await this.endpoint.login(documento, senha);
      this.sessao.setUser(data);
      this.router.navigate(['/admin/inicio'])
    } catch (error) {
      this.api.logDev(error);
      this.error = error;
    }
    this.loading = false;
  }

}
