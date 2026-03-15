import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

interface Permissao {
  key: string;
  description: string;
}

interface PermissaoAgrupada {
  grupo: string;
  permissoes: Permissao[];
}

@Component({
  selector: 'app-form-perfis',
  templateUrl: './form-perfis.component.html',
  styleUrls: ['./form-perfis.component.scss']
})
export class FormPerfisComponent {

  form: FormGroup;
  loading: boolean = false;
  permissoesAgrupadas: PermissaoAgrupada[] = [];

  constructor(private fb: FormBuilder, private endpointService: EndpointsService, private router: Router, private route: ActivatedRoute, private alert: AlertService) {
    this.form = this.fb.group({
      _id: this.fb.control(""),
      nome: this.fb.control("", [Validators.required]),
      scopes: this.fb.control([]),
    });
  }

  ngOnInit(): void {
    this.init();
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.getItem(params['id']);
      }
    });
  }

  async init() {
    try {
      let permissoes: Permissao[] = await this.endpointService.getPermissoes();
      this.agruparPermissoes(permissoes);
    } catch (error: any) {
      this.alert.showDanger(error);
    }
  }

  agruparPermissoes(permissoes: Permissao[]) {
    const grupos: { [key: string]: Permissao[] } = {};

    permissoes.forEach(permissao => {
      const grupo = permissao.key.split('.')[0];
      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(permissao);
    });

    this.permissoesAgrupadas = Object.keys(grupos).map(grupo => ({
      grupo: this.formatarNomeGrupo(grupo),
      permissoes: grupos[grupo]
    }));
  }

  formatarNomeGrupo(grupo: string): string {
    return grupo
      .split('_')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ');
  }

  async getItem(perfil_id: string) {
    if (this.loading) return;
    this.loading = true;
    try {
      let data: any = await this.endpointService.getPerfilById(perfil_id);
      this.form.patchValue({
        _id: data._id,
        nome: data.nome,
        scopes: data.scopes || []
      });
    } catch (error: any) {
      this.alert.showDanger(error);
    }
    this.loading = false;
  }

  isPermissaoSelecionada(key: string): boolean {
    const scopes = this.form.get('scopes')?.value || [];
    return scopes.includes(key);
  }

  togglePermissao(key: string) {
    const scopes = this.form.get('scopes')?.value || [];
    const index = scopes.indexOf(key);

    if (index > -1) {
      scopes.splice(index, 1);
    } else {
      scopes.push(key);
    }

    this.form.patchValue({ scopes: [...scopes] });
  }

  async onSubmit() {
    if (this.loading || this.form.invalid) return;
    this.loading = true;
    try {
      await this.endpointService.postPerfil(this.form.getRawValue());
      this.alert.showSuccess('Operação realizada com sucesso!');
      this.back();
    } catch (error: any) {
      this.alert.showDanger(error);
    }
    this.loading = false;
  }

  back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admin/perfis']);
    }
  }


}
