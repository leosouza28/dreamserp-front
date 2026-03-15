import { Component, Input } from '@angular/core';

@Component({
  selector: 'inline-loading',
  templateUrl: './inline-loading.component.html',
  styleUrls: ['./inline-loading.component.scss']
})
export class InlineLoadingComponent {
  @Input("loading") loading: boolean = false;
  @Input("loadingText") loading_text: string = 'Carregando...';
}
