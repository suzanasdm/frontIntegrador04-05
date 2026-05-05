import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Transacao } from './transacao';

describe('Transacao', () => {
  let component: Transacao;
  let fixture: ComponentFixture<Transacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Transacao],
    }).compileComponents();

    fixture = TestBed.createComponent(Transacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
