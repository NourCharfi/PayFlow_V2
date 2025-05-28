import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    constructor(private toastr: ToastrService) {}

    success(message: string, title: string = 'Succès') {
        this.toastr.success(message, title, {
            timeOut: 3000,
            positionClass: 'toast-bottom-right',
            progressBar: true,
            closeButton: true
        });
    }

    error(message: string, title: string = 'Erreur') {
        this.toastr.error(message, title, {
            timeOut: 4000,
            positionClass: 'toast-bottom-right',
            progressBar: true,
            closeButton: true
        });
    }

    warning(message: string, title: string = 'Attention') {
        this.toastr.warning(message, title, {
            timeOut: 3500,
            positionClass: 'toast-bottom-right',
            progressBar: true,
            closeButton: true
        });
    }

    info(message: string, title: string = 'Information') {
        this.toastr.info(message, title, {
            timeOut: 3000,
            positionClass: 'toast-bottom-right',
            progressBar: true,
            closeButton: true
        });
    }
}
