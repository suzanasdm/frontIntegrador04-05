import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-fluxo-caixa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './fluxo-caixa.html',
  styleUrl: './fluxo-caixa.css',
})
export class FluxoCaixa implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  exibirSidebar: boolean = false;

  contasBancarias: any[] = [];

  filtro = {
    inicio: '',
    fim: ''
  };

  resultado: any = null;

  carregando: boolean = false;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const user = JSON.parse(localStorage.getItem('usuarioLogado') || '{}');

      this.usuarioId = user.id;
      this.usuarioNome = user.nome || 'Usuário';
      this.usuarioCompleto = user;

      if (!this.usuarioId) {
        this.router.navigate(['/login']);
        return;
      }

      this.definirPeriodoPadrao();
      this.carregarContas();
      this.consultarFluxoCaixa();
    }
  }

  definirPeriodoPadrao(): void {
    const hoje = new Date();

    const primeiroDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1
    );

    this.filtro.inicio = primeiroDia.toISOString().split('T')[0];
    this.filtro.fim = hoje.toISOString().split('T')[0];
  }

  carregarContas(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/contas/usuario/${this.usuarioId}`
    ).subscribe({
      next: (res) => {
        this.contasBancarias = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar contas:', err);
      }
    });
  }

  consultarFluxoCaixa(): void {
    if (!this.filtro.inicio) {
      alert('Informe a data inicial.');
      return;
    }

    if (!this.filtro.fim) {
      alert('Informe a data final.');
      return;
    }

    this.carregando = true;

    this.http.get<any>(
      `http://localhost:8080/api/fluxo-caixa/usuario/${this.usuarioId}?inicio=${this.filtro.inicio}&fim=${this.filtro.fim}`
    ).subscribe({
      next: (res) => {
        this.resultado = res;
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregando = false;
        console.error('Erro ao consultar fluxo de caixa:', err);
        alert(err.error?.message || err.error || 'Erro ao consultar fluxo de caixa.');
      }
    });
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}
