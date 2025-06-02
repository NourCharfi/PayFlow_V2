import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../modal/product';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8080/produit-service/produits';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  private extractIdFromLink(link: string | undefined): number | undefined {
    if (!link) return undefined;
    const matches = link.match(/\/([^\/]+)$/);
    return matches ? parseInt(matches[1]) : undefined;
  }

  private mapToProduct(data: any): Product {
    // Extract the product ID from the self link if present
    const id = data.id || this.extractIdFromLink(data._links?.self?.href);
    
    // Map product name with fallbacks in order of preference
    let productName = null;
    
    // Helper function to check if a string is actually empty
    const isEmptyString = (str: string | null | undefined): boolean => {
      return !str || str.trim().length === 0;
    };
    
    // Try to get name from various possible properties
    if (data._embedded?.produit) {
      // Handle case where data is wrapped in _embedded
      const produit = data._embedded.produit;
      productName = [produit.nom, produit.name, produit.designation, produit.libelle]
        .find(name => !isEmptyString(name));
    } else {
      // Direct data object
      productName = [data.nom, data.name, data.designation, data.libelle]
        .find(name => !isEmptyString(name));
    }
    
    // Log for debugging
    console.log('Product name mapping:', {
      data,
      extractedName: productName,
      possibleNames: data._embedded?.produit ? {
        nom: data._embedded.produit.nom,
        name: data._embedded.produit.name,
        designation: data._embedded.produit.designation,
        libelle: data._embedded.produit.libelle
      } : {
        nom: data.nom,
        name: data.name, 
        designation: data.designation,
        libelle: data.libelle
      }
    });

    return {
      id: id,
      name: !isEmptyString(productName) ? productName : 'Produit sans nom',
      price: data.prix || data.price || 0,
      quantite: data.quantite || data.quantity || 0,
      description: data.description || ''
    };
  }
  
  getProducts(): Observable<Product[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        let products: any[] = [];
        if (response._embedded?.produits) {
          products = response._embedded.produits;
        } else if (Array.isArray(response)) {
          products = response;
        }
        return products.map(p => this.mapToProduct(p));
      }),
      tap({
        error: (error) => this.toastService.error(`Error fetching products: ${error.message}`)
      })
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapToProduct(response)),
      tap({
        error: (error) => this.toastService.error(`Error fetching product: ${error.message}`)
      })
    );
  }

  createProduct(product: any): Observable<Product> {
    const apiProduct = {
      ...product,
      quantity: product.quantite // Map frontend quantite to backend quantity
    };
    delete apiProduct.quantite;
    
    return this.http.post<Product>(this.apiUrl, apiProduct).pipe(
      tap({
        next: (newProduct) => this.toastService.success(`Successfully created product: ${newProduct.name}`),
        error: (error) => this.toastService.error(`Error creating product: ${error.message}`)
      })
    );
  }

  updateProduct(id: number, product: any): Observable<Product> {
    const apiProduct = {
      ...product,
      quantity: product.quantite // Map frontend quantite to backend quantity
    };
    delete apiProduct.quantite;
    
    return this.http.put<Product>(`${this.apiUrl}/${id}`, apiProduct).pipe(
      tap({
        next: (updatedProduct) => this.toastService.success(`Successfully updated product: ${updatedProduct.name}`),
        error: (error) => this.toastService.error(`Error updating product: ${error.message}`)
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => this.toastService.success('Successfully deleted product'),
        error: (error) => this.toastService.error(`Error deleting product: ${error.message}`)
      })
    );
  }
}