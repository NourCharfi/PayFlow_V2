import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FactureService } from '../facture.service';
import { Facture } from '../models/facture.interface';
import { ClientService } from '../services/client.service';
import { formatCurrency } from '../config/currency.config';

@Component({
  selector: 'app-print-facture',
  templateUrl: './print-facture.component.html',
  styleUrls: ['./print-facture.component.css']
})
export class PrintFactureComponent implements OnInit {
  facture: Facture | null = null;
  error: string | null = null;
  loading = true;
  tvaRate = 0.20; // 20% TVA

  constructor(
    private route: ActivatedRoute,
    private factureService: FactureService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadFacture(id);
      }
    });
  }

  loadFacture(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.factureService.getFacture(id).subscribe({
      next: (factureData: any) => {
        console.log('Full facture response:', factureData);
        
        try {
          // We don't need to handle _embedded anymore since we're using full-facture endpoint
          if (!factureData?.id) {
            throw new Error('Format de données invalide');
          }

          // The client data should already be present in the response
          this.facture = {
            id: factureData.id,
            dateFacture: factureData.dateFacture,
            clientID: factureData.clientID,
            // Use the client data directly from the response
            client: factureData.client || {
              id: factureData.clientID,
              nom: 'Client non spécifié',
              email: '',
              telephone: '',
              adresse: ''
            },
            factureLignes: factureData.factureLignes?.map((line: any) => ({
              ...line,
              // Ensure the produit data is properly mapped if present
              produit: line.produit || null,
              description: line.description || line.produit?.name || 'Sans description'
            })) || [],
            montantTotal: factureData.montantTotal || 0,
            montantPaye: factureData.montantPaye || 0,
            montantRestant: factureData.montantRestant || factureData.montantTotal || 0
          };

          this.loading = false;
          
          // Give the template a moment to render before printing
          setTimeout(() => {
            window.print();
          }, 500);
        } catch (e) {
          console.error('Data transformation error:', e);
          this.error = 'Erreur lors du traitement des données';
          this.loading = false;
        }
      },
      error: (err: any) => {
        console.error('Error loading facture:', err);
        this.error = 'Erreur lors du chargement de la facture';
        this.loading = false;
      }
    });
  }

  calculateHT(montantTTC: number): number {
    return montantTTC / (1 + this.tvaRate);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatNumber(num: number): string {
    return formatCurrency(num).replace(/[€\s]/g, '');
  }

  formatCurrency(num: number): string {
    return formatCurrency(num);
  }

  getDueDateFromInvoiceDate(dateFacture: string): string {
    if (!dateFacture) return '';
    const date = new Date(dateFacture);
    date.setDate(date.getDate() + 30);
    return this.formatDate(date.toISOString());
  }
}
