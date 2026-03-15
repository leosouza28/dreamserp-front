import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormPessoasComponent } from './form-pessoas/form-pessoas.component';

@Injectable({
  providedIn: 'root'
})
export class PessoasModalService {

  constructor(private modalService: NgbModal) { }

  /**
   * Abre o formulário de pessoa como modal
   * @param pessoaId ID da pessoa para edição (opcional)
   * @returns Promise com os dados da pessoa criada/editada ou undefined se cancelado
   */
  async openPessoaModal(pessoaId?: string): Promise<any> {
    const modalRef = this.modalService.open(FormPessoasComponent, {
      size: 'xl',
      backdrop: 'static',
      scrollable: true
    });

    // Passa o activeModal e o ID (se houver) para o componente
    modalRef.componentInstance.modal = modalRef;
    if (pessoaId) {
      modalRef.componentInstance.pessoaId = pessoaId;
    }

    try {
      const result = await modalRef.result;
      return result;
    } catch (error) {
      // Modal foi fechado/cancelado
      return undefined;
    }
  }
}
