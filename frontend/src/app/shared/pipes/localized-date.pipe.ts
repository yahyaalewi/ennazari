import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'localizedDate',
    pure: false
})
export class LocalizedDatePipe implements PipeTransform {
    constructor(private translateService: TranslateService) { }

    transform(value: any, format: string = 'mediumDate'): any {
        if (!value) return '';

        const currentLang = this.translateService.currentLang || this.translateService.defaultLang;
        const locale = currentLang === 'ar' ? 'ar-SA' : 'fr-FR';

        const datePipe = new DatePipe(locale);
        return datePipe.transform(value, format);
    }
}
