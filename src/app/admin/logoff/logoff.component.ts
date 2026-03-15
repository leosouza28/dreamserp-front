import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessaoService } from 'src/app/services/sessao.service';

@Component({
  selector: 'app-logoff',
  templateUrl: './logoff.component.html',
  styleUrls: ['./logoff.component.scss']
})
export class LogoffComponent implements OnInit {

  constructor(private sessao: SessaoService, private router: Router) {

  }
  ngOnInit(): void {
    this.sessao.clearSession()
    this.router.navigate(['/area-administrativa']);
  }

}
