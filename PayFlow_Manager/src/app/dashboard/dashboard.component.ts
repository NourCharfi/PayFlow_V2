import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { FactureService } from '../facture.service';
import { ReglementService } from '../services/reglement.service';
import { ClientService } from '../services/client.service';
import { ProductService } from '../services/product.service';
import { forkJoin, interval, Subscription } from 'rxjs';
import { Product } from '../modal/product';

// Register all chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Chart instances
  private charts: { [key: string]: Chart } = {};

  // Chart data
  revenueData: any;
  productData: any;
  clientData: any;
  paymentMethodData: any;
  factures: any[] = [];
  clients: any[] = [];
  products: Product[] = [];
  loading = true;
  error: string | null = null;

  // Date filters
  startDate: Date = new Date(new Date().getFullYear(), 0, 1); // Start of current year
  endDate: Date = new Date();
  dateRangePresets = [
    { label: '30 derniers jours', value: 30 },
    { label: '90 derniers jours', value: 90 },
    { label: 'Cette année', value: 'year' },
    { label: 'Tout', value: 'all' }
  ];

  // Auto refresh
  private refreshInterval: Subscription | null = null;
  autoRefreshEnabled = false;
  autoRefreshInterval = 5; // minutes

  // Chart loading states
  private chartLoadingStates: { [key: string]: boolean } = {};
  private cachedData: { [key: string]: any } = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private lastCacheTime: number = 0;

  constructor(
    private factureService: FactureService,
    private reglementService: ReglementService,
    private clientService: ClientService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
    this.destroyCharts();
  }

  private destroyCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  async loadDashboardData() {
    this.loading = true;
    this.error = null;
    
    try {
      // Load data for key metrics first
      const basicData = await this.loadBasicMetrics();
      if (!basicData) {
        throw new Error('Failed to load basic metrics');
      }
      
      this.factures = this.filterFacturesByDate(basicData.factures);
      this.clients = basicData.clients;
      this.products = basicData.products;
      
      // Initialize charts lazily
      await Promise.all([
        this.initializeChartWithLoading('revenue', () => this.initRevenueChart(this.factures)),
        this.initializeChartWithLoading('product', () => this.initProductChart(this.products)),
        this.initializeChartWithLoading('client', () => this.initClientChart(this.clients)),
        this.initializeChartWithLoading('payment', () => this.initPaymentMethodChart(basicData.reglements))
      ]);
    } catch (error) {
      this.error = 'Erreur lors du chargement des données';
      console.error('Dashboard data loading error:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadBasicMetrics() {
    return forkJoin({
      factures: this.factureService.getFactures(),
      reglements: this.reglementService.getReglements(),
      clients: this.clientService.getClients(),
      products: this.productService.getProducts()
    }).toPromise();
  }

  private async initializeChartWithLoading(chartId: string, initFunction: () => void) {
    this.setChartLoading(chartId, true);
    try {
      if (this.shouldLoadFromCache(chartId)) {
        this.restoreChartFromCache(chartId);
      } else {
        await initFunction();
        this.cacheChartData(chartId);
      }
    } finally {
      this.setChartLoading(chartId, false);
    }
  }

  private shouldLoadFromCache(chartId: string): boolean {
    const cachedData = this.cachedData[chartId];
    return cachedData && 
           Date.now() - this.lastCacheTime < this.CACHE_DURATION && 
           !this.isChartDataStale(chartId);
  }

  private isChartDataStale(chartId: string): boolean {
    // Add logic to determine if data needs refresh
    // For example, if new data has been added since last cache
    return false;
  }

  private cacheChartData(chartId: string) {
    const chart = this.charts[chartId];
    if (chart) {
      this.cachedData[chartId] = {
        data: chart.data,
        options: chart.options,
        timestamp: Date.now()
      };
    }
  }

  private restoreChartFromCache(chartId: string) {
    const cached = this.cachedData[chartId];
    if (cached && cached.data) {
      const ctx = document.getElementById(chartId) as HTMLCanvasElement;
      if (ctx) {
        this.charts[chartId] = new Chart(ctx, {
          data: cached.data,
          options: cached.options
        });
      }
    }
  }
  
  private filterFacturesByDate(factures: any[]): any[] {
    return factures.filter(facture => {
      const factureDate = new Date(facture.dateFacture);
      return factureDate >= this.startDate && factureDate <= this.endDate;
    });
  }

  setDateRange(preset: string | number) {
    const now = new Date();
    if (typeof preset === 'number') {
      this.startDate = new Date(now.getTime() - preset * 24 * 60 * 60 * 1000);
      this.endDate = now;
    } else if (preset === 'year') {
      this.startDate = new Date(now.getFullYear(), 0, 1);
      this.endDate = now;
    } else if (preset === 'all') {
      this.startDate = new Date(2000, 0, 1); // A date far in the past
      this.endDate = now;
    }
    this.loadDashboardData();
  }

  toggleAutoRefresh() {
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    if (this.refreshInterval) {
      this.stopAutoRefresh();
    }
    this.refreshInterval = interval(this.autoRefreshInterval * 60 * 1000)
      .subscribe(() => {
        this.loadDashboardData();
      });
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
      this.refreshInterval = null;
    }
  }

  private initRevenueChart(factures: any[]) {
    const chartData = this.prepareRevenueChartData(factures);
    this.createOrUpdateChart('revenueChart', {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        animation: {
          duration: this.shouldAnimate() ? 750 : 0,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context: any) {
                const value = context.raw;
                return `${context.dataset.label}: ${value.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              drawBorder: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false
            },
            ticks: {
              callback: function(value: any) {
                return value.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0
                });
              }
            }
          }
        }
      }
    });
  }

  private prepareRevenueChartData(factures: any[]) {
    // Initialize monthly and yearly data structures
    const monthlySales = new Map<string, number>();
    const yearlySales = new Map<number, number>();

    // Process all invoices
    factures.forEach(facture => {
      const date = new Date(facture.dateFacture);
      if (!isNaN(date.getTime())) {
        // Monthly tracking
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const currentMonthTotal = monthlySales.get(monthKey) || 0;
        monthlySales.set(monthKey, currentMonthTotal + (facture.montantTotal || 0));

        // Yearly tracking
        const year = date.getFullYear();
        const currentYearTotal = yearlySales.get(year) || 0;
        yearlySales.set(year, currentYearTotal + (facture.montantTotal || 0));
      }
    });

    // Sort months and years
    const sortedMonths = Array.from(monthlySales.keys()).sort();
    const sortedYears = Array.from(yearlySales.keys()).sort();

    // Prepare the chart data with two datasets
    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', { 
          month: 'short',
          year: 'numeric'
        });
      }),
      datasets: [
        {
          label: 'Chiffre d\'affaires mensuel',
          data: sortedMonths.map(month => monthlySales.get(month) || 0),
          borderColor: '#4299e1',
          backgroundColor: 'rgba(66, 153, 225, 0.1)',
          pointBackgroundColor: '#4299e1',
          pointRadius: 4,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Total annuel',
          data: sortedMonths.map(month => {
            const year = parseInt(month.split('-')[0]);
            return yearlySales.get(year) || 0;
          }),
          borderColor: '#48bb78',
          backgroundColor: 'rgba(72, 187, 120, 0.1)',
          pointBackgroundColor: '#48bb78',
          pointRadius: 0,
          tension: 0,
          fill: true,
          borderDash: [5, 5],
          hidden: true // Initially hidden, can be toggled by user
        }
      ]
    };
  }

  private createOrUpdateChart(canvasId: string, config: any) {
    // Destroy existing chart instance if it exists
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    // Create new chart instance with optimized configuration
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (ctx) {
      requestAnimationFrame(() => {
        this.charts[canvasId] = new Chart(ctx, {
          ...config,
          options: {
            ...config.options,
            devicePixelRatio: window.devicePixelRatio || 1,
            animation: this.shouldAnimate() ? config.options?.animation : false
          }
        });
      });
    }
  }

  private shouldAnimate(): boolean {
    // Disable animations on mobile devices or when too many data points
    return window.innerWidth > 768 && !this.hasLargeDataset();
  }

  private hasLargeDataset(): boolean {
    // Define threshold for large datasets
    const THRESHOLD = 1000;
    return this.factures.length > THRESHOLD;
  }

  private initProductChart(products: any[]) {
    const chartData = this.prepareProductChartData(products);
    this.createOrUpdateChart('productChart', {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: true,
              drawBorder: false
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  private prepareProductChartData(products: any[]) {    // Create a map of products by ID for faster lookup
    const productsMap = new Map(products.map(p => [p.id, p]));
    
    // Calculate total sales for each product
    const productSales = new Map<string, number>();
    this.factures.forEach(facture => {
      facture.factureLignes?.forEach((ligne: any) => {
        if (ligne.produitID) {
          const currentTotal = productSales.get(ligne.produitID) || 0;
          productSales.set(ligne.produitID, currentTotal + (ligne.quantity || 0));
        }
      });
    });

    // Sort products by sales and take top 10
    const sortedProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, sales]) => {
        const product = productsMap.get(id);
        // Log product details for debugging
        console.log('Product lookup:', { id, product, sales });
        return {
          // Try all possible property names that might contain the product name
          name: product ? (
            product.nom || 
            product.name || 
            product.designation || 
            product.libelle || 
            'Nom de produit manquant'
          ) : 'Produit introuvable',
          sales,
          id
        };
      })
      .filter(product => product.sales > 0); // Only show products with sales

    return {
      labels: sortedProducts.map(p => p.name),
      datasets: [{
        data: sortedProducts.map(p => p.sales),
        backgroundColor: '#4299e1',
        borderRadius: 4,
        maxBarThickness: 20
      }]
    };
  }

  private initClientChart(clients: any[]) {
    const chartData = this.prepareClientChartData(clients);
    this.createOrUpdateChart('clientChart', {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  private prepareClientChartData(clients: any[]) {
    // Calculate total purchases per client
    const clientPurchases = new Map<string, number>();
    this.factures.forEach(facture => {
      const currentTotal = clientPurchases.get(facture.clientID) || 0;
      clientPurchases.set(facture.clientID, currentTotal + facture.montantTotal);
    });

    // Sort clients by purchase amount and take top 5
    const sortedClients = Array.from(clientPurchases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, total]) => ({
        name: clients.find(c => c.id === id)?.nom || 'Unknown',
        total
      }));

    const colors = ['#4299e1', '#48bb78', '#ecc94b', '#ed64a6', '#9f7aea'];

    return {
      labels: sortedClients.map(c => c.name),
      datasets: [{
        data: sortedClients.map(c => c.total),
        backgroundColor: colors,
        borderWidth: 0
      }]
    };
  }

  private initPaymentMethodChart(reglements: any[]) {
    const paymentMethods = reglements.reduce((acc: any, reglement: any) => {
      acc[reglement.type] = (acc[reglement.type] || 0) + reglement.montant || 0;
      return acc;
    }, {});

    const ctx = document.getElementById('paymentChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(paymentMethods),
        datasets: [{
          data: Object.values(paymentMethods),
          backgroundColor: [
            'rgba(72, 187, 120, 0.8)',   // Green for cash
            'rgba(66, 153, 225, 0.8)',   // Blue for bank transfer
            'rgba(246, 173, 85, 0.8)'    // Orange for check
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              },
              color: '#718096'
            }
          },
          title: {
            display: true,
            text: 'Répartition des Paiements',
            padding: {
              top: 20,
              bottom: 10
            },
            color: '#2d3748',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const amount = value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
                return ` ${context.label}: ${amount} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  private setChartLoading(chartId: string, loading: boolean) {
    this.chartLoadingStates[chartId] = loading;
    this.cdr.detectChanges();
  }

  private async loadChartData(chartId: string): Promise<any> {
    this.setChartLoading(chartId, true);
    try {
      const currentTime = Date.now();
      if (
        this.cachedData[chartId] &&
        currentTime - this.lastCacheTime < this.CACHE_DURATION
      ) {
        return this.cachedData[chartId];
      }

      const data = await this.fetchChartData(chartId);
      this.cachedData[chartId] = data;
      this.lastCacheTime = currentTime;
      return data;
    } finally {
      this.setChartLoading(chartId, false);
    }
  }

  private async fetchChartData(chartId: string): Promise<any> {
    // Implement specific data fetching logic for each chart type
    switch (chartId) {
      case 'revenue':
        return await this.factureService.getFactures();
      case 'transactions':
        return await this.reglementService.getReglements();
      // Add cases for other charts
      default:
        throw new Error(`Unknown chart type: ${chartId}`);
    }
  }

  async createChart(chartId: string, config: any) {
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
    }

    const data = await this.loadChartData(chartId);
    const ctx = document.getElementById(chartId) as HTMLCanvasElement;
    if (!ctx) return;

    this.charts[chartId] = new Chart(ctx, {
      ...config,
      data: data
    });
  }

  isActivePreset(preset: string | number): boolean {
    const now = new Date();
    const start = new Date(this.startDate);
    
    if (typeof preset === 'number') {
      const expectedStart = new Date(now.getTime() - preset * 24 * 60 * 60 * 1000);
      return Math.abs(start.getTime() - expectedStart.getTime()) < 24 * 60 * 60 * 1000;
    } else if (preset === 'year') {
      return start.getFullYear() === now.getFullYear() && 
             start.getMonth() === 0 && 
             start.getDate() === 1;
    } else if (preset === 'all') {
      return start.getFullYear() <= 2000;
    }
    return false;
  }

  getTotalRevenue(): number {
    return this.factures.reduce((total, facture) => total + facture.montantTotal, 0);
  }

  getAverageTicket(): number {
    if (this.factures.length === 0) return 0;
    const total = this.getTotalRevenue();
    return total / this.factures.length;
  }

  getTotalClients(): number {
    return this.clients.length;
  }

  getTotalProducts(): number {
    return this.products.length;
  }
}
