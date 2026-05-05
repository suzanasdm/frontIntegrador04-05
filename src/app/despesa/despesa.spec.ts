import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Despesa } from './despesa';

describe('Despesa', () => {
  let component: Despesa;
  let fixture: ComponentFixture<Despesa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Despesa],
    }).compileComponents();

    fixture = TestBed.createComponent(Despesa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
