import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReglementListComponent } from './reglement-list.component';

describe('ReglementListComponent', () => {
  let component: ReglementListComponent;
  let fixture: ComponentFixture<ReglementListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReglementListComponent]
    });
    fixture = TestBed.createComponent(ReglementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
