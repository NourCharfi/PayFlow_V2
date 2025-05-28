import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User, Role } from '../../models/user';

@Component({
  selector: 'app-user-management',
  template: `
    <div class="container mt-4">
      <h2>User Management</h2>
      <div *ngIf="error" class="alert alert-danger">{{error}}</div>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{user.username}}</td>
              <td>{{user.email}}</td>
              <td>{{user.roles.join(', ')}}</td>
              <td>
                <div class="btn-group">                  <button class="btn btn-sm btn-outline-primary" 
                          (click)="toggleRole(user, Role.ADMIN)"
                          [class.active]="user.roles.includes(Role.ADMIN)">
                    Admin
                  </button>
                  <button class="btn btn-sm btn-outline-primary"
                          (click)="toggleRole(user, Role.MANAGER)"
                          [class.active]="user.roles.includes(Role.MANAGER)">
                    Manager
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  error = '';
  Role = Role; // Make Role enum available in template

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (users: User[]) => this.users = users,
      error: (err: any) => this.error = 'Failed to load users'
    });
  }

  toggleRole(user: User, role: Role) {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter(r => r !== role)
      : [...user.roles, role];

    this.authService.updateUserRoles(user.id, newRoles).subscribe({
      next: (updatedUser: User) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
      },
      error: (err: any) => this.error = 'Failed to update user roles'
    });
  }
}