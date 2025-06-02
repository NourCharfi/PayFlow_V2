import { Component } from '@angular/core';
import { ThemeService } from '../services/theme.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-navbar',
    template: `
        <ng-container *ngIf="authService.isAuthenticated()">
            <nav class="navbar navbar-expand-lg">
                <div class="container-fluid">
                    <div class="d-flex" >
                        <a  class="navbar-brand" routerLink="/">
                            <i class="fas fa-money-bill-wave me-2"></i>
                            PayFlow Manager
                        </a>
                    </div>
                    
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>

                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/home" routerLinkActive="active">
                                    <i class="fas fa-home me-1"></i>
                                    Home
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/clients" routerLinkActive="active">
                                    <i class="fas fa-users me-1"></i>
                                    Clients
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/products" routerLinkActive="active">
                                    <i class="fas fa-box me-1"></i>
                                    Produits
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/factures" routerLinkActive="active">
                                    <i class="fas fa-file-invoice me-1"></i>
                                    Factures
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" routerLink="/reglement-list" routerLinkActive="active">
                                    <i class="fas fa-credit-card me-1"></i>
                                    Règlements
                                </a>
                            </li>
                    <!--      <li class="nav-item">
                                <a class="nav-link" routerLink="/users" routerLinkActive="active">
                                    <i class="fas fa-users me-1"></i>
                                    Utilisateurs
                                </a>
                            </li>
                    -->   
                        </ul>
                        <div class="d-flex align-items-center ms-auto">
                            <button class="btn btn-link nav-link me-3 theme-btn" (click)="themeService.toggleTheme()">
                                <i class="fas" [class.fa-sun]="!(themeService.darkMode$ | async)" [class.fa-moon]="themeService.darkMode$ | async"></i>
                            </button>
                            <span class="me-2">{{authService.currentUserValue?.username}}</span>
                            <button class="btn btn-link nav-link logout-btn" (click)="logout()">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        </ng-container>
        <ng-container *ngIf="!authService.isAuthenticated()">
            <!-- Navbar cachée si non authentifié -->
        </ng-container>
    `,
    styles: [`
        .navbar {
            box-shadow: 0 2px 4px rgba(0,0,0,.1);
            padding: 0.75rem 1.25rem;
            background: var(--bg-primary);
            border-bottom: 1px solid var(--border-color);
        }

        .navbar-brand {
            font-weight: 600;
            font-size: 1.25rem;
            color: var(--text-primary);
            transition: color 0.2s ease;
            padding: 0.5rem 0;
        }

        .navbar-brand:hover {
            color: var(--primary);
        }

        .nav-link {
            color: var(--text-secondary);
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            transition: all 0.2s ease;
            font-weight: 500;
            position: relative;
        }

        .nav-link:hover {
            color: var(--text-primary);
            background-color: var(--hover-bg);
        }

        .nav-link.active {
            color: var(--primary);
            background-color: var(--active-bg);
        }

        .nav-item {
            margin: 0 0.25rem;
        }

        .theme-btn {
            padding: 0.5rem;
            border-radius: 0.375rem;
            color: var(--text-secondary);
            transition: all 0.2s ease;
        }

        .theme-btn:hover {
            color: var(--text-primary);
            background-color: var(--hover-bg);
        }

        .navbar-toggler {
            border: none;
            padding: 0.5rem;
            color: var(--text-primary);
            background-color: transparent;
        }

        .navbar-toggler:focus {
            box-shadow: none;
            outline: none;
        }

        @media (max-width: 991.98px) {
            .navbar-collapse {
                margin-top: 1rem;
                padding: 1rem;
                background-color: var(--bg-secondary);
                border-radius: 0.5rem;
            }

            .nav-item {
                margin: 0.25rem 0;
            }

            .nav-link {
                padding: 0.75rem 1rem;
            }
        }
    `]
})
export class NavbarComponent {
    constructor(
        public themeService: ThemeService,
        public authService: AuthService,
        private router: Router,
    ) {
      this.authService.onLogout.subscribe(() => {
        if (this.router.url !== '/login') {
          this.router.navigate(['/login']);
        }
      });
    }

    logout() {
        this.authService.logout();
    }
}
