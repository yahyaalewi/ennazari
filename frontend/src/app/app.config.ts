import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

registerLocaleData(localeFr);
registerLocaleData(localeAr);

// Custom loader to avoid constructor version issues
export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) { }
  getTranslation(lang: string): Observable<any> {
    // Using absolute path to ensure translations load on sub-routes
    return this.http.get(`/assets/i18n/${lang}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr' }, // Default locale
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: CustomTranslateLoader,
          deps: [HttpClient]
        },
        defaultLanguage: 'fr'
      })
    )
  ]
};
