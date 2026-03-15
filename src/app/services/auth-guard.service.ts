import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessaoService } from './sessao.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private router: Router, private sessao: SessaoService) { }

    canActivate(): boolean {
        var isAuthorized = false;

        let _ = this.sessao.getUser();
        if (_) isAuthorized = true;

        if (!isAuthorized) {
            this.router.navigate(['/area-administrativa']);
            return false;
        }

        return true;
    }

    isScopeAvailable(scope: string): boolean {
        let { scopes } = this.sessao.getUser();
        if (scopes.includes(scope)) return true;
        return false;
    }

}
