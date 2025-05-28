export interface Client {
  id: number;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  adresse?: string;
}

export interface ClientResponse {
  _embedded?: {
    clients: Client[];
  };
  _links?: any;
  page?: any;
}