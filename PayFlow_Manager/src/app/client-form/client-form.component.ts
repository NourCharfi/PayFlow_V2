import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { Client } from '../modal/client';  // Changed from models/client.model

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.css']
})
export class ClientFormComponent implements OnInit {
  client: Client = {
    id: undefined,  // Changed from 0 to undefined
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  };
  
  isEditMode = false;
  loading = false;
  error: string | null = null;

  constructor(
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.loadClient(+id);
    }
  }

  loadClient(id: number): void {
    this.loading = true;
    this.clientService.getClient(id).subscribe({
      next: (client) => {
        if (client) {
          this.client = client;
        } else {
          this.error = 'Client not found';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading client:', error);
        this.error = 'Error loading client. Please try again.';
        this.loading = false;
      }
    });
  }

  saveClient(): void {
    this.loading = true;
    this.error = null;

    if (!this.client.nom) {
      this.error = 'Name is required';
      this.loading = false;
      return;
    }

    if (!this.client.email) {
      this.error = 'Email is required';
      this.loading = false;
      return;
    }

    if (this.isEditMode && this.client.id !== undefined) {  // Added check for undefined
      this.clientService.updateClient(this.client.id, this.client).subscribe({
        next: () => {
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Error updating client:', error);
          this.error = 'Error updating client. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.clientService.createClient(this.client).subscribe({
        next: () => {
          this.router.navigate(['/clients']);
        },
        error: (error) => {
          console.error('Error creating client:', error);
          this.error = 'Error creating client. Please try again.';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}