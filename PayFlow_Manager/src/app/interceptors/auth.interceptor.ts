import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    constructor(private authService: AuthService) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip interception for login and refresh token requests
        if (request.url.includes('/login') || request.url.includes('/refreshToken')) {
            return next.handle(request);
        }

        const user = this.authService.currentUserValue;
        if (user?.token) {
            request = this.addToken(request, user.token);
        }

        return next.handle(request).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    return this.handle401Error(request, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string) {
        return request.clone({
            setHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
                switchMap(user => {
                    this.isRefreshing = false;
                    if (user) {
                        this.refreshTokenSubject.next(user.token);
                        return next.handle(this.addToken(request, user.token));
                    }
                    this.authService.logout();
                    return throwError(() => new Error('Session expired'));
                }),
                catchError(err => {
                    this.isRefreshing = false;
                    this.authService.logout();
                    return throwError(() => err);
                })
            );
        }

        return this.refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(token => {
                return next.handle(this.addToken(request, token));
            })
        );
    }
}
