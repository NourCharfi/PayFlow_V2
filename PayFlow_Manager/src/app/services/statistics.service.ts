import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FactureService } from '../facture.service';
import { ApiService } from './api.service';

interface Client {
  id: number;
  nom: string;
  email?: string;
  [key: string]: any;
}

interface Product {
  id: number;
  name: string;
  quantite: number;
  [key: string]: any;
}

interface Facture {
  id: number;
  dateFacture: string;
  clientID: number;
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  factureLignes: any[];
  [key: string]: any;
}

interface Payment {
  id: number;
  [key: string]: any;
}

interface StatisticsData {
  clients: Client[];
  factures: Facture[];
  products: Product[];
  payments: Payment[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly clientServiceUrl = 'http://localhost:8080/client-service/clients';
  private readonly produitServiceUrl = 'http://localhost:8080/produit-service/produits';

  // Add French labels
  private frenchLabels = {
    clients: 'Clients',
    produits: 'Produits',
    factures: 'Factures',
    paiements: 'Paiements',
    revenuTotal: 'Revenu Total',
    montantRestant: 'Montant Restant',
    montantPayé: 'Montant Payé'
  };
  constructor(
    private http: HttpClient,
    private factureService: FactureService,
    private apiService: ApiService
  ) {}

  getStatisticsData(): Observable<StatisticsData> {
    return forkJoin({
      clients: this.getClients(),
      factures: this.factureService.getFactures(),
      products: this.getProducts(),
      payments: this.apiService.getPayments()
    }).pipe(
      map(results => this.processStatisticsData(results)),
      catchError(error => {
        console.error('Error fetching statistics data:', error);
        return of({
          clients: [],
          factures: [],
          products: [],
          payments: []
        });
      })
    );
  }

  private processStatisticsData(results: any): StatisticsData {
    return {
      clients: this.processClients(results.clients),
      factures: this.processFactures(results.factures),
      products: this.processProducts(results.products),
      payments: results.payments || []
    };
  }

  private processClients(clientsData: any): Client[] {
    if (Array.isArray(clientsData)) return clientsData;
    if (clientsData?._embedded?.clients) return clientsData._embedded.clients;
    return [];
  }

  private processFactures(facturesData: any): Facture[] {
    if (Array.isArray(facturesData)) return facturesData;
    
    if (facturesData?._embedded?.factures) {
      return facturesData._embedded.factures.map((f: any) => ({
        id: this.extractIdFromHref(f._links?.self?.href),
        dateFacture: f.dateFacture || '',
        clientID: f.clientID || 0,
        montantTotal: f.montantTotal || 0,
        montantPaye: f.montantPaye || 0,
        montantRestant: f.montantRestant || 0,
        factureLignes: f.factureLignes || []
      }));
    }
    
    return [];
  }

  private processProducts(productsData: any): Product[] {
    if (Array.isArray(productsData)) return productsData;
    if (productsData?._embedded?.produits) return productsData._embedded.produits;
    return [];
  }

  private extractIdFromHref(href: string | undefined): number {
    if (!href) return 0;
    const parts = href.split('/');
    return parseInt(parts[parts.length - 1]) || 0;
  }

  getClientRevenue(data: StatisticsData): ClientRevenue[] {
    return data.clients.map(client => {
      const clientFactures = data.factures.filter(f => f.clientID === client.id);
      const totalRevenue = this.calculateTotal(clientFactures, 'montantTotal');
      const outstandingAmount = this.calculateTotal(clientFactures, 'montantRestant');
      const paidAmount = this.calculateTotal(clientFactures, 'montantPaye');
      const revenueByYear = this.groupByYear(clientFactures);
      
      return {
        clientId: client.id,
        clientName: client.nom,
        clientEmail: client.email,
        totalRevenue,
        outstandingAmount,
        paidAmount,
        revenueByYear,
        paidInvoices: clientFactures.filter(f => f.montantRestant === 0).length,
        unpaidInvoices: clientFactures.filter(f => f.montantRestant > 0).length,
        totalInvoices: clientFactures.length
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private calculateTotal(factures: Facture[], field: keyof Facture): number {
    return factures.reduce((sum, f) => sum + (f[field] as number), 0);
  }

  private groupByYear(factures: Facture[]): Record<number, number> {
    const result: Record<number, number> = {};
    factures.forEach(f => {
      const year = new Date(f.dateFacture).getFullYear();
      result[year] = (result[year] || 0) + f.montantTotal;
    });
    return result;
  }

  getLoyalClients(data: StatisticsData, limit: number = 5): ClientRevenue[] {
    return this.getClientRevenue(data)
      .map(client => ({
        ...client,
        loyaltyScore: client.totalRevenue * client.totalInvoices
      }))
      .sort((a, b) => b.loyaltyScore - a.loyaltyScore)
      .slice(0, limit);
  }

  getBestSellingProducts(data: StatisticsData, limit: number = 10): ProductStats[] {
    const productStats: Record<number, ProductStats> = {};
    
    data.factures.forEach(facture => {
      facture.factureLignes?.forEach(line => {
        if (!line.produitID) return;
        
        const product = data.products.find(p => p.id === line.produitID);
        if (!productStats[line.produitID]) {
          productStats[line.produitID] = this.initProductStats(line.produitID, product?.name);
        }
        
        const quantity = line.quantity || 0;
        const revenue = quantity * (line.price || 0);
        
        productStats[line.produitID].totalQuantity += quantity;
        productStats[line.produitID].totalRevenue += revenue;
        
        this.updateYearlyStats(productStats[line.produitID], facture.dateFacture, quantity, revenue);
      });
    });
    
    return Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  private initProductStats(productId: number, productName?: string): ProductStats {
    return {
      productId,
      productName: productName || `Product ${productId}`,
      totalQuantity: 0,
      totalRevenue: 0,
      salesByYear: {}
    };
  }

  private updateYearlyStats(stats: ProductStats, date: string, quantity: number, revenue: number): void {
    const year = new Date(date).getFullYear();
    if (!stats.salesByYear[year]) {
      stats.salesByYear[year] = { quantity: 0, revenue: 0 };
    }
    stats.salesByYear[year].quantity += quantity;
    stats.salesByYear[year].revenue += revenue;
  }

  getOutOfStockProducts(data: StatisticsData): Product[] {
    return data.products.filter(p => p.quantite <= 0);
  }

  getInvoiceStatistics(data: StatisticsData): InvoiceStats {
    const paidInvoices = data.factures.filter(f => f.montantRestant === 0);
    const totalAmount = this.calculateTotal(data.factures, 'montantTotal');
    const paidAmount = this.calculateTotal(data.factures, 'montantPaye');
    
    return {
      totalInvoices: data.factures.length,
      paidInvoices: paidInvoices.length,
      unpaidInvoices: data.factures.length - paidInvoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount: totalAmount - paidAmount,
      paidPercentage: data.factures.length > 0 ? 
        (paidInvoices.length / data.factures.length) * 100 : 0
    };
  }

  getClientDebtList(data: StatisticsData): ClientDebt[] {
    return data.clients
      .map(client => {
        const clientFactures = data.factures.filter(f => f.clientID === client.id);
        const outstandingAmount = this.calculateTotal(clientFactures, 'montantRestant');
        
        return {
          clientId: client.id,
          clientName: client.nom,
          clientEmail: client.email,
          outstandingAmount,
          unpaidInvoices: clientFactures.filter(f => f.montantRestant > 0).length
        };
      })
      .filter(client => client.outstandingAmount > 0)
      .sort((a, b) => b.outstandingAmount - a.outstandingAmount);
  }

  private getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientServiceUrl).pipe(
      catchError(error => {
        console.error('Error fetching clients:', error);
        return of([]);
      })
    );
  }

  private getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.produitServiceUrl).pipe(
      catchError(error => {
        console.error('Error fetching products:', error);
        return of([]);
      })
    );
  }
}

interface ClientRevenue {
  clientId: number;
  clientName: string;
  clientEmail?: string;
  totalRevenue: number;
  outstandingAmount: number;
  paidAmount: number;
  revenueByYear: Record<number, number>;
  paidInvoices: number;
  unpaidInvoices: number;
  totalInvoices: number;
  loyaltyScore?: number;
}

interface ProductStats {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  salesByYear: Record<number, { quantity: number; revenue: number }>;
}

interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paidPercentage: number;
}

interface ClientDebt {
  clientId: number;
  clientName: string;
  clientEmail?: string;
  outstandingAmount: number;
  unpaidInvoices: number;
}