import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../services/product.service';
import { Product } from '../modal/product';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {
  product: Product = {
    name: '',
    price: 0,
    quantite: 0,
    description: ''
  };
  
  loading = false;
  error: string | null = null;
  isEditMode = false;
  productId: number | null = null;

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.productId = id;
      this.loadProduct(id);
    }
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement du produit. Veuillez réessayer plus tard.';
        this.loading = false;
        console.error('Error loading product:', err);
      }
    });
  }

  saveProduct(): void {
    this.loading = true;
    this.error = null;
    
    console.log('Product being saved:', this.product); // Add this line
    
    if (!this.product.name || this.product.price <= 0 || this.product.quantite < 0) {
      this.error = 'Le nom est obligatoire, le prix doit être supérieur à 0 et la quantité doit être positive';
      this.loading = false;
      return;
    }

    const operation = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, this.product)
      : this.productService.createProduct(this.product);

    operation.subscribe({
      next: (response) => {
        console.log('Save response:', response); // Add this line
        this.loading = false;
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Detailed error:', err); // Enhanced error logging
        this.error = `Échec de ${this.isEditMode ? 'la modification' : 'l\'ajout'} du produit. Veuillez réessayer plus tard.`;
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}