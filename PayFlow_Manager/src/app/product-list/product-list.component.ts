import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { Product } from '../modal/product';
import { Router } from '@angular/router';
import { StatisticsService } from '../services/statistics.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  error: string | null = null;
  productStats: any = {};

  constructor(
    private productService: ProductService,
    private router: Router,
    private statisticsService: StatisticsService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadProductStats();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement des produits. Veuillez réessayer plus tard.';
        this.loading = false;
        console.error('Error loading products:', err);
      }
    });
  }

  loadProductStats(): void {
    this.statisticsService.getStatisticsData().subscribe({
      next: (data: any) => {
        const stats = this.statisticsService.getBestSellingProducts(data);
        this.productStats = stats.reduce((acc: Record<number, number>, stat: any) => {
          acc[stat.productId] = stat.totalQuantity;
          return acc;
        }, {} as Record<number, number>);
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des statistiques:', err);
      }
    });
}

  getQuantityVendue(productId: number | undefined): number {
    if (!productId) return 0;
    return this.productStats[productId] || 0;
  }

  editProduct(id: number): void {
    this.router.navigate(['/products/edit', id]);
  }

  deleteProduct(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products = this.products.filter(product => product.id !== id);
        },
        error: (err) => {
          this.error = 'Échec de la suppression du produit. Veuillez réessayer plus tard.';
          console.error('Error deleting product:', err);
        }
      });
    }
  }

  addProduct(): void {
    this.router.navigate(['/products/add']);
  }
}