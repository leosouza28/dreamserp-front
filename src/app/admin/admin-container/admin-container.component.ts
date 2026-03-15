import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs/operators';
import { AlertService } from 'src/app/services/alert.service';
import { ApiService } from 'src/app/services/api.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import { SessaoService } from 'src/app/services/sessao.service';

@Component({
  selector: 'app-admin-container',
  templateUrl: './admin-container.component.html',
  styleUrls: ['./admin-container.component.scss']
})
export class AdminContainerComponent implements OnInit {

  public offcanvasService = inject(NgbOffcanvas);
  public modalService = inject(NgbModal);

  version: any;
  menu: any[] = [];
  menuEmpresas: any[] = [];
  empresaAtiva: any = null;


  logged_user: any;

  dashboard_admin_data: any = null;

  constructor(
    private api: ApiService,
    private router: Router,
    public sessao: SessaoService,
    private endpointService: EndpointsService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.sessao.userSubject.subscribe(user => {
      if (user) {
        this.logged_user = user;
        this.loadMenu(false)
      } else {
        this.loadMenu(true)
      }
    })
    this.getVersion();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.offcanvasService.dismiss();
      });
  }


  closeCanvas() {
    this.offcanvasService.dismiss();
  }


  loadMenu(onlyDefault: boolean = false) {
    if (onlyDefault) {
      this.menu = this.menuItems.filter(item => item.default);
      return;
    } else {
      let scopes: any = this.scopesEmpresaAtiva;
      this.menu = this.menuItems.filter((item: any) => {
        if (item.default) return true;
        if (item.submenu) {
          item.submenu = item.submenu.filter((subItem: any) => {
            return !subItem.scopes || subItem.scopes.some((scope: string) => scopes.includes(scope));
          });
          return item.submenu.length > 0;
        }
        return !item.submenu && (!item.scopes || item.scopes.some((scope: string) => scopes.includes(scope)));
      });
    }
  }

  getVersion() {
    this.version = this.api.getPackageVersion();
  }

  toggleSubmenu(item: any) {
    if (item.submenu) {
      this.menu.forEach(menuItem => {
        if (menuItem !== item && menuItem.submenu) {
          menuItem.open = false;
        }
      });
      item.open = !item.open;
    }
  }

  openMenu(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  openChangeEmpresaModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  loading_empresa: boolean = false;

  get navigatorSupportsNotifications() {
    return 'Notification' in window;
  }

  get scopesEmpresaAtiva(): string[] {
    let user = this.sessao.getUser();
    if (user.perfil && user.perfil.scopes) {
      return user.perfil.scopes;
    }
    return [];
  }


  get menuItems(): any[] {
    const baseMenu: any[] = [
      {
        icon: 'bi bi-house-fill me-2',
        nome: 'Início',
        link: "/admin/inicio",
        submenu: null,
        default: true
      },
      {
        icon: 'bi bi-mortarboard-fill me-2',
        nome: 'Tutorial',
        link: "/admin/tutorial",
        submenu: null,
        default: true
      },

      {
        icon: 'bi bi-hammer me-2',
        nome: 'Operacional',
        submenu: [
          {
            scopes: ["usuarios.leitura"],
            icon: 'bi bi-people me-2',
            nome: 'Usuários',
            link: '/admin/usuarios/listar'
          },
          {
            scopes: ["clientes.leitura"],
            icon: 'bi bi-people me-2',
            nome: 'Pessoas',
            link: '/admin/pessoas/listar'
          },
          {
            scopes: ["perfis.leitura"],
            icon: 'bi bi-person-lines-fill me-2',
            nome: 'Perfis de acesso',
            link: '/admin/perfis/listar'
          },
        ],
        open: false
      },
      {
        icon: 'bi bi-gear me-2',
        nome: 'Configurações',
        submenu: [],
        open: false
      },

      {
        icon: 'bi bi-printer me-2',
        nome: 'Relatórios',
        submenu: [],
        open: false,
      },
    ];
    // Sempre adiciona o item "Sair"
    baseMenu.push({
      icon: 'bi bi-door-open-fill text-danger me-2',
      nome: 'Sair',
      link: '/admin/logoff',
      submenu: null,
      default: true
    });

    return baseMenu;
  }

  atualizando_sessao: boolean = false;

  async atualizarSessao() {
    if (this.atualizando_sessao) return;
    this.atualizando_sessao = true;
    try {
      let response = await this.api.post('/v1/relogin', {});
      this.sessao.setUser(response);
      this.alertService.showSuccess("Sessão atualizada com sucesso!");
    } catch (error) {
      this.alertService.showDanger("Erro ao atualizar sessão. Por favor, faça login novamente.");
    }
    this.atualizando_sessao = false;
  }
}