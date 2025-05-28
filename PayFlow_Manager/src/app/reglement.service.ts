import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reglement } from './modal/reglement';

@Injectable({
  providedIn: 'root'
})
export class ReglementService {
  private apiUrl = 'http://localhost:8080/reglement-service/reglements';

  constructor(private http: HttpClient) {}

  getReglements(): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(this.apiUrl);
  }

  getReglementsForFacture(factureId: number): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(`${this.apiUrl}/factures/${factureId}`);
  }

  getReglementById(id: number): Observable<Reglement> {
    return this.http.get<Reglement>(`${this.apiUrl}/${id}`);
  }

  addReglement(reglement: Reglement): Observable<Reglement> {
    return this.http.post<Reglement>(this.apiUrl, reglement);
  }

  updateReglement(id: number, reglement: Reglement): Observable<Reglement> {
    return this.http.put<Reglement>(`${this.apiUrl}/${id}`, reglement);
  }

  deleteReglement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}