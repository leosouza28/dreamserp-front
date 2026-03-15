import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private router: Router) {
    let subdomain = window.location.hostname.split(".").shift();
    let search_params = new URLSearchParams(window.location.search);
    if (subdomain === 'adm' && window.location.pathname == '/' && search_params.toString() == '') this.redirectToAdmin();
  }

  redirectToAdmin() {
    console.log('Redirecting to area administrativa');
    this.router.navigate(['/admin'], { replaceUrl: true })
  }
}
