import { Injectable, isDevMode } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { lastValueFrom, catchError, throwError } from 'rxjs';
import packageJson from '../../../package.json';
import { SessaoService } from './sessao.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ApiService {

    public baseUrl: string;

    constructor(private http: HttpClient, private sessao: SessaoService, public router: Router) {
        // como pegar o ip local da minha maquina com angular
        // this.baseUrl = isDevMode() ? `http://${window.location.hostname}:8006` : 'https://api.parqueestreladalva.com.br';
        //this.baseUrl = isDevMode() ? `http://localhost:8009` : 'https://api.trackbeef.lsdevelopers.dev';
        this.baseUrl = isDevMode() ? `http://localhost:8009` : 'https://dreams-420512.uc.r.appspot.com';
    }

    // GET request
    async get<T>(endpoint: string, params?: HttpParams, headers?: HttpHeaders, responseType: any = 'json'): Promise<any> {
        let additionalParams = {};
        if (responseType != 'json') {
            additionalParams = {
                responseType: responseType,
                observe: 'response'
            }
        }
        return lastValueFrom(
            this.http.get<T>(`${this.baseUrl}${endpoint}`, { params, ...additionalParams, headers: this.getHeaders(headers) }).pipe(
                catchError(this.handleError)
            )
        );
    }

    // POST request
    async post<T>(endpoint: string, body: any, headers?: HttpHeaders): Promise<any> {
        return lastValueFrom(
            this.http.post<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders(headers) }).pipe(
                catchError(this.handleError)
            )
        );
    }

    // PUT request
    async put<T>(endpoint: string, body: any, headers?: HttpHeaders): Promise<any> {
        return lastValueFrom(
            this.http.put<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders(headers) }).pipe(
                catchError(this.handleError)
            )
        );
    }

    // DELETE request
    async delete<T>(endpoint: string, paramsOrBody?: HttpParams | any, headers?: HttpHeaders): Promise<any> {
        const isHttpParams = paramsOrBody instanceof HttpParams;
        return lastValueFrom(
            this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
                params: isHttpParams ? paramsOrBody : undefined,
                body: !isHttpParams ? paramsOrBody : undefined,
                headers: this.getHeaders(headers)
            }).pipe(
                catchError(this.handleError)
            )
        );
    }

    // PATCH request
    async patch<T>(endpoint: string, body: any, headers?: HttpHeaders): Promise<any> {
        return lastValueFrom(
            this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, { headers: this.getHeaders(headers) }).pipe(
                catchError(this.handleError)
            )
        );
    }

    // Error handler
    private handleError = (error: any) => {
        console.log('API Error:', error); // Log the error for debugging
        let errorMessage = 'Ocorreu um erro inesperado.';
        if (!!error?.error?.message) {
            errorMessage = error.error.message;
        }
        if (error?.status == 403) {
            errorMessage = 'Você não tem permissão para acessar este recurso.';
        }

        if (errorMessage == 'Não autorizado') {
            if (window.location.pathname.indexOf('admin') > -1) {
                this.router.navigate(['/area-administrativa'])
            } else {
                this.router.navigate(['/'])
            }
            this.sessao.clearSession();
        }

        return throwError(() => new Error(errorMessage));
    }

    getHeaders(headers: HttpHeaders = new HttpHeaders()): HttpHeaders {
        let token = this.sessao.getToken();
        if (!!token) headers = headers.append('authorization', token)
        return headers;
    }
    // LogDev
    logDev(...args: any) {
        if (isDevMode()) console.log(...args);
    }

    getPackageVersion() {
        let version = '0.0.0';
        try {
            version = packageJson.version;
            this.logDev('Version:', version);
        } catch (error) {
            this.logDev('Error loading version:', error);
        }
        return version;
    }

    dividirPagamento(total: number, parcelas: number): number[] {
        const totalEmCentavos = Math.round(total * 100);
        const valorBase = Math.floor(totalEmCentavos / parcelas);
        const resto = totalEmCentavos % parcelas;

        const resultado: number[] = [];

        for (let i = 0; i < parcelas; i++) {
            let valorParcela = valorBase;
            if (i === 0) {
                valorParcela += resto; // Só a primeira recebe os centavos extras
            }
            resultado.push(valorParcela / 100); // Converte de volta para reais
        }

        return resultado;
    }

    isCpfValido(cpf: string): boolean {
        cpf = cpf.replace(/[^\d]/g, ''); // Remove caracteres não numéricos
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
            return false; // Verifica se o CPF tem 11 dígitos e não é uma sequência repetida
        }
        const calcularDigito = (base: string, pesoInicial: number): number => {
            let soma = 0;
            for (let i = 0; i < base.length; i++) {
                soma += parseInt(base[i]) * (pesoInicial - i);
            }
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };

        const baseCpf = cpf.slice(0, 9);
        const digito1 = calcularDigito(baseCpf, 10);
        const digito2 = calcularDigito(baseCpf + digito1, 11);

        return cpf === baseCpf + digito1.toString() + digito2.toString();
    }

    scrollTop() {
        setTimeout(() => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 250);
    }

    delay(timer = 3000) {
        return new Promise(resolve => setTimeout(resolve, timer));
    }

}