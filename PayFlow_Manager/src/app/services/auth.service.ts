import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface User {
  username: string;
  roles: string[];
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  roles: string[];
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8080/authentification-service';
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser: Observable<User | null> = this.currentUserSubject.asObservable();
  private refreshTokenTimeout: any;

  public onLogout: EventEmitter<void> = new EventEmitter<void>();

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<User> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      map(response => {
        console.log('[AUTH] Access token reçu:', response.access_token);
        console.log('[AUTH] Refresh token reçu:', response.refresh_token);
        const user: User = {
          username: username,
          roles: response.roles,
          token: response.access_token,
          refreshToken: response.refresh_token,
          expiresIn: response.expires_in,
        };
        // Log pour vérification stockage
        console.log('[AUTH] Objet user AVANT stockage:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Vérification immédiate après stockage
        const stored = localStorage.getItem('currentUser');
        console.log('[AUTH] Valeur BRUTE dans localStorage:', stored);
        console.log('[AUTH] user et localStorage sont identiques ?', JSON.stringify(user) === stored);
        this.currentUserSubject.next(user);
        this.startRefreshTokenTimer(user);
        return user;
      })
    );
    
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.stopRefreshTokenTimer();
    this.onLogout.emit();
  }

  refreshToken(): Observable<User | null> {
    const user = this.currentUserValue;
    if (!user?.refreshToken) return of(null);
    
    return this.http.get<AuthResponse>(`${this.apiUrl}/users/refreshToken`, {
      headers: { Authorization: `Bearer ${user.refreshToken}` }
    }).pipe(
      map(response => {
        if (user) {
          user.token = response.access_token;
          user.refreshToken = response.refresh_token;
          user.expiresIn = response.expires_in;
      
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          this.startRefreshTokenTimer(user);
          return user;
        }
        
        return null;
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private startRefreshTokenTimer(user: User) {
    this.stopRefreshTokenTimer();
    const expiresIn = user.expiresIn ?? 60; // Valeur par défaut 60 secondes si non défini
    const expires = new Date(Date.now() + (expiresIn * 1000));
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user && !!user.token;
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user?.roles?.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  // Ajout d'un nouvel utilisateur
  addUser(newUser: { username: string; password: string; roles: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, newUser);
  }

  // Récupération de la liste des utilisateurs
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }
}
