import { Component, Input, OnInit } from '@angular/core';
import { OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'render-badge',
  templateUrl: './render-badge.component.html',
  styleUrls: ['./render-badge.component.scss']
})

export class RenderBadgeComponent implements OnInit, OnChanges {
  
  @Input('badgeText') badgeText: string = '';
  @Input('badgeVariant') badgeVariant: string = '';
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['badgeText'] && !changes['badgeText'].firstChange) {
      this.updateBadgeVariant();
    }
  }

  private updateBadgeVariant(): void {
    if (this.badgeText == 'ATIVO') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'FINALIZADA') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'VALIDO') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'PAGO') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'CONCLUIDO') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'CONCLUIDA') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'ABERTO') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'DESBLOQUEADO') this.badgeVariant = 'badge text-bg-success';
    // Carteirinha
    if (this.badgeText == 'Desbloqueado') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'EMITIDA') this.badgeVariant = 'badge text-bg-success';
    if (this.badgeText == 'VALIDA') this.badgeVariant = 'badge text-bg-success';
    
    
    
    if (this.badgeText == 'FECHADO') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'EM ABERTO') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'ABERTO') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'ABERTA') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'PENDENTE') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'BAIXADO') this.badgeVariant = 'badge text-bg-warning';
    if (this.badgeText == 'BAIXADA') this.badgeVariant = 'badge text-bg-warning';
    
    if (this.badgeText == 'EXPIRADO') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'BLOQUEADO') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'DEVOLVIDO') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'DEVOLVIDA') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'CANCELADO') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'CANCELADA') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'INVALIDO') this.badgeVariant = 'badge text-bg-danger text-white';
    if (this.badgeText == 'FECHADA') this.badgeVariant = 'badge text-bg-danger text-white';
    

    if (this.badgeText == 'VALIDADO') this.badgeVariant = 'badge text-bg-info';
  }

  ngOnInit(): void {
    this.updateBadgeVariant();
  }
}