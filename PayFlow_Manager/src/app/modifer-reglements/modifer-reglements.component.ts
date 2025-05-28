import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReglementService } from '../services/reglement.service';
import { Reglement, PaymentType } from '../modal/reglement';
import { FactureService } from '../facture.service';
import { formatCurrency } from '../config/currency.config';

@Component({
  selector: 'app-modifer-reglements',
  templateUrl: './modifer-reglements.component.html',
  styleUrls: ['./modifer-reglements.component.css']
})
export class ModiferReglementsComponent implements OnInit {
  reglement: Reglement;
  reglementId: number = 0;
  error: string | null = null;
  loading = false;
  facture: any = null;
  PaymentType = PaymentType;

  constructor(
    private reglementService: ReglementService,
    private router: Router,
    private route: ActivatedRoute,
    private factureService: FactureService
  ) {
    this.reglement = new Reglement(
      new Date().toISOString().split('T')[0],
      0,
      PaymentType.ESPECE,
      0
    );
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.reglementId = +id;
        this.loadReglement(this.reglementId);
      } else {
        this.error = 'Payment ID is required';
      }
    });
  }

  loadReglement(id: number) {
    this.loading = true;
    this.error = null;
    this.reglementService.getReglementById(id).subscribe({
      next: (reglement) => {
        if (!reglement) {
          this.error = 'Payment not found';
          this.loading = false;
          return;
        }
        this.reglement = reglement;
        if (reglement.factureId) {
          this.loadFactureDetails(reglement.factureId);
        } else {
          this.error = 'No invoice associated with this payment';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Error loading payment';
        this.loading = false;
        console.error('Error loading payment:', err);
      }
    });
  }

  private loadFactureDetails(factureId: number) {
    this.factureService.getFacture(factureId).subscribe({
      next: (facture) => {
        if (!facture) {
          this.error = 'Facture non trouvée';
          this.loading = false;
          return;
        }
        this.facture = facture;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la facture';
        this.loading = false;
      }
    });
  }

  updateReglement() {
    if (!this.reglementId) {
      this.error = 'ID du règlement requis';
      return;
    }

    if (!this.reglement.dateReglement) {
      this.error = 'La date de règlement est requise';
      return;
    }

    if (!this.reglement.montant || this.reglement.montant <= 0) {
      this.error = 'Le montant doit être supérieur à 0';
      return;
    }

    if (!this.reglement.type) {
      this.error = 'Le type de paiement est requis';
      return;
    }

    if ((this.reglement.type === PaymentType.CHEQUE || this.reglement.type === PaymentType.TRAITE) && 
        !this.reglement.referenceNumber) {
      this.error = 'Le numéro de référence est requis pour ce type de paiement';
      return;
    }

    // Get the original payment to calculate the difference
    this.reglementService.getReglementById(this.reglementId).subscribe({
      next: (originalPayment) => {
        if (!originalPayment) {
          this.error = 'Original payment not found';
          return;
        }

        const payment: Reglement = {
          id: this.reglementId,
          dateReglement: this.reglement.dateReglement,
          montant: this.reglement.montant,
          type: this.reglement.type,
          factureId: this.reglement.factureId,
          referenceNumber: this.reglement.referenceNumber || ''
        };

        this.reglementService.updateReglement(this.reglementId, payment).subscribe({
          next: () => {
            // Update the facture's montantPaye
            const amountDifference = this.reglement.montant - (originalPayment?.montant || 0);
            
            this.factureService.getFacture(this.reglement.factureId).subscribe(facture => {
              const updatedFacture = {
                ...facture,
                montantPaye: (facture.montantPaye || 0) + amountDifference,
                montantRestant: facture.montantTotal - ((facture.montantPaye || 0) + amountDifference)
              };

              this.factureService.updateFacture(this.reglement.factureId, updatedFacture).subscribe({
                next: () => {
                  this.router.navigate(['/reglement-list']);
                },
                error: (err) => {
                  console.error('Error updating invoice amount:', err);
                  this.router.navigate(['/reglement-list']);
                }
              });
            });
          },
          error: (err) => {
            this.error = err.message || 'Failed to update payment. Please try again.';
            console.error('Error updating payment:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load original payment details';
        console.error('Error loading original payment:', err);
      }
    });
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  navigateToReglementList(): void {
    if (this.reglement?.factureId) {
      this.router.navigate(['/reglement-list', this.reglement.factureId]);
    } else {
      this.router.navigate(['/reglement-list']);
    }
  }
}


