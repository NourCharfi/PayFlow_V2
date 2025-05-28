// src/app/add-facture/add-facture.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FactureService } from '../facture.service';
import { Facture } from '../modal/facture';
import { HttpClient } from '@angular/common/http';
import { formatDate } from '@angular/common';
import { StatisticsService } from '../services/statistics.service';

interface Client {
  id: number;
  nom: string;  // Use 'nom' consistently as that's what the backend returns
  email: string;
}

interface FactureLine {
  produitID: number | null;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantTotal: number;
  maxQuantite?: number | null;
  produit?: any;
}

interface Product {
  id: number;
  name: string;  // Changed from 'nom' to 'name' to match API response
  price: number;  // Changed from 'price' to 'price' to match API response
  quantite: number;
}

@Component({
  selector: 'app-add-facture',
  templateUrl: './add-facture.component.html',
  styleUrls: ['./add-facture.component.css']
})
export class AddFactureComponent implements OnInit {
  nouvelleFacture: Facture = {
    idF: undefined,
    date: '',
    clientId: undefined,  // Changed from 'client' to 'clientId'
    montant: 0,
    montantRestantAPayer: 0,
    montantPayer: 0
  };
  
  clients: Client[] = [];
  factureLines: FactureLine[] = [];
  products: Product[] = [];
  productStats: any = {};

