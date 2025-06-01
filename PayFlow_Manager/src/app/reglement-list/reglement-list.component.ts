import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { ReglementService } from '../services/reglement.service';
import { PaymentType, Reglement } from '../modal/reglement';
import { FactureService } from '../facture.service';
import { AuthService } from '../services/auth.service';

interface Facture {
  id: number;
  dateFacture: string;
  clientID: number;
  client?: {
    id: number;
    nom: string;
    email: string;
  };
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  factureLignes?: any[];
}

@Component({
  selector: 'app-reglement-list',
  templateUrl: './reglement-list.component.html',
  styleUrls: ['./reglement-list.component.css']
})
export class ReglementListComponent implements OnInit, OnDestroy {
  reglements: Reglement[] = [];
  factureId: number | null = null;
  loading = false;
  error: string | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private reglementService: ReglementService,
    private factureService: FactureService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.factureId = +id;
        this.loadReglementsByFacture(this.factureId);
      } else {
        this.loadAllReglements();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadAllReglements() {
    this.loading = true;
    this.error = null;
    this.subscription = this.reglementService.getReglements().subscribe({
      next: (reglements: Reglement[]) => {
        this.reglements = reglements;
        
        // Now fetch facture objects for each payment
        const factureObservables = reglements.map(payment => {
          if (payment.factureId) {
            return this.factureService.getFacture(payment.factureId);
          }
          return of(null);
        });
        
        if (factureObservables.length > 0) {
          forkJoin(factureObservables).subscribe((factures: (Facture | null)[]) => {
            this.reglements.forEach((reglement, index) => {
              const facture = factures[index];
              if (facture) {
                reglement.factureId = facture.id;
              }
            });
          });
        }
        
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'Failed to load payments. Please try again later.';
        this.loading = false;
        console.error('Error loading payments:', error);
      }
    });
  }

  private loadReglementsByFacture(factureId: number) {
    console.log('Starting to load payments for invoice ID:', factureId);
    this.loading = true;
    this.error = null;
    this.subscription = this.reglementService.getReglementsForFacture(factureId).subscribe({
      next: (reglements: Reglement[]) => {
        this.reglements = reglements;
        console.log('Filtered payments for invoice ID:', this.reglements);
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'Failed to load payments. Please try again later.';
        this.loading = false;
        console.error('Error loading payments:', error);
      }
    });
  }

  navigateToAddReglement() {
    if (this.factureId) {
      this.router.navigate(['/add-reglement', this.factureId]);
    } else {
      this.router.navigate(['/add-reglement']);
    }
  }

  modifierReglement(id: number | undefined) {
    if (id) {
      this.router.navigate(['/modifier-reglement', id]);
    }
  }

  supprimerReglement(id: number | undefined) {
    if (!id) return;
    
    if (confirm('Are you sure you want to delete this payment?')) {
      this.reglementService.deleteReglement(id).subscribe({
        next: () => {
          // Refresh the list after deletion
          if (this.factureId) {
            this.loadReglementsByFacture(this.factureId);
          } else {
            this.loadAllReglements();
          }
        },
        error: (error: Error) => {
          this.error = error.message || 'Failed to delete payment. Please try again later.';
          console.error('Error deleting payment:', error);
        }
      });
    }
  }
}
