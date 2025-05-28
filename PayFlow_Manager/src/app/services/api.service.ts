import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, Payment, Client, Product } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Base URLs for your microservices through the gateway
  private reglementUrl = 'http://localhost:8080/reglement-service/reglements';
  private factureUrl = 'http://localhost:8080/facture-service/factures';
  private clientUrl = 'http://localhost:8080/client-service/clients';
  private produitUrl = 'http://localhost:8080/produit-service/produits';

  constructor(private http: HttpClient) { }

  // Client service methods
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientUrl);
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.clientUrl}/${id}`);
  }

  // Product service methods
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.produitUrl);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.produitUrl}/${id}`);
  }

  // Invoice service methods
  getInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.factureUrl);
  }

  getInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.factureUrl}/${id}`);
  }

  getFullInvoice(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.factureUrl}/full-facture/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.http.post<Invoice>(this.factureUrl, invoice);
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.http.put<Invoice>(`${this.factureUrl}/${id}`, invoice);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.factureUrl}/${id}`);
  }

  // Payment service methods
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.reglementUrl);
  }

  getPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.reglementUrl}/${id}`);
  }

  getFullPayment(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.reglementUrl}/full-reglement/${id}`);
  }

  createPayment(payment: Payment): Observable<Payment> {
    return this.http.post<Payment>(this.reglementUrl, payment);
  }

  updatePayment(id: number, payment: Payment): Observable<Payment> {
    return this.http.put<Payment>(`${this.reglementUrl}/${id}`, payment);
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.reglementUrl}/${id}`);
  }
}