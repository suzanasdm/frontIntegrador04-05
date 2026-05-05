import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Contabancaria } from './contabancaria';

describe('Contabancaria', () => {
  let component: Contabancaria;
  let fixture: ComponentFixture<Contabancaria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Contabancaria],
    }).compileComponents();

    fixture = TestBed.createComponent(Contabancaria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
