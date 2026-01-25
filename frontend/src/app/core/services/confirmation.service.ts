import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
    title: string;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfirmationService {
    isOpen = signal(false);
    options = signal<ConfirmOptions>({ title: '', message: '' });

    private resolveFn: ((value: boolean) => void) | null = null;

    confirm(title: string, message: string): Promise<boolean> {
        this.options.set({ title, message });
        this.isOpen.set(true);

        return new Promise((resolve) => {
            this.resolveFn = resolve;
        });
    }

    resolve(result: boolean) {
        this.isOpen.set(false);
        if (this.resolveFn) {
            this.resolveFn(result);
            this.resolveFn = null;
        }
    }
}
