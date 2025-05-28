export interface FactureLine {
  produit?: {
    name: string;
    price: number;
    prix?: number; // Add this for backward compatibility
  };
  description: string;
  quantity: number;
  quantite?: number; // Add this for backward compatibility
  price: number;
  montantTotal?: number;
}

export interface Facture {
  id?: number; // Add this property
  idF?: number; // Keep existing property
  dateFacture: string;
  client?: {
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  factureLignes: FactureLine[];
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
  // Add these properties for compatibility with your component
  montant?: number;
  montantPayer?: number;
  montantRestantAPayer?: number;
}
