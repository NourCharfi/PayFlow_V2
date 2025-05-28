import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FactureService } from '../facture.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-modifier-facture',
    templateUrl: './modifer-facture.component.html',
    styleUrls: ['./modifer-facture.component.css']
})
export class ModifierFactureComponent implements OnInit {
    facture: any = {
        idF: undefined,
        date: new Date().toISOString().split('T')[0],
        clientId: undefined,
        montant: 0,
        montantRestantAPayer: 0,
        montantPayer: 0
    };
    clients: any[] = [];
    products: any[] = [];
    factureLines: any[] = [];
    loading = false;
    error: string | null = null;
    factureId = 0;

    constructor(
        private factureService: FactureService,
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        this.loading = true;
        
        // Load clients and products first
        Promise.all([
            this.loadClients(),
            this.loadProducts()
        ]).then(() => {
            // After loading supporting data, get the facture ID and load the facture
            this.route.paramMap.subscribe(params => {
                const id = params.get('id');
                if (id) {
                    this.factureId = +id;
                    this.loadFacture(this.factureId);
                } else {
                    this.error = 'No facture ID provided';
                    this.loading = false;
                }
            });
        });
    }

    loadFacture(id: number) {
        this.loading = true;
        this.error = null;
        
        this.factureService.getFacture(id).subscribe({
            next: (facture) => {
                console.log('Loaded facture:', facture);
                if (facture) {
                    // Map the facture data
                    this.facture = {
                        idF: facture.id,
                        date: facture.dateFacture ? new Date(facture.dateFacture).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        clientId: facture.clientID,
                        montant: facture.montantTotal || 0,
                        montantPayer: facture.montantPaye || 0,
                        montantRestantAPayer: facture.montantRestant || 0
                    };

                    // Initialize or map facture lines
                    if (facture.factureLignes && facture.factureLignes.length > 0) {
                        this.factureLines = facture.factureLignes.map((line: any) => {
                            const product = this.products.find(p => p.id === line.produitID);
                            return {
                                id: line.id,
                                produitID: line.produitID,
                                description: product ? product.name : line.description,
                                quantite: line.quantity,
                                prixUnitaire: line.price,
                                montantTotal: line.quantity * line.price,
                            };
                        });
                    } else {
                        this.addLine(); // Add initial empty line if none exist
                    }

                    this.calculateTotal();
                    this.loading = false;
                } else {
                    this.error = 'Facture not found';
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading facture:', error);
                this.error = 'Failed to load facture data';
                this.loading = false;
            }
        });
    }

    loadClients(): Promise<void> {
        return new Promise((resolve) => {
            this.http.get<any>('http://localhost:8080/client-service/clients').subscribe({
                next: (response) => {
                    if (response && response._embedded && response._embedded.clients) {
                        this.clients = response._embedded.clients;
                    } else {
                        this.clients = response || [];
                    }
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading clients:', error);
                    this.clients = [];
                    resolve();
                }
            });
        });
    }

    loadProducts(): Promise<void> {
        return new Promise((resolve) => {
            this.http.get<any>('http://localhost:8080/produit-service/produits').subscribe({
                next: (response) => {
                    if (response && response._embedded && response._embedded.produits) {
                        this.products = response._embedded.produits;
                    } else {
                        this.products = response || [];
                    }
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading products:', error);
                    this.products = [];
                    resolve();
                }
            });
        });
    }

    calculateTotal(): void {
        let total = 0;
        for (const line of this.factureLines) {
            line.montantTotal = (line.quantite || 0) * (line.prixUnitaire || 0);
            total += line.montantTotal;
        }
        this.facture.montant = total;
        this.facture.montantRestantAPayer = total - (this.facture.montantPayer || 0);
    }

    calculateLineTotal(index: number): void {
        const line = this.factureLines[index];
        if (line) {
            line.montantTotal = (line.quantite || 0) * (line.prixUnitaire || 0);
            this.calculateTotal();
        }
    }

    addLine(): void {
        this.factureLines.push({
            id: null,
            produitID: null,
            description: '',
            quantite: 1,
            prixUnitaire: 0,
            montantTotal: 0
        });
    }

    removeLine(index: number): void {
        this.factureLines.splice(index, 1);
        if (this.factureLines.length === 0) {
            this.addLine();
        }
        this.calculateTotal();
    }

    onProductSelect(index: number): void {
        const line = this.factureLines[index];
        if (line && line.produitID) {
            const product = this.products.find(p => p.id === Number(line.produitID));
            if (product) {
                line.description = product.name;
                line.prixUnitaire = product.price;
                this.calculateLineTotal(index);
            }
        }
    }

    validateQuantity(index: number): void {
        const line = this.factureLines[index];
        if (!line.produitID) return;

        const product = this.products.find(p => p.id === Number(line.produitID));
        if (product && product.quantite !== undefined) {
            if (line.quantite > product.quantite) {
                this.error = `Only ${product.quantite} units available for ${product.name}`;
                line.quantite = product.quantite;
            } else {
                this.error = null;
            }
        }
        this.calculateLineTotal(index);
    }

    modifierFacture(): void {
        if (!this.facture.idF) {
            this.error = 'Facture ID is required';
            return;
        }

        if (!this.facture.clientId) {
            this.error = 'Please select a client';
            return;
        }

        if (this.factureLines.length === 0) {
            this.error = 'Please add at least one invoice line';
            return;
        }

        // Validate each line
        for (const line of this.factureLines) {
            if (!line.produitID) {
                this.error = 'Please select a product for all lines';
                return;
            }
            if (line.quantite <= 0) {
                this.error = 'Quantity must be positive for all lines';
                return;
            }
        }

        // Prepare the payload
        const formattedPayload = {
            dateFacture: this.facture.date,
            clientID: Number(this.facture.clientId),
            factureLignes: this.factureLines.map(line => ({
                produitID: Number(line.produitID),
                quantity: Number(line.quantite),
                price: Number(line.prixUnitaire),
                description: line.description || ''
            }))
        };

        this.loading = true;
        this.factureService.updateFacture(this.facture.idF, formattedPayload).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigate(['/factures']);
            },
            error: (error) => {
                this.loading = false;
                console.error('Error updating facture:', error);
                this.error = 'Failed to update facture: ' + (error.error?.message || error.message || 'Unknown error');
            }
        });
    }

    printFacture(): void {
        if (this.facture.idF) {
            this.router.navigate(['/factures/print', this.facture.idF]);
        }
    }
}