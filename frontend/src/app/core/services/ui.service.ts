import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UiService {
    showSplash = signal(false); // Default to false, App will set to true initially if needed, or we handle logic here

    constructor() {
        // Initial splash
        this.triggerSplash();
    }

    triggerSplash() {
        this.showSplash.set(true);
        setTimeout(() => {
            this.showSplash.set(false);
        }, 2000);
    }
}
