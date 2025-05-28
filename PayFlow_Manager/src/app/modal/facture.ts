export interface Facture {
  idF?: number;
  date: string;
  clientId: number | undefined;
  montant: number;
  montantRestantAPayer: number;
  montantPayer: number;
}
