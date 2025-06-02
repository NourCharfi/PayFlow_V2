import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Reglement } from '../modal/reglement';
import { ToastService } from './toast.service';
import { formatCurrency } from '../config/currency.config';

@Injectable({
  providedIn: 'root'
})
export class ReglementService {
  private apiUrl = 'http://localhost:8080/reglement-service/reglements';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  getReglements(): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(this.apiUrl).pipe(
      tap(
        (reglements) => {
        },
        (error) => {
          this.toastService.error('Failed to load payments: ' + (error.error?.message || error.message));
        }
      )
    );
  }

  getReglementsForFacture(factureId: number): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(`${this.apiUrl}/facture/${factureId}`).pipe(
      tap(
        (reglements) => {
          this.toastService.success(`Payments for invoice #${factureId} loaded successfully`);
        },
        (error) => {
          this.toastService.error(`Failed to load payments for invoice #${factureId}: ${error.error?.message || error.message}`);
        }
      )
    );
  }

  getReglementById(id: number): Observable<Reglement> {
    return this.http.get<Reglement>(`${this.apiUrl}/${id}`);
  }

  addReglement(reglement: Reglement): Observable<Reglement> {
    return this.http.post<Reglement>(this.apiUrl, reglement).pipe(
      tap(
        (newReglement) => {
          const type = reglement.type.toLowerCase();
          const ref = reglement.referenceNumber ? ` (Ref: ${reglement.referenceNumber})` : '';
          this.toastService.success(`${type} payment of ${formatCurrency(reglement.montant)} added successfully${ref}`);
        },
        (error) => {
          this.toastService.error(`Failed to add payment: ${error.error?.message || error.message}`);
        }
      )
    );
  }

  updateReglement(id: number, reglement: Reglement): Observable<Reglement> {
    return this.http.put<Reglement>(`${this.apiUrl}/${id}`, reglement).pipe(
      tap(
        (updatedReglement) => {
          const type = reglement.type.toLowerCase();
          const ref = reglement.referenceNumber ? ` (Ref: ${reglement.referenceNumber})` : '';
          this.toastService.success(`${type} payment #${id} of ${formatCurrency(reglement.montant)} updated successfully${ref}`);
        },
        (error) => {
          this.toastService.error(`Failed to update payment #${id}: ${error.error?.message || error.message}`);
        }
      )
    );
  }

  deleteReglement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(
        () => {
          this.toastService.success(`Payment #${id} deleted successfully`);
        },
        (error) => {
          this.toastService.error(`Failed to delete payment #${id}: ${error.error?.message || error.message}`);
        }
      )
    );
  }
}
