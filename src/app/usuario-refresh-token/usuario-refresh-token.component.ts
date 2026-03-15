import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { SessaoService } from '../services/sessao.service';
import { AlertService } from '../services/alert.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-usuario-refresh-token',
  templateUrl: './usuario-refresh-token.component.html',
  styleUrls: ['./usuario-refresh-token.component.scss']
})
export class UsuarioRefreshTokenComponent implements OnInit {

  constructor(private api: ApiService, private activatedRoute: ActivatedRoute, private router: Router, private sessao: SessaoService, private alert: AlertService) {

    this.activatedRoute.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.reauth(token)
      } else {
        this.router.navigate(['/area-administrativa']);
      }
    });

  }
  ngOnInit(): void {
  }

  async reauth(token: string) {
    try {
      // let hasToken = this.sessao.getToken();
      // if (hasToken) {
      //   this.router.navigate(['/admin']);
      //   return
      // }
      let httpHeaders = new HttpHeaders();
      httpHeaders = httpHeaders.append('Authorization', token);
      let sessao = await this.api.post("/v1/refresh-token", {}, httpHeaders);
      if (sessao?.niveis?.includes('ADMIN')) {
        this.sessao.setUser(sessao);
        this.router.navigate(['/admin/inicio']);
      }
    } catch (error: any) {
      console.error("Erro ao reautenticar", error?.message);
      this.alert.showDanger("Reautenticação falhou, tente novamente mais tarde.");
      this.router.navigate(['/area-administrativa']);
    }
  }


}
