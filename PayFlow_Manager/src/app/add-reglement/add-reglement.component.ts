import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReglementService } from '../services/reglement.service';
import { Reglement, PaymentType } from '../modal/reglement';
import { FactureService } from '../facture.service';
import { formatCurrency } from '../config/currency.config';

@Component({
  selector: 'app-add-reglement',
  templateUrl: './add-reglement.component.html',
  styleUrls: ['./add-reglement.component.css']
})
export class AddReglementComponent implements OnInit {
  reglement: Reglement;
  factureId: number = 0;
  PaymentType = PaymentType; // For template access
  error: string | null = null;
  loading = false;
  maxAmount: number = 0;
  currentFacture: any = null;

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

  cancelAdd() {
    this.router.navigate(['/reglement-list', this.factureId]);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.factureId = +id;
        this.reglement.factureId = this.factureId;
        this.loadFactureDetails(this.factureId);
      } else {
        this.error = 'Invoice ID is required';
      }
    });
  }

  private loadFactureDetails(factureId: number) {
    this.factureService.getFacture(factureId).subscribe({
      next: (facture) => {
        if (!facture) {
          this.error = 'Facture non trouvée';
          return;
        }
        this.currentFacture = facture;
        this.maxAmount = facture.montantTotal - (facture.montantPaye || 0);
      },
      error: (err) => {
        this.error = 'Error loading invoice details';
      }
    });
  }

  addReglement() {
    this.error = null;
    this.loading = true;

    // Validate facture ID
    if (!this.factureId || this.factureId <= 0) {
      this.error = 'Valid invoice ID is required';
      this.loading = false;
      return;
    }

    // Validate inputs
    if (!this.reglement.dateReglement) {
      this.error = 'Payment date is required';
      this.loading = false;
      return;
    }

    if (!this.reglement.montant || this.reglement.montant <= 0) {
      this.error = 'Amount must be greater than 0';
      this.loading = false;
      return;
    }

    if (!this.reglement.type) {
      this.error = 'Payment type is required';
      this.loading = false;
      return;
    }

    // For CHEQUE or TRAITE, reference number is required
    if ((this.reglement.type === PaymentType.CHEQUE || this.reglement.type === PaymentType.TRAITE) && 
        !this.reglement.referenceNumber) {
      this.error = 'Reference number is required for this payment type';
      this.loading = false;
      return;
    }

    if (!this.currentFacture) {
      this.error = 'Invoice details not loaded';
      this.loading = false;
      return;
    }

    const montantRestant = this.currentFacture.montantTotal - (this.currentFacture.montantPaye || 0);
    if (this.reglement.montant > montantRestant) {
      this.error = `Le montant ne peut pas dépasser le montant restant (${formatCurrency(montantRestant)})`;
      this.loading = false;
      return;
    }

    // Prepare the payload
    const payload = {
      dateReglement: this.reglement.dateReglement,
      montant: this.reglement.montant,
      type: this.reglement.type,
      factureId: this.factureId,
      referenceNumber: this.reglement.referenceNumber || null
    };

    // Add the payment
    this.reglementService.addReglement(payload).subscribe({
      next: (response) => {
        console.log('Payment added successfully:', response);
        
        // Update facture amounts
        const updatedFacture = {
          ...this.currentFacture,
          montantPaye: (this.currentFacture.montantPaye || 0) + this.reglement.montant,
          montantRestant: this.currentFacture.montantTotal - ((this.currentFacture.montantPaye || 0) + this.reglement.montant)
        };
        
        this.factureService.updateFacture(this.factureId, updatedFacture).subscribe({
          next: () => {
            this.router.navigate(['/reglement-list', this.factureId]);
          },
          error: (err) => {
            console.error('Error updating invoice amounts:', err);
            this.error = 'Payment added but failed to update invoice amounts';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error adding payment:', err);
        this.error = err.error?.message || 'Failed to add payment';
        this.loading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }
}