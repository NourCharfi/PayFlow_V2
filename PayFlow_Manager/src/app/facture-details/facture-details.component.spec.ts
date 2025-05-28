import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactureDetailsComponent } from './facture-details.component';

describe('FactureDetailsComponent', () => {
  let component: FactureDetailsComponent;
  let fixture: ComponentFixture<FactureDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FactureDetailsComponent]
    });
    fixture = TestBed.createComponent(FactureDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
