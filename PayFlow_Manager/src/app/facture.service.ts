import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ToastService } from './services/toast.service';

const API_BASE_URL = 'http://localhost:8080/facture-service'; // Gateway URL

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  getFactures(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/factures`).pipe(
      tap({
        error: (error) => this.toastService.error(`Error fetching invoices: ${error.message}`)
      })
    );
  }

  getFacture(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/full-facture/${id}`).pipe(
      tap({
        next: (facture) => {
          const clientName = facture.client?.nom || 'Unknown Client';
        },
        error: (error) => this.toastService.error(`Error fetching invoice: ${error.message}`)
      })
    );
  }

  updateFacture(id: number, facture: any): Observable<any> {
    const headers = new HttpHeaders({'Content-Type': 'application/json'});
    return this.http.put<any>(`${API_BASE_URL}/factures/${id}`, facture, { headers }).pipe(
      tap({
        next: (updatedFacture) => this.toastService.success('Successfully updated invoice'),
        error: (error) => {
          const message = error.error?.message || error.message || 'Unknown error';
          this.toastService.error(`Error updating invoice: ${message}`);
        }
      })
    );
  }

  addFacture(facture: any): Observable<any> {
    return this.http.post<any>(`${API_BASE_URL}/factures`, facture).pipe(
      tap({
        next: (newFacture) => this.toastService.success('Successfully created new invoice'),
        error: (error) => {
          const message = error.error?.message || error.message || 'Unknown error';
          this.toastService.error(`Error creating invoice: ${message}`);
        }
      })
    );
  }

  deleteFacture(id: number): Observable<any> {
    return this.http.delete<any>(`${API_BASE_URL}/factures/${id}`).pipe(
      tap({
        next: () => this.toastService.success('Successfully deleted invoice'),
        error: (error) => {
          const message = error.error?.message || error.message || 'Unknown error';
          this.toastService.error(`Error deleting invoice: ${message}`);
        }
      })
    );
  }

  // Helper method to format the facture payload according to the required structure
  private formatFacturePayload(facture: any): any[] {
    // Create facture lines with the required structure
    const factureLignes = facture.lignes?.map((ligne: any) => ({
      id: ligne.id || null,
      produitID: ligne.produitId || ligne.produitID || null,
      quantity: ligne.quantite || ligne.quantity || 0,
      price: ligne.prixUnitaire || ligne.price || 0,
      produit: null,
      total: (ligne.quantite || ligne.quantity || 0) * (ligne.prixUnitaire || ligne.price || 0)
    })) || [];

    // Create the formatted payload
    return [{
      id: facture.id || facture.idF || null,
      dateFacture: facture.dateFacture || facture.date || null,
      client: null,
      clientID: facture.clientID || facture.clientId || null,
      factureLignes: factureLignes,
      montantTotal: facture.montantTotal || facture.montant || 0,
      montantPaye: facture.montantPaye || facture.montantPayer || 0,
      montantRestant: facture.montantRestant || facture.montantRestantAPayer || 0
    }];
  }
}