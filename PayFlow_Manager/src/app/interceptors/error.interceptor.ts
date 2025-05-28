import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private authService: AuthService,
        private toastr: ToastrService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                let errorMessage = 'An error occurred';
                
                if (error.error instanceof ErrorEvent) {
                    // Client-side error
                    errorMessage = error.error.message;
                } else {
                    // Server-side error
                    switch (error.status) {
                        case 400:
                            errorMessage = error.error?.message || 'Bad Request';
                            break;
                        case 401:
                            errorMessage = 'Unauthorized';
                            // Auto logout if 401 response returned from api
                            if (!request.url.includes('auth/login')) {
                                this.authService.logout();
                            }
                            break;
                        case 403:
                            errorMessage = 'Access Denied';
                            break;
                        case 404:
                            errorMessage = 'Resource Not Found';
                            break;
                        case 500:
                            errorMessage = 'Internal Server Error';
                            break;
                        default:
                            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
                    }
                }

                this.toastr.error(errorMessage, 'Error');
                return throwError(() => new Error(errorMessage));
            })
        );
    }
}
