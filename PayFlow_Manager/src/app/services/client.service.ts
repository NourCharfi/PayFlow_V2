import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Client } from '../modal/client';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:8080/client-service/clients';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl).pipe(
      tap({
        error: (error) => this.toastService.error(`Error fetching clients: ${error.message}`)
      })
    );
  }

  getClient(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: (client) => this.toastService.success(`Successfully retrieved client: ${client.nom}`),
        error: (error) => this.toastService.error(`Error fetching client: ${error.message}`)
      })
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client).pipe(
      tap({
        next: (newClient) => this.toastService.success(`Successfully created client: ${newClient.nom}`),
        error: (error) => this.toastService.error(`Error creating client: ${error.message}`)
      })
    );
  }

  updateClient(id: number, client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, client).pipe(
      tap({
        next: (updatedClient) => this.toastService.success(`Successfully updated client: ${updatedClient.nom}`),
        error: (error) => this.toastService.error(`Error updating client: ${error.message}`)
      })
    );
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => this.toastService.success('Successfully deleted client'),
        error: (error) => this.toastService.error(`Error deleting client: ${error.message}`)
      })
    );
  }
}