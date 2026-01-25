import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    currentLang = signal<'fr' | 'ar'>('fr');

    constructor(private translateService: TranslateService) {
        registerLocaleData(localeFr);
        registerLocaleData(localeAr);

        this.translateService.setDefaultLang('fr');

        const savedLang = localStorage.getItem('preferredLang') as 'fr' | 'ar';
        const langToUse = savedLang || 'fr';

        this.setLanguage(langToUse);
    }

    setLanguage(lang: 'fr' | 'ar') {
        this.currentLang.set(lang);
        this.translateService.use(lang);
        localStorage.setItem('preferredLang', lang);
        this.updateLayoutDirection(lang);
    }

    private updateLayoutDirection(lang: 'fr' | 'ar') {
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = lang;

        if (dir === 'rtl') {
            document.body.classList.add('rtl');
        } else {
            document.body.classList.remove('rtl');
        }
    }
}
