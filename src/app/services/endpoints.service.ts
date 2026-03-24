import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class EndpointsService extends ApiService {


    login(documento: string, senha: string) {
        return this.post('/v1/login', { documento, senha });
    }
    me() {
        return this.get('/v1/me');
    }
    getPermissoes() {
        return this.get('/v1/admin/usuarios/permissoes');
    }
    getDefaultValues() {
        return this.get('/public/default-values')
    }
    // Public
    getEstados() {
        return this.get('/public/estados');
    }
    getCidades(estadoSigla: string) {
        let urlParams = new URLSearchParams();
        urlParams.append('estado', estadoSigla);
        return this.get(`/public/cidades?${urlParams.toString()}`);
    }
    getConsultaCEP(cep: string) {
        let urlParams = new URLSearchParams();
        urlParams.append('cep', cep);
        return this.get(`/public/cep?${urlParams.toString()}`);
    }
    // Admin
    // Usuários
    getUsuarios({ perpage, page, busca, ...params }: any) {
        let urlParams = new URLSearchParams();
        if (perpage && page) {
            urlParams.append('perpage', perpage);
            urlParams.append('page', page);
        }
        if (busca) urlParams.append('busca', busca);
        for (const key in params) {
            if (params[key]) urlParams.append(key, params[key]);
        }
        return this.get('/v1/admin/usuarios' + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    getPerfis({ perpage, page, busca, ...params }: any) {
        let urlParams = new URLSearchParams();
        if (perpage && page) {
            urlParams.append('perpage', perpage);
            urlParams.append('page', page);
        }
        if (busca) urlParams.append('busca', busca);
        for (const key in params) {
            if (params[key]) urlParams.append(key, params[key]);
        }
        return this.get('/v1/admin/perfis' + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    getPerfisNoAuth({ perpage, page, busca, ...params }: any) {
        let urlParams = new URLSearchParams();
        if (perpage && page) {
            urlParams.append('perpage', perpage);
            urlParams.append('page', page);
        }
        if (busca) urlParams.append('busca', busca);
        for (const key in params) {
            if (params[key]) urlParams.append(key, params[key]);
        }
        urlParams.append('skip_auth', '1')
        return this.get('/v1/admin/perfis' + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    getPerfilById(id: string) {
        return this.get('/v1/admin/perfis/' + id);
    }
    postPerfil(data: any) {
        return this.post('/v1/admin/perfis', data);
    }
    getUsuarioById(id: string = '') {
        return this.get('/v1/admin/usuarios/' + id);
    }
    postUsuarios(data: any) {
        return this.post('/v1/admin/usuarios', data);
    }
    // Pessoas
    getPessoas({ perpage, page, busca, ...params }: any) {
        let urlParams = new URLSearchParams();
        if (perpage && page) {
            urlParams.append('perpage', perpage);
            urlParams.append('page', page);
        }
        if (busca) urlParams.append('busca', busca);
        for (const key in params) {
            if (params[key]) urlParams.append(key, params[key]);
        }
        return this.get('/v1/admin/pessoas' + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    getPessoaById(id: string) {
        return this.get('/v1/admin/pessoas/' + id);
    }
    postPessoa(data: any) {
        return this.post('/v1/admin/pessoas', data);
    }
    // CRM
    getCrms({ perpage, page, q, ...params }: any) {
        let urlParams = new URLSearchParams();
        if (perpage && page) {
            urlParams.append('perpage', perpage);
            urlParams.append('page', page);
        }
        if (q) urlParams.append('q', q);
        for (const key in params) {
            if (params[key]) urlParams.append(key, params[key]);
        }
        return this.get('/v1/admin/crm' + (urlParams.toString() ? `?${urlParams.toString()}` : ''));
    }
    getCrmById(id: string) {
        return this.get('/v1/admin/crm/' + id);
    }
    getCrmByDocumento(documento: string) {
        const urlParams = new URLSearchParams();
        urlParams.append('q', documento);
        return this.get('/v1/admin/crm?' + urlParams.toString());
    }
    postCrm(data: any) {
        return this.post('/v1/admin/crm', data);
    }

}