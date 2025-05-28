import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModifierFactureComponent } from './modifer-facture.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ModifierFactureComponent', () => {
  let component: ModifierFactureComponent;
  let fixture: ComponentFixture<ModifierFactureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModifierFactureComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierFactureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('invoice calculations', () => {
    beforeEach(() => {
      component.factureLines = [];
      component.facture = {
        idF: 1,
        date: new Date().toISOString().split('T')[0],
        clientId: 1,
        montant: 0,
        montantPayer: 0,
        montantRestantAPayer: 0
      };
    });

    it('should calculate line total correctly', () => {
      component.factureLines.push({
        produitID: 1,
        description: 'Test Product',
        quantite: 2,
        prixUnitaire: 10,
        montantTotal: 0
      });

      component.calculateLineTotal(0);

      expect(component.factureLines[0].montantTotal).toBe(20);
      expect(component.facture.montant).toBe(20);
    });

    it('should handle decimal values correctly', () => {
      component.factureLines.push({
        produitID: 1,
        description: 'Test Product',
        quantite: 2.5,
        prixUnitaire: 10.99,
        montantTotal: 0
      });

      component.calculateLineTotal(0);

      expect(component.factureLines[0].montantTotal).toBe(27.48); // 2.5 * 10.99 = 27.475, rounded to 27.48
      expect(component.facture.montant).toBe(27.48);
    });

    it('should calculate total for multiple lines', () => {
      // First line: 2 x 10 = 20
      component.factureLines.push({
        produitID: 1,
        description: 'Product 1',
        quantite: 2,
        prixUnitaire: 10,
        montantTotal: 0
      });

      // Second line: 3 x 15 = 45
      component.factureLines.push({
        produitID: 2,
        description: 'Product 2',
        quantite: 3,
        prixUnitaire: 15,
        montantTotal: 0
      });

      component.calculateTotal();

      expect(component.facture.montant).toBe(65);
      expect(component.facture.montantRestantAPayer).toBe(65);
    });

    it('should handle invalid inputs', () => {
      component.factureLines.push({
        produitID: 1,
        description: 'Test Product',
        quantite: 0,
        prixUnitaire: 0,
        montantTotal: 0
      });

      component.calculateLineTotal(0);

      expect(component.factureLines[0].montantTotal).toBe(0);
      expect(component.facture.montant).toBe(0);
    });

    it('should update totals when removing a line', () => {
      // First line: 2 x 10 = 20
      component.factureLines.push({
        produitID: 1,
        description: 'Product 1',
        quantite: 2,
        prixUnitaire: 10,
        montantTotal: 20
      });

      // Second line: 3 x 15 = 45
      component.factureLines.push({
        produitID: 2,
        description: 'Product 2',
        quantite: 3,
        prixUnitaire: 15,
        montantTotal: 45
      });

      // Initial total should be 65
      component.calculateTotal();
      expect(component.facture.montant).toBe(65);

      // Remove first line
      component.removeLine(0);

      // Total should now be 45
      expect(component.facture.montant).toBe(45);
      expect(component.facture.montantRestantAPayer).toBe(45);
    });

    it('should handle partially paid invoices correctly', () => {
      component.factureLines.push({
        produitID: 1,
        description: 'Test Product',
        quantite: 2,
        prixUnitaire: 10,
        montantTotal: 20
      });

      // Set an initial payment
      component.facture.montantPayer = 15;

      component.calculateTotal();

      expect(component.facture.montant).toBe(20);
      expect(component.facture.montantPayer).toBe(15);
      expect(component.facture.montantRestantAPayer).toBe(5);
    });
  });
});