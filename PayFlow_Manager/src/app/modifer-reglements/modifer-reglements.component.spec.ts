import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModiferReglementsComponent } from './modifer-reglements.component';

describe('ModiferReglementsComponent', () => {
  let component: ModiferReglementsComponent;
  let fixture: ComponentFixture<ModiferReglementsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModiferReglementsComponent]
    });
    fixture = TestBed.createComponent(ModiferReglementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
