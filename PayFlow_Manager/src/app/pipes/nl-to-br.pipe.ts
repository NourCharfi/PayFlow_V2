import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'nlToBr'
})
export class NlToBrPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): any {
    if (!value) return '';
    const escaped = value.replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(escaped);
  }
}
