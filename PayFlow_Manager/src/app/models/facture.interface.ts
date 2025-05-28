export interface FactureLine {
  produit?: {
    name: string;
    price: number;
  };
  description: string;
  quantity: number;
  price: number;
}

export interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface Facture {
  id: number;
  dateFacture: string;
  clientID: number;
  client: {
    id: number;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  factureLignes: FactureLine[];
  montantTotal: number;
  montantPaye: number;
  montantRestant: number;
}
