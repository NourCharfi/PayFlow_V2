export interface Product {
    id?: number;
    name: string;
    price: number;
    quantite?: number;     // Frontend property
    quantity?: number;     // Backend property
    description?: string;
}

export interface Client {
    id: number;
    nom: string; // Add the 'nom' property
    email: string; // Assuming email is part of the interface
    // Add other properties as needed
}

export interface Invoice {
    id: number;
    idF?: number; // Add this line to include idF as an optional property
    dateFacture: string;
    clientID: number;
    montant: number;
    montantPayer: number;
    montantRestantAPayer: number;
}

export interface Payment {
    id?: number;
    dateReglement?: string;
    montant?: number;
    type?: string;
    factureId?: number;
    referenceNumber?: string;
}