import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  userForm: FormGroup;
  message: string = '';

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      roles: ['', Validators.required], // Saisie séparée par des virgules
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getUsers().subscribe({
      next: users => this.users = users,
      error: () => this.message = 'Erreur lors du chargement des utilisateurs.'
    });
  }

  addUser() {
    if (this.userForm.invalid) return;
    const { username, password, roles } = this.userForm.value;
    const rolesArray = roles.split(',').map((r: string) => r.trim());
    this.authService.addUser({ username, password, roles: rolesArray }).subscribe({
      next: () => {
        this.message = 'Utilisateur ajouté !';
        this.userForm.reset();
        this.loadUsers();
      },
      error: () => this.message = 'Erreur lors de l\'ajout.'
    });
  }
}
