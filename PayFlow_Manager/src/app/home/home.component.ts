import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { StatisticsService } from '../services/statistics.service';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { formatCurrency, DEFAULT_CURRENCY } from '../config/currency.config';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  loading = true;
  error: string | null = null;
  
  // Statistics data
  statisticsData: any = null;
  clientRevenue: any[] = [];
  loyalClients: any[] = [];
  bestSellingProducts: any[] = [];
  outOfStockProducts: any[] = [];
  invoiceStatistics: any = null;
  clientDebtList: any[] = [];
  
  // Current year for filtering
  currentYear = new Date().getFullYear();
  
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef;
  revenueChart: Chart | null = null;
  timeScale: 'day' | 'month' | 'year' = 'month';
  private aggregatedRevenue: Map<string, number> = new Map();

  constructor(
    private statisticsService: StatisticsService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;
    this.statisticsService.getStatisticsData().subscribe({
      next: (data) => {
        console.log('Raw Statistics Data:', data);
        this.statisticsData = data;
        
        this.clientRevenue = this.statisticsService.getClientRevenue(data);
        console.log('Client Revenue:', this.clientRevenue);
        
        this.loyalClients = this.statisticsService.getLoyalClients(data, 5);
        console.log('Loyal Clients:', this.loyalClients);
        
        this.bestSellingProducts = this.statisticsService.getBestSellingProducts(data, 10);
        console.log('Best Selling Products:', this.bestSellingProducts);
        
        // Update out of stock products logic
        // Create a map of sold quantities from bestSellingProducts
        const soldQuantities = new Map<number, number>();
        this.bestSellingProducts.forEach(product => {
          soldQuantities.set(product.productId, product.totalQuantity);
        });

        // Calculate total quantity sold from invoice lines
        let totalSoldByProduct = new Map<number, number>();
        
        data.factures.forEach((facture: any) => {
          facture.factureLignes?.forEach((ligne: any) => {
            if (ligne.produitID) {
              const currentTotal = totalSoldByProduct.get(ligne.produitID) || 0;
              totalSoldByProduct.set(ligne.produitID, currentTotal + (ligne.quantity || 0));
            }
          });
        });

        // Check each product's stock status
        this.outOfStockProducts = data.products.filter((product: any) => {
          const quantitySold = totalSoldByProduct.get(product.id) || 0;
          const remainingQuantity = product.quantite - quantitySold;
          console.log(`Product ${product.name}: Initial ${product.quantite}, Sold ${quantitySold}, Remaining ${remainingQuantity}`);
          return remainingQuantity <= 0;
        }).map((product: any) => ({
          id: product.id,
          name: product.name,
          initialQuantity: product.quantite,
          soldQuantity: totalSoldByProduct.get(product.id) || 0
        }));
        
        console.log('Updated Out of Stock Products:', this.outOfStockProducts);
        
        this.invoiceStatistics = this.statisticsService.getInvoiceStatistics(data);
        console.log('Invoice Statistics:', this.invoiceStatistics);
        
        this.clientDebtList = this.statisticsService.getClientDebtList(data);
        console.log('Client Debt List:', this.clientDebtList);
        
        // Process revenue data by time periods
        this.processRevenueData(data.factures);
        this.updateRevenueChart();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Statistics Loading Error:', err);
        this.error = 'Échec du chargement des statistiques. Veuillez réessayer plus tard.';
        this.loading = false;
      }
    });
  }

  private processRevenueData(factures: any[]): void {
    this.aggregatedRevenue.clear();
    
    // Agréger les factures par période
    factures.forEach(facture => {
      const date = new Date(facture.dateFacture);
      let key = '';
      
      switch(this.timeScale) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          break;
        case 'year':
          key = `${date.getFullYear()}`; // YYYY
          break;
      }
      
      const current = this.aggregatedRevenue.get(key) || 0;
      this.aggregatedRevenue.set(key, current + (facture.montantTotal || 0));
    });
  }

  private updateRevenueChart(): void {
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    if (!this.revenueChartCanvas) return;

    const sortedData = Array.from(this.aggregatedRevenue.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    const labels = sortedData.map(([date]) => {
      switch(this.timeScale) {
        case 'day':
          return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        case 'month':
          return new Date(date + '-01').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        case 'year':
          return date;
      }
    });

    this.revenueChart = new Chart(this.revenueChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Chiffre d\'affaires mensuel',
          data: sortedData.map(([_, value]) => value),
          borderColor: '#4299e1',
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number)
            },
            title: {
              display: true,
              text: `Montant (${DEFAULT_CURRENCY})`
            }
          },
          x: {
            title: {
              display: true,
              text: 'Période'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${this.formatCurrency(context.raw as number)}`;
              }
            }
          },
          title: {
            display: true,
            text: 'Évolution du chiffre d\'affaires',
            padding: {
              top: 10,
              bottom: 20
            },
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'top',
            align: 'center',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }

  changeTimeScale(scale: 'day' | 'month' | 'year'): void {
    this.timeScale = scale;
    if (this.statisticsData?.factures) {
      this.processRevenueData(this.statisticsData.factures);
      this.updateRevenueChart();
    }
  }
  
  // Navigation methods
  navigateToClientDetails(clientId: number): void {
    console.log('Navigate to client details:', clientId);
  }
  
  navigateToProductDetails(productId: number): void {
    console.log('Navigate to product details:', productId);
  }
  
  navigateToInvoiceList(): void {
    this.router.navigate(['/factures']);
  }
  
  // Helper methods
  formatCurrency(amount: number): string {
    return formatCurrency(amount);
  }

  getYearlyRevenue(client: any, year: number): number {
    return client.revenueByYear[year] || 0;
  }

  getYearlySales(product: any, year: number): number {
    return product.salesByYear[year]?.quantity || 0;
  }
}
