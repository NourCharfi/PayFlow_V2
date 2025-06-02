import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title text-center mb-4">Connexion</h3>
              <div *ngIf="error" class="alert alert-danger" role="alert">{{error}}</div>
              <form (ngSubmit)="onSubmit()" #loginForm="ngForm" autocomplete="off" novalidate>
                <div class="mb-3">
                  <label for="username" class="form-label">Nom d'utilisateur</label>
                  <input type="text"
                         class="form-control"
                         id="username"
                         [(ngModel)]="username"
                         name="username"
                         #usernameField="ngModel"
                         required
                         autocomplete="username"
                         [class.is-invalid]="usernameField.invalid && usernameField.touched">
                  <div class="invalid-feedback" *ngIf="usernameField.invalid && usernameField.touched">
                    Le nom d'utilisateur est requis
                  </div>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Mot de passe</label>
                  <input type="password"
                         class="form-control"
                         id="password"
                         [(ngModel)]="password"
                         name="password"
                         #passwordField="ngModel"
                         required
                         autocomplete="current-password"
                         [class.is-invalid]="passwordField.invalid && passwordField.touched">
                  <div class="invalid-feedback" *ngIf="passwordField.invalid && passwordField.touched">
                    Le mot de passe est requis
                  </div>
                </div>
                <div class="d-grid">
                  <button type="submit"
                          class="btn btn-primary"
                          [disabled]="loading || loginForm.invalid">
                    {{loading ? 'Connexion...' : 'Se connecter'}}
                  </button>
                </div>
              
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error = '';
  returnUrl: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login(this.username, this.password)
      .pipe(first())
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: error => {
          this.error = error.error?.message || 'Échec de la connexion';
          this.loading = false;
        }
      });
  }
}

// Assurez-vous que FormsModule est importé dans AppModule pour utiliser ngModel dans les templates.
// import { FormsModule } from '@angular/forms';
