import { Component, isDevMode, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from 'src/app/services/alert.service';
import { EndpointsService } from 'src/app/services/endpoints.service';
import html2pdf from 'html2pdf.js';

@Component({
    selector: 'app-cadastro-pessoa-modal',
    templateUrl: './cadastro-pessoa-modal.component.html',
    styleUrls: ['./cadastro-pessoa-modal.component.scss']
})
export class CadastroPessoaModalComponent implements OnInit {
    form: FormGroup;
    loading: boolean = false;
    loadingCep: boolean = false;
    loadingPdf: boolean = false;
    tipoPessoa: 'cpf' | 'cnpj' = 'cpf';
    cadastroRealizado: boolean = false;
    dadosAcesso: any = null;
    senhaDigitada: string = '';

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private endpointService: EndpointsService,
        private alertService: AlertService

    ) {
        this.form = this.fb.group({
            tipo_documento: this.fb.control('cpf', [Validators.required]),
            documento: this.fb.control('', [Validators.required]),
            nome_completo: this.fb.control('', [Validators.required]),
            razao_social: this.fb.control(''),
            email: this.fb.control('', [Validators.required, Validators.email]),
            telefone: this.fb.control('', [Validators.required]),
            cep: this.fb.control('', [Validators.required]),
            logradouro: this.fb.control('', [Validators.required]),
            numero: this.fb.control('', [Validators.required]),
            complemento: this.fb.control(''),
            cidade: this.fb.control('', [Validators.required]),
            estado: this.fb.control('', [Validators.required]),
            nome_usuario: this.fb.control('', [Validators.required]),
            username: this.fb.control('', [Validators.required, Validators.pattern(/^[a-z0-9]+$/)]),
            senha: this.fb.control('', [Validators.required, Validators.minLength(6)])
        });
    }

    ngOnInit(): void {
        this.form.get('tipo_documento')?.valueChanges.subscribe((tipo) => {
            this.tipoPessoa = tipo;
            this.updateValidators();
        });
        if (isDevMode()) {
            this.form.patchValue({
                tipo_documento: 'cpf',
                documento: '02581748206',
                nome_completo: 'Usuário de Teste',
                razao_social: '',
                email: 'teste@example.com',
                telefone: '11999999999',
                cep: '01001000',
                logradouro: 'Praça da Sé',
                numero: '100',
                complemento: 'Apto 101',
                cidade: 'São Paulo',
                estado: 'SP',
                nome_usuario: 'usuarioteste',
                username: 'usuarioteste',
                senha: '123456'
            });
        }
    }

    updateValidators(): void {
        const razaoSocialControl = this.form.get('razao_social');

        if (this.tipoPessoa === 'cnpj') {
            razaoSocialControl?.setValidators([Validators.required]);
        } else {
            razaoSocialControl?.clearValidators();
        }

        razaoSocialControl?.updateValueAndValidity();
    }

    sanitizeUsername(): void {
        const usernameControl = this.form.get('username');
        if (usernameControl) {
            let value = usernameControl.value || '';
            // Remove caracteres inválidos e converte para lowercase
            value = value.toLowerCase().replace(/[^a-z0-9]/g, '');
            usernameControl.setValue(value, { emitEvent: false });
        }
    }

    async buscarCep(): Promise<void> {
        const cep = this.form.get('cep')?.value?.replace(/\D/g, '');

        if (!cep || cep.length !== 8) {
            return;
        }

        this.loadingCep = true;
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                this.form.patchValue({
                    logradouro: data.logradouro,
                    cidade: data.localidade,
                    estado: data.uf,
                    complemento: data.complemento
                });
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            this.loadingCep = false;
        }
    }

    async onSubmit(): Promise<void> {
        if (this.form.invalid) {
            Object.keys(this.form.controls).forEach(key => {
                this.form.get(key)?.markAsTouched();
            });
            return;
        }
        this.loading = true;
        try {
            const formValue = this.form.value;
            this.senhaDigitada = formValue.senha; // Armazena a senha antes de enviar
            const response = await this.endpointService.addEmpresa(formValue);
            this.dadosAcesso = response;
            this.cadastroRealizado = true;
            this.alertService.showSuccess('Cadastro concluído com sucesso!');
        } catch (error: any) {
            this.alertService.showDanger(error)
        } finally {
            this.loading = false;
        }
    }

    async imprimirDados(): Promise<void> {
        this.loadingPdf = true;
        try {
            const element = document.getElementById('dados-acesso');
            if (!element) {
                throw new Error('Elemento não encontrado');
            }

            const opt: any = {
                margin: 10,
                filename: `dados-acesso-${this.dadosAcesso?.codigo_acesso || 'sistema'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Verifica se é mobile e se o navigator.share está disponível
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const canShare = 'share' in navigator && isMobile;

            if (canShare) {
                // Mobile com suporte a compartilhamento
                const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
                const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                    });
                    this.alertService.showSuccess('PDF compartilhado com sucesso!');
                } else {
                    // Fallback: baixar mesmo sendo mobile
                    await html2pdf().set(opt).from(element).save();
                    this.alertService.showSuccess('PDF baixado com sucesso!');
                }
            } else {
                // Desktop: baixa normalmente
                await html2pdf().set(opt).from(element).save();
                this.alertService.showSuccess('PDF baixado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.alertService.showDanger('Erro ao gerar PDF');
        } finally {
            this.loadingPdf = false;
        }
    }

    fecharModal(): void {
        this.activeModal.close({
            ...this.dadosAcesso,
            senha: this.senhaDigitada
        });
    }

    dismiss(): void {
        this.activeModal.dismiss();
    }
}
