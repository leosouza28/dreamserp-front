import { Component, Input, OnInit, isDevMode } from '@angular/core';

@Component({
  selector: 'inline-error',
  templateUrl: './inline-error.component.html',
  styleUrls: ['./inline-error.component.scss']
})
export class InlineErrorComponent implements OnInit {
  @Input('error') error: any;

  ngOnInit(): void {
    if (isDevMode()) console.log("error", this.error);

  }
}
