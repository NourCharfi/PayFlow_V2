import { Component } from '@angular/core';

@Component({
  selector: 'app-register',
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title text-center mb-4">Register</h3>
              <form>
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" required>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" required>
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">
                    Register
                  </button>
                </div>
                <div class="text-center mt-3">
                  <a routerLink="/login">Already have an account? Login</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {}