// reglement.model.ts

export enum PaymentType {
  ESPECE = 'ESPECE',
  CHEQUE = 'CHEQUE',
  TRAITE = 'TRAITE',
  VIREMENT = 'VIREMENT'
}

export class Reglement {
  id?: number;
  dateReglement: string;
  montant: number;
  type: PaymentType;
  referenceNumber?: string | null; // Allow both undefined and null
  factureId: number;

  constructor(
    dateReglement: string,
    montant: number,
    type: PaymentType,
    factureId: number,
    referenceNumber?: string | null,
    id?: number
  ) {
    this.dateReglement = dateReglement;
    this.montant = montant;
    this.type = type;
    this.factureId = factureId;
    this.referenceNumber = referenceNumber;
    this.id = id;
  }
}