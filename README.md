# DreamSERP — Frontend

Aplicação Angular 16 de gestão administrativa (ERP) com autenticação, controle de acesso por perfis/escopos, CRUD de entidades, comissões e relatórios.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Pastas](#2-estrutura-de-pastas)
3. [Módulo Raiz e Roteamento](#3-módulo-raiz-e-roteamento)
4. [Serviços](#4-serviços)
5. [Seção Admin — Componentes](#5-seção-admin--componentes)
6. [Seção Cliente — Componentes](#6-seção-cliente--componentes)
7. [Componentes Compartilhados](#7-componentes-compartilhados)
8. [Pipes (Formatações)](#8-pipes-formatações)
9. [Diretivas](#9-diretivas)
10. [Autenticação e AuthGuard](#10-autenticação-e-authguard)
11. [Comunicação com a API](#11-comunicação-com-a-api)
12. [Bibliotecas de Terceiros](#12-bibliotecas-de-terceiros)
13. [Como Executar](#13-como-executar)

---

## 1. Visão Geral

O **DreamSERP** é um sistema de gestão (ERP) baseado em web que oferece:

- Autenticação com JWT e controle de sessão via `localStorage`
- Controle de acesso baseado em perfis e escopos (RBAC)
- CRUD de **Usuários**, **Pessoas** (clientes/fornecedores) e **Perfis** de acesso
- Gestão de **Comissões** (agência e vendedores)
- **Relatórios** e **Dashboard** com gráficos (Chart.js)
- Suporte a PWA (Service Worker Angular)
- Localização em português brasileiro (moeda, datas, máscaras)

**Stack:** Angular 16 · TypeScript 5 · Bootstrap 5 · RxJS · Chart.js

---

## 2. Estrutura de Pastas

```
src/
├── main.ts                         # Ponto de entrada Angular
├── styles.scss                     # Estilos globais
├── app/
│   ├── app.module.ts               # Módulo raiz (declarações, providers, imports)
│   ├── app-routing.module.ts       # Rotas principais
│   ├── app.component.ts            # Componente raiz (<router-outlet>)
│   │
│   ├── services/                   # Serviços globais
│   │   ├── api.service.ts          # Camada HTTP genérica
│   │   ├── endpoints.service.ts    # Definições de endpoints da API
│   │   ├── sessao.service.ts       # Estado de sessão / autenticação
│   │   ├── auth-guard.service.ts   # Guarda de rotas protegidas
│   │   └── alert.service.ts        # Sistema de notificações (toast)
│   │
│   ├── components/                 # Componentes reutilizáveis
│   │   ├── alert/
│   │   ├── table-template/
│   │   ├── inline-loading/
│   │   ├── inline-error/
│   │   ├── text-spinner/
│   │   ├── render-badge/
│   │   ├── numeric-pad/
│   │   ├── ingresso-card/
│   │   ├── multi-checkbox-select/
│   │   └── image-cropper-modal/
│   │
│   ├── pipes/                      # Pipes de transformação de dados
│   │   ├── money-brl.pipe.ts
│   │   ├── cpf-cnpj.pipe.ts
│   │   ├── phone.pipe.ts
│   │   ├── date-simple.pipe.ts
│   │   ├── date-from-now.pipe.ts
│   │   ├── peso.pipe.ts
│   │   ├── payment-description.pipe.ts
│   │   ├── user-agent.pipe.ts
│   │   └── user-info.pipe.ts
│   │
│   ├── directives/
│   │   └── next-on-enter.directive.ts
│   │
│   ├── admin/                      # Seção administrativa (protegida)
│   │   ├── admin-container/        # Shell/layout do admin
│   │   ├── login/
│   │   ├── logoff/
│   │   ├── inicio/                 # Dashboard
│   │   ├── usuarios/               # CRUD de usuários
│   │   ├── pessoas/                # CRUD de pessoas
│   │   ├── perfis/                 # CRUD de perfis de acesso
│   │   ├── comissoes/              # Comissões agência e vendedores
│   │   └── relatorios/             # Relatórios de vendas e fornecimento
│   │
│   └── cliente/                    # Seção pública / cliente
│       ├── cliente-container/
│       └── home/
```

---

## 3. Módulo Raiz e Roteamento

### `app.module.ts`

O módulo raiz declara todos os componentes, pipes e diretivas; importa os módulos Angular e de terceiros; e registra os providers globais.

Destaques:
- `LOCALE_ID: 'pt-BR'` — localização brasileira aplicada em toda a aplicação
- `NgxCurrencyModule` com formato BRL (separador decimal `,`, milhar `.`)
- `NgxMaskDirective` / `NgxMaskPipe` para máscaras de input (CPF, CNPJ, telefone, etc.)
- `LOAD_WASM` — carrega o WebAssembly do leitor de QR code

### `app-routing.module.ts`

```
/                           → ClienteContainerComponent
  /                         → HomeComponent (redireciona para /area-administrativa)
  /area-administrativa      → LoginComponent (pública)
  /refresh-token            → UsuarioRefreshTokenComponent

/admin (AuthGuard)          → AdminContainerComponent
  /admin/inicio             → InicioComponent (Dashboard)
  /admin/usuarios           → ListarUsuariosComponent
  /admin/usuarios/form      → FormUsuariosComponent
  /admin/pessoas            → ListarPessoasComponent
  /admin/pessoas/form       → FormPessoasComponent
  /admin/perfis             → ListarPerfisComponent
  /admin/perfis/form        → FormPerfisComponent
  /admin/comissoes/agencia  → ComissoesAgenciaComponent
  /admin/comissoes/vendedores → ComissoesVendedoresComponent
  /admin/relatorios/vendas  → RelVendasComponent
  /admin/relatorios/...     → RelFornecimentoComponent
  /admin/logoff             → LogoffComponent
```

Todas as rotas sob `/admin` são protegidas pelo `AuthGuard`.

---

## 4. Serviços

### `ApiService`

Camada HTTP base. Todos os métodos são assíncronos (retornam `Promise`).

| Método | Descrição |
|--------|-----------|
| `get<T>(url, params?)` | Requisição GET |
| `post<T>(url, body)` | Requisição POST |
| `put<T>(url, body)` | Requisição PUT |
| `patch<T>(url, body)` | Requisição PATCH |
| `delete<T>(url, params?)` | Requisição DELETE |
| `getHeaders()` | Injeta o token JWT no header `Authorization` |
| `handleError(error)` | Trata erros globais; redireciona para login em caso de 401 |

**URLs base:**
- Desenvolvimento: `http://localhost:8009`
- Produção: `https://api.trackbeef.lsdevelopers.dev`

### `EndpointsService`

Estende `ApiService`. Define todos os endpoints da aplicação.

```typescript
// Autenticação
login(documento, senha)      // POST /v1/login
me()                         // GET  /v1/me
getPermissoes()              // GET  /v1/admin/usuarios/permissoes

// Endereço
getEstados()                 // GET estados brasileiros
getCidades(estadoSigla)      // GET cidades pelo estado
getConsultaCEP(cep)          // GET dados de endereço pelo CEP

// Usuários
getUsuarios(params)
getUsuarioById(id)
postUsuarios(body)

// Perfis
getPerfis()
getPerfisNoAuth()
getPerfilById(id)
postPerfil(body)

// Pessoas
getPessoas(params)
getPessoaById(id)
postPessoa(body)
```

### `SessaoService`

Gerencia o estado de autenticação da aplicação.

- Persiste `token` e `userData` no `localStorage`
- Expõe `userSubject` (BehaviorSubject) para atualizações reativas
- Métodos: `setUser()`, `getUser()`, `getToken()`, `clearSession()`, `isAuthenticated()`, `isScopeAvailable(scope)`

### `AuthGuard`

Implementa `CanActivate`. Verifica se existe usuário na sessão; caso contrário, redireciona para `/area-administrativa`.

### `AlertService`

Sistema de notificações toast baseado em RxJS `Subject`.

```typescript
alert.showSuccess('Salvo com sucesso!');
alert.showWarning('Atenção!');
alert.showDanger('Erro ao salvar.');
```

---

## 5. Seção Admin — Componentes

### `AdminContainerComponent` (Shell)

Layout principal do painel administrativo. Contém:
- Sidebar com menu dinâmico filtrado por escopos do perfil do usuário
- Offcanvas responsivo (Bootstrap)
- Inscrição no `sessao.userSubject` para refletir mudanças de sessão em tempo real

**Itens de menu e escopos requeridos:**

| Item | Escopo |
|------|--------|
| Usuários | `usuarios.leitura` |
| Pessoas | `pessoas.leitura` |
| Perfis | `perfis.leitura` |
| Comissões Agência | `comissoes.comissoes_agencia_leitura` |
| Comissões Vendedores | `comissoes.comissoes_vendedores_leitura` |

### `LoginComponent`

- Formulário reativo em duas etapas: código de ativação → credenciais
- Em ambiente de desenvolvimento, preenche automaticamente os campos do formulário para facilitar os testes locais. **Atenção:** credenciais de desenvolvimento nunca devem ser commitadas nem usadas em produção.
- Verifica sessão ativa no `ngOnInit`; redireciona para o dashboard se já autenticado

### `InicioComponent` (Dashboard)

- Filtros de período (padrão: mês atual)
- Integração com Chart.js para gráficos de dados

### `FormPessoasComponent`

Formulário completo de cadastro/edição de pessoas (clientes/fornecedores).

- Campos: nome, e-mail, documento (CPF/CNPJ), endereço, telefones
- Busca automática de endereço pelo CEP via `getConsultaCEP()`
- Seleção em cascata estado → cidade
- Array dinâmico de telefones (WhatsApp, celular, fixo)
- Funciona como **página** ou como **modal** (fecha com resultado)

### Demais componentes CRUD

`ListarUsuariosComponent`, `FormUsuariosComponent`, `ListarPerfisComponent`, `FormPerfisComponent`, `ListarPessoasComponent` — todos seguem o mesmo padrão:
- Tabela paginada com filtros por query params (`page`, `perpage`, `q`, `status`)
- Formulário reativo com validação
- Integração com `AlertService` para feedback

### `LogoffComponent`

Chama `sessao.clearSession()` e redireciona para a tela de login.

---

## 6. Seção Cliente — Componentes

### `ClienteContainerComponent`

Container público (sem autenticação). Serve como `<router-outlet>` para rotas do cliente.

### `HomeComponent`

Redireciona automaticamente para `/area-administrativa`. Verifica o query param `?login` se presente.

---

## 7. Componentes Compartilhados

| Componente | Descrição |
|------------|-----------|
| `AlertComponent` | Toast com auto-dismiss em 3s; suporta success/warning/danger |
| `TableTemplateComponent` | Tabela reutilizável com paginação, seletor de itens por página e impressão |
| `InlineLoadingComponent` | Spinner de carregamento inline |
| `InlineErrorComponent` | Exibição de mensagens de erro inline |
| `TextSpinnerComponent` | Spinner utilitário simples |
| `RenderBadgeComponent` | Badge de status colorido |
| `NumericPadComponent` | Teclado numérico para dispositivos móveis |
| `IngressoCardComponent` | Card de ingresso/ticket |
| `MultiCheckboxSelectComponent` | Multi-seleção com checkboxes |
| `ImageCropperModalComponent` | Modal de recorte de imagem |

### `TableTemplateComponent` — Detalhes

- Paginação inteligente (exibe botões contextuais: anterior, atual, próximo)
- Seletor de registros por página: 10, 20, 50, 100
- Botão de impressão (abre nova janela formatada para impressão)
- Estado de carregamento integrado
- Persiste página atual nos query params da URL

---

## 8. Pipes (Formatações)

| Pipe | Uso no template | Exemplo de saída |
|------|----------------|-----------------|
| `moneyBrl` | `valor \| moneyBrl` | `1.250,00` |
| `cpfCnpj` | `doc \| cpfCnpj` | `123.456.789-09` / `12.345.678/0001-95` |
| `phone` | `tel \| phone` | `(11) 98765-4321` |
| `dateSimple` | `data \| dateSimple` | `21/03/24` |
| `dateFromNow` | `data \| dateFromNow` | `há 2 horas` |
| `peso` | `valor \| peso` | Formatação de peso/unidade |
| `paymentDescription` | `status \| paymentDescription` | Descrição do pagamento |
| `userAgent` | `ua \| userAgent` | Info de navegador/dispositivo |
| `userInfo` | `user \| userInfo` | Exibição de dados do usuário |

**Implementação do `moneyBrl`:**

```typescript
transform(value: number): string {
  return value
    .toLocaleString('pt-br', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
    .split('R$').join('');
}
```

---

## 9. Diretivas

### `NextOnEnterDirective` (`appNextOnEnter`)

Simula o comportamento de `Tab` ao pressionar `Enter` em campos de formulário.

- Previne o envio padrão do formulário
- Localiza todos os elementos focáveis no documento
- Move o foco para o próximo elemento visível e habilitado
- Seleciona o texto do campo ao focar

```html
<input appNextOnEnter type="text" />
```

---

## 10. Autenticação e AuthGuard

### Fluxo de Login

```
1. Usuário acessa /area-administrativa
2. Preenche documento + senha no LoginComponent
3. EndpointsService.login() → POST /v1/login
4. API retorna { user, access_token }
5. SessaoService.setUser() salva token e dados no localStorage
6. Redireciona para /admin/inicio
```

### Persistência de Sessão

- No construtor do `SessaoService`, verifica `localStorage` por `USER_DATA` e `TOKEN`
- Se existirem, o usuário é automaticamente reconectado
- `userSubject` (BehaviorSubject) notifica todos os assinantes

### Proteção de Rotas

```typescript
// auth-guard.service.ts
canActivate(): boolean {
  if (this.sessao.getUser()) return true;
  this.router.navigate(['/area-administrativa']);
  return false;
}
```

### Token JWT

- Armazenado em `localStorage` (chave `TOKEN`)
- Injetado em toda requisição HTTP via `getHeaders()`:
  ```typescript
  headers: { Authorization: `Bearer ${token}` }
  ```
- Erros 401 limpam a sessão e redirecionam para o login

### Sistema de Escopos (RBAC)

O objeto `user.perfil.scopes` contém as permissões do usuário. Exemplo:
```json
["usuarios.leitura", "pessoas.leitura", "perfis.escrita"]
```

O menu e as rotas filtram itens com base nesses escopos via `isScopeAvailable(scope)`.

---

## 11. Comunicação com a API

### Fluxo de Requisição

```
Componente
  → chama EndpointsService.getPessoas({ page: 1, perpage: 20 })
    → EndpointsService monta URL + URLSearchParams
      → ApiService.get() adiciona header JWT
        → HttpClient faz a requisição
          → lastValueFrom() converte Observable → Promise
            → Componente recebe os dados (ou o erro tratado)
```

### Tratamento de Erros

```typescript
handleError(error) {
  if (error?.error?.message) return error.error.message;
  if (error?.status === 403)  return 'Sem permissão';
  if (error?.status === 401)  { sessao.clearSession(); router.navigate(['/area-administrativa']); }
  return 'Erro inesperado';
}
```

### Padrão nos Componentes

```typescript
async carregarDados() {
  this.loading = true;
  try {
    this.dados = await this.endpoints.getPessoas({ page: this.page });
  } catch (err) {
    this.alert.showDanger(err);
  } finally {
    this.loading = false;
  }
}
```

---

## 12. Bibliotecas de Terceiros

| Biblioteca | Propósito |
|-----------|-----------|
| `@ng-bootstrap/ng-bootstrap` | Componentes Bootstrap 5 para Angular (modais, offcanvas, tooltips) |
| `bootstrap` | Framework CSS responsivo |
| `chart.js` + `ng2-charts` | Gráficos e visualização de dados |
| `dayjs` | Manipulação e formatação de datas (locale pt-BR) |
| `ngx-mask` | Máscaras de input (CPF, CNPJ, telefone, CEP) |
| `ngx-currency` | Input de valores monetários no formato BRL |
| `angularx-qrcode` | Geração de QR codes |
| `ngx-scanner-qrcode` | Leitura de QR codes via câmera (WebAssembly) |
| `ngx-image-cropper` | Recorte de imagens no navegador |
| `html2canvas` | Converte elementos DOM em imagem canvas |
| `html2pdf.js` | Exportação de HTML para PDF |
| `firebase` | Integração com Firebase (analytics/notificações) |
| `uuid` | Geração de identificadores únicos |
| `rxjs` | Programação reativa (Observables, BehaviorSubject) |

---

## 13. Como Executar

### Pré-requisitos

- Node.js ≥ 18
- Angular CLI 16: `npm install -g @angular/cli@16`

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm start
# ou
npm run dev      # acessível na rede local na porta 4243
```

Acesse: `http://localhost:4200`

### Build de Produção

```bash
npm run build
# Artefatos gerados em dist/
```

### Testes Unitários

```bash
npm test
```

### Deploy

O projeto inclui scripts `deploy.sh` e configuração `app.yaml` para deploy no Google App Engine.
