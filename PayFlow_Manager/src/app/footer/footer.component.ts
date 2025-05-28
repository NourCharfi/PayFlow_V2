import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer mt-auto py-3">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-4">
            <span class="text-muted">© 2024 PayFlow Manager</span>
          </div>
          <div class="col-md-4 text-center">
            <div class="social-links">
              <a href="#" class="text-muted mx-2"><i class="fab fa-linkedin"></i></a>
              <a href="#" class="text-muted mx-2"><i class="fab fa-twitter"></i></a>
              <a href="#" class="text-muted mx-2"><i class="fab fa-github"></i></a>
            </div>
          </div>
          <div class="col-md-4 text-end">
            <span class="text-muted">Tous droits réservés</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      position: fixed;
      bottom: 0;
      width: 100%;
      z-index: 1000;
    }
    .social-links a {
      text-decoration: none;
      transition: color 0.3s ease;
    }
    .social-links a:hover {
      color: var(--primary-color) !important;
    }
  `]
})
export class FooterComponent {}