  constructor(
    private factureService: FactureService, 
    private router: Router,
    private http: HttpClient,
    private statisticsService: StatisticsService  // Ajout de cette injection
) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.nouvelleFacture.date = today;
    this.loadClients();
    this.loadProducts();
    this.addLine();
    this.loadProductStats();
  }
  
  loadClients(): void {
    this.http.get<any>('http://localhost:8080/client-service/clients')
      .subscribe({
        next: (response) => {
          console.log('Raw clients response:', response); // Add this line
          if (response && Array.isArray(response)) {
            this.clients = response;
          } else if (response && response._embedded && response._embedded.clients) {
            this.clients = response._embedded.clients;
          } else {
            console.warn('Unexpected clients response format:', response);
            this.clients = [];
          }
          console.log('Processed clients:', this.clients);
        },
        error: (error) => {
          console.error('Error loading clients:', error);
          // Log more detailed error information
          if (error.error) {
            console.error('Server error details:', error.error);
          }
          this.clients = [
            { id: 1, nom: 'Client 1', email: 'client1@example.com' },
            { id: 2, nom: 'Client 2', email: 'client2@example.com' }
          ];
        }
      });
  }
  
  loadProducts(): void {
    console.log('Loading products...');
    this.http.get<any>('http://localhost:8080/produit-service/produits')
      .subscribe({
        next: (response) => {
          console.log('Raw products response:', response); // Add this line
          if (response && Array.isArray(response)) {
            this.products = response;
          } else if (response && response._embedded && response._embedded.produits) {
            this.products = response._embedded.produits;
          } else {
            console.warn('Unexpected products response format:', response);
            this.products = [];
          }
          console.log('Processed products:', this.products);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          // Log more detailed error information
          if (error.error) {
            console.error('Server error details:', error.error);
          }
          this.products = [
            { id: 1, name: 'Product 1', price: 100, quantite: 50 },
            { id: 2, name: 'Product 2', price: 200, quantite: 20 }
          ];
        }
      });
  }
 
  addLine(): void {
    this.factureLines.push({
      produitID: null,
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      montantTotal: 0,
      maxQuantite: null  // Initialize with null instead of 0
    });
    this.calculateTotal();
  }

  loadProductStats(): void {
    this.statisticsService.getStatisticsData().subscribe({
      next: (data: any) => {
        const stats = this.statisticsService.getBestSellingProducts(data);
        this.productStats = stats.reduce((acc: { [key: number]: number }, stat: any) => {
          acc[stat.productId] = stat.totalQuantity;
          return acc;
        }, {});
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des statistiques:', err);
      }
    });
  }

  onProductSelect(index: number): void {
    const line = this.factureLines[index];
    if (!line) return;

    // Reset line values first
    line.description = '';
    line.prixUnitaire = 0;
    line.quantite = 0;
    line.montantTotal = 0;

    // Handle product selection
    if (line.produitID !== undefined && line.produitID !== null) {
      const product = this.products.find(p => p.id === Number(line.produitID));
      if (product) {
        // Update line with product details
        line.description = product.name;
        line.prixUnitaire = Number(product.price) || 0;
        
        // Get available stock - using only quantite property
        const availableStock = Number(product.quantite) || 0;
        
        // Set default quantity to 1 if stock is available
        if (availableStock > 0) {
          line.quantite = 1;
        }

        console.log('Product selected:', product);
        console.log('Updated line:', line);

        // Let validateQuantity handle the stock check and recalculation
        this.validateQuantity(index);
      } else {
        console.warn(`Product not found for ID: ${line.produitID}`);
        this.calculateTotal();
      }
    } else {
      this.calculateTotal(); // Recalculate total when product is cleared
    }
  }

  validateQuantity(index: number): void {
    const line = this.factureLines[index];
    if (!line) return;

    // Convert to number and ensure it's valid
    let quantity = Number(line.quantite);
    if (isNaN(quantity) || quantity < 0) {
      quantity = 0;
      line.quantite = 0;
    }

    // Check against available stock if we have the product
    const product = line.produitID ? this.products.find(p => p.id === Number(line.produitID)) : null;
    if (product) {
      // Calculate available stock considering sold quantities
      const soldQuantity = this.productStats[product.id] || 0;
      const availableStock = Math.max(0, product.quantite - soldQuantity);
      
      if (quantity > availableStock) {
        quantity = availableStock;
        line.quantite = availableStock;
        console.warn(`Quantity adjusted to available stock: ${availableStock} (Total: ${product.quantite}, Sold: ${soldQuantity})`);
      }
    }

    // Recalculate line total
    this.calculateLineTotal(index);
  }

  calculateLineTotal(index: number): void {
    const line = this.factureLines[index];
    if (line) {
      // Convert strings to numbers and handle invalid values
      const quantity = Number(line.quantite);
      const price = Number(line.prixUnitaire);
      
      // Only update if both values are valid numbers
      if (!isNaN(quantity) && !isNaN(price)) {
        line.montantTotal = Number((quantity * price).toFixed(2));
        console.log(`Line ${index} total calculated:`, {
          quantity,
          price,
          total: line.montantTotal
        });
      } else {
        line.montantTotal = 0;
        console.warn(`Invalid values for line ${index}:`, { quantity, price });
      }
      
      // Make sure we have a valid number
      if (isNaN(line.montantTotal)) {
        line.montantTotal = 0;
      }
      
      this.calculateTotal(); // Update the total immediately
    }
  }
  
  calculateTotal(): void {
    let total = 0;
    
    // Sum up all valid line totals - don't recalculate them here
    this.factureLines.forEach(line => {
      if (line && !isNaN(line.montantTotal)) {
        total += line.montantTotal;
      }
    });
    
    // Round to 2 decimal places
    total = Number(total.toFixed(2));
    
    // Update invoice totals
    this.nouvelleFacture.montant = total;
    this.nouvelleFacture.montantRestantAPayer = total;
    this.nouvelleFacture.montantPayer = 0;

    console.log('Invoice totals updated:', {
      total: this.nouvelleFacture.montant,
      remaining: this.nouvelleFacture.montantRestantAPayer,
      paid: this.nouvelleFacture.montantPayer,
      lines: this.factureLines.map(l => ({
        quantity: l.quantite,
        price: l.prixUnitaire,
        lineTotal: l.montantTotal
      }))
    });
    
    console.log('Invoice totals calculated:', {
      total,
      lines: this.factureLines.map(l => ({
        quantity: l.quantite,
        price: l.prixUnitaire,
        lineTotal: l.montantTotal
      }))
    });
  }

  removeLine(index: number): void {
    this.factureLines.splice(index, 1);
    this.calculateTotal();
  }
  
  ajouterFacture(): void {
    if (!this.nouvelleFacture.clientId) {
        console.error('Client is required');
        return;
    }
    
    if (this.factureLines.length === 0) {
        console.error('At least one invoice line is required');
        return;
    }

    // Create the expected backend format as a single object (not array)
    const facturePayload = {
        id: null,
        dateFacture: this.nouvelleFacture.date,
        clientID: Number(this.nouvelleFacture.clientId),
        factureLignes: this.factureLines.map(line => ({
            produitID: line.produitID ? Number(line.produitID) : null,
            quantity: Number(line.quantite) || 1,
            price: Number(line.prixUnitaire) || 0,
            description: line.description || '',
            // Remove the circular reference to facture
            // facture: { id: null } // Remove this line
        })),
        montantTotal: Number(this.nouvelleFacture.montant) || 0,
        montantPaye: 0,
        montantRestant: Number(this.nouvelleFacture.montant) || 0
    };
    
    console.log('Full facture payload:', JSON.stringify(facturePayload, null, 2));

    this.factureService.addFacture(facturePayload)  // Remove the array wrapper
        .subscribe({
            next: (facture) => {
                console.log('Facture created successfully:', facture);
                this.navigateToFactures();
            },
            error: (error) => {
                console.error('Error creating facture:', error);
                if (error.error) {
                    console.error('Server error details:', JSON.stringify(error.error, null, 2));
                }
                if (error.status === 400) {
                    console.error('Validation errors:', error.error?.errors || error.error);
                }
            }
        });
}

  navigateToFactures(): void {
    this.router.navigate(['/factures']);
  }

  getRowColorClass(facture: Facture): string {
    if (facture.montantRestantAPayer === 0) {
      return 'table-success';
    } else if (facture.montantPayer > 0) {
      return 'table-warning';
    }
    return '';
  }
}