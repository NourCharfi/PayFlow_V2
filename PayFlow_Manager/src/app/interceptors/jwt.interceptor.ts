import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const user = this.authService.currentUserValue;
    if (user && user.token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${user.token}`
        }
      });
    }
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.includes('/refreshToken')) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      return this.authService.refreshToken().pipe(
        switchMap(user => {
          this.isRefreshing = false;
          if (user) {
            const cloned = request.clone({
              setHeaders: { Authorization: `Bearer ${user.token}` }
            });
            return next.handle(cloned);
          }
          this.authService.logout();
          return throwError(() => new Error('Session expirée'));
        }),
        catchError(error => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }
    return next.handle(request);
  }
}
