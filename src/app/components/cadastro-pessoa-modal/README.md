# Modal de Cadastro de Pessoa

Este modal permite o cadastro completo de pessoas físicas (CPF) ou jurídicas (CNPJ) com validação de campos obrigatórios.

## Campos do Formulário

### Comuns para CPF e CNPJ:
- **Tipo de Documento**: CPF ou CNPJ (obrigatório)
- **Documento**: CPF ou CNPJ (obrigatório)
- **Nome Completo**: Nome da pessoa (obrigatório)
- **E-mail**: E-mail válido (obrigatório)
- **Telefone**: Telefone de contato (obrigatório)
- **CEP**: CEP do endereço (obrigatório) - Com busca automática via ViaCEP
- **Logradouro**: Rua/Avenida (obrigatório)
- **Número**: Número do endereço (obrigatório)
- **Complemento**: Complemento do endereço (opcional)
- **Cidade**: Cidade (obrigatório)
- **Estado**: UF (obrigatório)

### Específico para CNPJ:
- **Razão Social**: Razão social da empresa (obrigatório)

## Como Usar

### 1. Importar no componente

```typescript
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CadastroPessoaModalComponent } from 'caminho/para/cadastro-pessoa-modal.component';

constructor(private modalService: NgbModal) {}
```

### 2. Abrir o modal

```typescript
abrirModal() {
  const modalRef = this.modalService.open(CadastroPessoaModalComponent, { 
    size: 'lg',
    backdrop: 'static',  // Impede fechar clicando fora
    keyboard: false      // Impede fechar com ESC
  });

  // Capturar o resultado quando o usuário salvar
  modalRef.result.then((resultado) => {
    console.log('Dados preenchidos:', resultado);
    // Processar os dados aqui (ex: enviar para API)
  }).catch((error) => {
    console.log('Modal fechado sem salvar');
  });
}
```

## Estrutura dos Dados Retornados

```typescript
{
  tipo_documento: 'cpf' | 'cnpj',
  documento: string,
  nome_completo: string,
  razao_social?: string,  // Apenas para CNPJ
  email: string,
  telefone: string,
  cep: string,
  logradouro: string,
  numero: string,
  complemento?: string,
  cidade: string,
  estado: string
}
```

## Recursos

- ✅ Validação de campos obrigatórios
- ✅ Validação de e-mail
- ✅ Busca automática de endereço por CEP (ViaCEP)
- ✅ Alternância dinâmica entre CPF e CNPJ
- ✅ Campo Razão Social aparecer apenas para CNPJ
- ✅ Modal com backdrop estático (obrigatório preencher ou cancelar)
- ✅ Todos os estados brasileiros no select
- ✅ Layout responsivo

## Opções de Configuração do Modal

```typescript
const modalRef = this.modalService.open(CadastroPessoaModalComponent, {
  size: 'lg',           // 'sm', 'lg', 'xl'
  backdrop: 'static',   // true, false, 'static'
  keyboard: false,      // true, false
  centered: true        // Centralizar verticalmente
});
```

## Exemplo Completo

```typescript
import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CadastroPessoaModalComponent } from './components/cadastro-pessoa-modal/cadastro-pessoa-modal.component';

@Component({
  selector: 'app-exemplo',
  template: `
    <button (click)="cadastrarPessoa()">Cadastrar Pessoa</button>
  `
})
export class ExemploComponent {
  constructor(private modalService: NgbModal) {}

  cadastrarPessoa() {
    const modalRef = this.modalService.open(CadastroPessoaModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.result.then((dados) => {
      // Enviar dados para API
      this.salvarPessoa(dados);
    }).catch(() => {
      console.log('Cancelado pelo usuário');
    });
  }

  salvarPessoa(dados: any) {
    // Implementar lógica de salvamento
    console.log('Salvando pessoa:', dados);
  }
}
```

## Busca de CEP

O modal possui integração com a API ViaCEP. Ao preencher o CEP e sair do campo (blur) ou clicar no botão "Buscar", os campos de endereço são preenchidos automaticamente quando o CEP é válido.
