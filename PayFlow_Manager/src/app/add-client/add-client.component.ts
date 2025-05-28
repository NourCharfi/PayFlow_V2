import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientService } from '../services/client.service';
import { Client } from '../modal/client';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.css']
})
export class AddClientComponent implements OnInit {
  client: Client = {
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  };
  
  loading = false;
  error: string | null = null;
  isEditMode = false;
  clientId: number | null = null;

  constructor(
    private clientService: ClientService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.clientId = id;
      this.loadClient(id);
    }
  }

  loadClient(id: number): void {
    this.loading = true;
    this.clientService.getClient(id).subscribe({
      next: (client) => {
        this.client = client;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement du client. Veuillez réessayer plus tard.';
        this.loading = false;
        console.error('Error loading client:', err);
      }
    });
  }

  saveClient(): void {
    this.loading = true;
    this.error = null;
    
    if (!this.client.nom || !this.client.email) {
      this.error = 'Le nom et l\'email sont obligatoires';
      this.loading = false;
      return;
    }

    const operation = this.isEditMode && this.clientId
      ? this.clientService.updateClient(this.clientId, this.client)
      : this.clientService.createClient(this.client);

    operation.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/clients']);
      },
      error: (err) => {
        this.error = `Échec de ${this.isEditMode ? 'la modification' : 'l\'ajout'} du client. Veuillez réessayer plus tard.`;
        this.loading = false;
        console.error('Error saving client:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/clients']);
  }
}