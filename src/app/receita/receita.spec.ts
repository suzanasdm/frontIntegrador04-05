import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Receita } from './receita';

describe('Receita', () => {
  let component: Receita;
  let fixture: ComponentFixture<Receita>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Receita],
    }).compileComponents();

    fixture = TestBed.createComponent(Receita);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
