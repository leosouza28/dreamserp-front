import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminContainerComponent } from "./admin/admin-container/admin-container.component";
import { InicioComponent } from "./admin/inicio/inicio.component";
import { LoginComponent } from "./admin/login/login.component";
import { LogoffComponent } from "./admin/logoff/logoff.component";
import { FormPerfisComponent } from "./admin/perfis/form-perfis/form-perfis.component";
import { ListarPerfisComponent } from "./admin/perfis/listar-perfis/listar-perfis.component";
import { FormPessoasComponent } from "./admin/pessoas/form-pessoas/form-pessoas.component";
import { ListarPessoasComponent } from "./admin/pessoas/listar-pessoas/listar-pessoas.component";
import { FormUsuariosComponent } from "./admin/usuarios/form-usuarios/form-usuarios.component";
import { ListarUsuariosComponent } from "./admin/usuarios/listar-usuarios/listar-usuarios.component";
import { ClienteContainerComponent } from "./cliente/cliente-container/cliente-container.component";
import { HomeComponent } from "./cliente/home/home.component";
import { AuthGuard } from './services/auth-guard.service';
import { UsuarioRefreshTokenComponent } from "./usuario-refresh-token/usuario-refresh-token.component";
import { ComissoesAgenciaComponent } from "./admin/comissoes/comissoes-agencia/comissoes-agencia.component";
import { ComissoesVendedoresComponent } from "./admin/comissoes/comissoes-vendedores/comissoes-vendedores.component";
import { ListarCrmComponent } from './admin/crm/listar-crm/listar-crm.component';
import { FormCrmComponent } from './admin/crm/form-crm/form-crm.component';

const routes: Routes = [
  {
    path: '',
    component: ClienteContainerComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
    ]
  },
  {
    path: "area-administrativa",
    component: LoginComponent,
  },
  {
    path: 'refresh-token',
    component: UsuarioRefreshTokenComponent,
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    component: AdminContainerComponent,
    children: [
      {
        path: "inicio",
        component: InicioComponent,
      },
      {
        path: 'usuarios',
        children: [
          {
            path: "listar",
            component: ListarUsuariosComponent
          },
          {
            path: "form",
            component: FormUsuariosComponent
          }
        ]
      },
      {
        path: 'pessoas',
        children: [
          {
            path: "listar",
            component: ListarPessoasComponent
          },
          {
            path: "form",
            component: FormPessoasComponent
          }
        ]
      },
      {
        path: 'perfis',
        children: [
          {
            path: "listar",
            component: ListarPerfisComponent
          },
          {
            path: "form",
            component: FormPerfisComponent
          }
        ]
      },
      {
        path: 'comissoes',
        children: [
          {
            path: "agencia",
            component: ComissoesAgenciaComponent
          },
          {
            path: "vendedores",
            component: ComissoesVendedoresComponent
          }
        ]
      },
      {
        path: 'crm',
        canActivate: [AuthGuard],
        children: [
          {
            path: 'listar',
            component: ListarCrmComponent
          },
          {
            path: 'form',
            component: FormCrmComponent
          }
        ]
      },
      {
        path: "configuracoes",
        children: []
      },
      {
        path: "relatorios",
        children: []
      },
      {
        path: "logoff",
        component: LogoffComponent
      },
      {
        path: '',
        redirectTo: '/admin/inicio',
        pathMatch: 'full'
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
