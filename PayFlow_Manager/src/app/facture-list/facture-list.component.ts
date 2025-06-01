import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FactureService } from '../facture.service';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { formatCurrency } from '../config/currency.config';
import { AuthService } from '../services/auth.service';

interface Client {
  id: number;
  nom: string;  // Using nom to match backend
  email: string;
}

interface ApiResponse<T> {
  _embedded?: {
    clients?: T[];
    factures?: T[];
  };
  _links?: any;
  page?: any;
}

interface Facture {
  id: number;
  dateFacture: string;
  clientID: number;
  client: {
    id: number;
    nom: string;  // Changed from name to nom to match Client interface
    email: string;
  } | null;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  factureLignes?: any[];
}

@Component({
  selector: 'app-facture-list',
  templateUrl: './facture-list.component.html',
  styleUrls: ['./facture-list.component.css']
})
export class FactureListComponent implements OnInit {
  factures: Facture[] = [];
  clients: Client[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private factureService: FactureService,
    private router: Router,
    private route: ActivatedRoute,  // Add this line
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadFactures();
  }

  loadClients(): void {
    this.http.get<ApiResponse<Client> | Client[]>('http://localhost:8080/client-service/clients')
      .subscribe({
        next: (response) => {
          if ('_embedded' in response && response._embedded?.clients) {
            this.clients = response._embedded.clients;
          } else if (Array.isArray(response)) {
            this.clients = response;
          } else {
            this.clients = [];
          }
          console.log('Clients loaded:', this.clients);
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          this.error = 'Error loading clients';
        }
      });
  }

  getClientName(clientId: number): string {
    if (!clientId) return 'N/A';
    const client = this.clients.find(c => c.id === clientId);
    return client ? (client.nom) : `Client ${clientId}`;  // Check for both properties
}

  loadFactures(): void {
    this.loading = true;
    this.factureService.getFactures().subscribe({
      next: (response: any) => {
        console.log('Raw factures response:', response);
        
        if (response && response._embedded && response._embedded.factures) {
          this.factures = response._embedded.factures.map((f: any) => {
            // Extract ID from the self link
            const id = f._links?.self?.href ? 
              parseInt(f._links.self.href.split('/').pop()) : 0;
              
            return {
              id: id,
              dateFacture: f.dateFacture || '',
              clientID: f.clientID || 0,
              client: null, // Will be populated later if needed
              montantTotal: f.montantTotal || 0,
              montantPaye: f.montantPaye || 0,
              montantRestant: f.montantRestant || 0,
              factureLignes: f.factureLignes || []
            };
          });
          
          // Now try to match clients with factures
          // Update the client assignment in loadFactures method
          this.factures.forEach(facture => {
            if (facture.clientID) {
              const client = this.clients.find(c => c.id === facture.clientID);
              if (client) {
                facture.client = {
                  id: client.id,
                  nom: client.nom,  // Using nom consistently
                  email: client.email
                };
              }
            }
          });
        } else if (Array.isArray(response)) {
          // Handle array response if needed
          this.factures = response;
        }
        
        this.loading = false;
        console.log('Processed factures:', this.factures);
      },
      error: (error) => {
        console.error('Error loading factures:', error);
        this.error = 'Error loading factures';
        this.loading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  getRowColorClass(facture: Facture): string {
    if (facture.montantRestant === 0) {  // Changed from montantRestantAPayer
      return 'table-success';
    } else if (facture.montantPaye > 0) {  // Changed from montantPayer
      return 'table-warning';
    }
    return '';
  }

  navigateToAddFacture(): void {
    this.router.navigate(['/add-facture']);
  }

  modifierFacture(id: number) {
    this.router.navigate(['/factures/edit', id]);
  }

  voirReglements(id: number) {
    this.router.navigate(['/factures/payments', id]);
  }

  printFacture(id: number): void {
    this.router.navigate(['/factures/print', id]);
  }

  deleteFacture(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) {
      this.factureService.deleteFacture(id).subscribe({
        next: () => {
          this.loadFactures();
        },
        error: (error) => {
          console.error('Error deleting facture:', error);
          this.error = 'Erreur lors de la suppression de la facture';
        }
      });
    }
  }
}
