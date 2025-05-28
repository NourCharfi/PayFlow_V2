import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Success') {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      positionClass: 'toast-top-right',
      tapToDismiss: true,
      toastClass: 'ngx-toastr custom-toast success-toast',
      titleClass: 'custom-toast-title',
      messageClass: 'custom-toast-message'
    });
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title, {
      timeOut: 4000,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      positionClass: 'toast-top-right',
      tapToDismiss: true,
      toastClass: 'ngx-toastr custom-toast error-toast',
      titleClass: 'custom-toast-title',
      messageClass: 'custom-toast-message'
    });
  }

  warning(message: string, title: string = 'Warning') {
    this.toastr.warning(message, title, {
      timeOut: 3500,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      positionClass: 'toast-top-right',
      tapToDismiss: true,
      toastClass: 'ngx-toastr custom-toast warning-toast',
      titleClass: 'custom-toast-title',
      messageClass: 'custom-toast-message'
    });
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      positionClass: 'toast-top-right',
      tapToDismiss: true,
      toastClass: 'ngx-toastr custom-toast info-toast',
      titleClass: 'custom-toast-title',
      messageClass: 'custom-toast-message'
    });
  }
}
