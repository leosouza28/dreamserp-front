import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appNextOnEnter]'
})
export class NextOnEnterDirective {

    constructor(private el: ElementRef) { }

    @HostListener('keydown.enter', ['$event'])
    onEnter(event: KeyboardEvent): void {
        // Previne o comportamento padrão (submit do formulário)
        event.preventDefault();
        event.stopPropagation();

        const element = this.el.nativeElement;
        const allInputs = this.getAllFocusableElements();
        const currentIndex = allInputs.indexOf(element);

        if (currentIndex > -1 && currentIndex < allInputs.length - 1) {
            const nextElement: any = allInputs[currentIndex + 1];
            nextElement.focus();

            // Se for um input de texto, seleciona o conteúdo
            if (nextElement?.select) {
                nextElement.select();
            }
        }
    }

    private getAllFocusableElements(): HTMLElement[] {
        const selector = 'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button:not([disabled])';
        const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

        // Filtra apenas elementos visíveis
        return elements.filter(el => {
            return el.offsetWidth > 0 &&
                el.offsetHeight > 0 &&
                window.getComputedStyle(el).visibility !== 'hidden';
        });
    }

}
