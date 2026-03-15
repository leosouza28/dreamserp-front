import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SessaoService } from 'src/app/services/sessao.service';

@Component({
  selector: 'app-cliente-container',
  templateUrl: './cliente-container.component.html',
  styleUrls: ['./cliente-container.component.scss']
})
export class ClienteContainerComponent implements OnInit {

  constructor(public sessao: SessaoService) { }

  ngOnInit(): void {
  }

  click() {
  }

}
