import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';

@Component({
  selector: 'app-form-usuarios',
  templateUrl: './form-usuarios.component.html',
  styleUrls: ['./form-usuarios.component.scss']
})
export class FormUsuariosComponent implements OnInit {

  form: FormGroup;
  status_options = ['ATIVO', 'BLOQUEADO'];
  permissoes: any = [];
  estados_options: any = [];
  cidades_options: any = [];
  perfis_options: any = [];
  loading: boolean = false;
  loading_cidades: boolean = false;
  loading_estados: boolean = false;
  loading_cep: boolean = false;
  user_data: any = null;

  constructor(private fb: FormBuilder, private endpointService: EndpointsService, private router: Router, private route: ActivatedRoute, private alert: AlertService) {
    this.form = this.fb.group({
      _id: this.fb.control(""),
      documento: this.fb.control(""),
      username: this.fb.control(""),
      nome: this.fb.control(""),
      email: this.fb.control(""),
      senha: this.fb.control(""),
      status: this.fb.control("ATIVO"),
      telefones: this.fb.array([
        this.fb.group({
          tipo: this.fb.control(""),
          valor: this.fb.control(""),
          principal: this.fb.control(false)
        })
      ]),
      perfil: this.fb.control(""),
      perfil_ativo: this.fb.control(false),
    });
  }

  ngOnInit(): void {
    this.init();
    this.route.queryParams.subscribe((params) => {
      if (params['id']) this.getUsuario(params['id']);
      else this.resetFormUsuario();
    });
  }

  async init() {
    this.getPerfis();
  }

  async getUsuario(usuario_id: string) {
    if (this.loading) return;
    this.loading = true;
    try {
      let user = await this.endpointService.getUsuario(usuario_id);
      this.setValues(user);
    } catch (error) {

    }
    this.loading = false;
  }

  async getPerfis() {
    try {
      let perfil = await this.endpointService.getPerfisNoAuth({ perpage: 1000, page: 1 });
      this.perfis_options = perfil.lista;
      this.endpointService.logDev(this.perfis_options);
    } catch (error: any) {
      this.alert.showDanger(error);
    }
  }

  getPermissoesOrganizadas(permissoes: any) {
    const permissoesOrganizadas: any[] = [];
    for (const permissao of permissoes) {
      const [secao, acao] = permissao.key.split('.');
      let secaoExistente = permissoesOrganizadas.find(p => p.secao === secao);
      if (!secaoExistente) {
        secaoExistente = { secao, permissoes: [] };
        permissoesOrganizadas.push(secaoExistente);
      }
      secaoExistente.permissoes.push({
        key: permissao.key,
        description: permissao.description,
        acao: acao
      });
    }
    return permissoesOrganizadas;
  }

  setValues(usuario: any) {
    console.log(usuario);
    this.user_data = usuario;
    this.form.get('_id')?.setValue(usuario._id);
    this.form.get('documento')?.setValue(usuario.documento);
    this.form.get('nome')?.setValue(usuario.nome);
    this.form.get('username')?.setValue(usuario.username);
    this.form.get('email')?.setValue(usuario?.email || "");
    this.form.get('status')?.setValue(usuario?.status || "");
    this.limparArrayTelefones();
    for (let tel of usuario.telefones) {
      const telefoneForm = this.fb.group({
        tipo: [tel.tipo, Validators.required],
        valor: [tel.valor, Validators.required],
        principal: [tel.principal]
      });
      this.telefonesArray.push(telefoneForm);
    }
    this.form.get('perfil')?.setValue(usuario?._empresa?.perfil?._id || "");
    this.form.get('perfil_ativo')?.setValue(usuario?._empresa?.ativo || false);

  }

  resetFormUsuario() {
    this.form.patchValue({
      _id: "",
      documento: "",
      username: "",
      nome: "",
      email: "",
      senha: "",
      status: "ATIVO",
    })
    this.limparArrayTelefones();
    setTimeout(() => {
      this.addTelefone();
    }, 250);
  }

  limparArrayTelefones() {
    while (this.telefonesArray.length > 0) {
      this.telefonesArray.removeAt(0);
    }
  }

  get telefonesArray(): FormArray {
    return this.form.get('telefones') as FormArray;
  }

  addTelefone(): void {
    const telefoneForm = this.fb.group({
      tipo: ['', Validators.required],
      valor: ['', Validators.required],
      principal: [false]
    });
    this.telefonesArray.push(telefoneForm);
  }

  removeTelefone(index: number): void {
    this.telefonesArray.removeAt(index);
  }

  async onSubmit() {
    if (this.loading) return;
    this.loading = true;
    try {
      await this.endpointService.postUsuarios(this.form.value);
      this.back();
    } catch (error: any) {
      this.alert.showDanger(error)
    }
    this.loading = false;
  }

  back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/admin/usuarios/listar']);
    }
  }


}
