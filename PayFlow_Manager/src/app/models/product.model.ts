export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number; // Changed from quantite to quantity
  category: string;
}

export interface ProductResponse {
  _embedded?: {
    produits: Product[];
  };
  _links?: any;
  page?: any;
}