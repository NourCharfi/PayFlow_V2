export interface Product {
  id?: number;
  name: string;
  price: number;
  quantite: number; // Frontend uses quantite
  description?: string;
}