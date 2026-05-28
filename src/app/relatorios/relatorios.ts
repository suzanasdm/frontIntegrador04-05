import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import jsPDF from 'jspdf';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CurrencyPipe
  ],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class Relatorios implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  contasBancarias: any[] = [];

  listaTransacoes: any[] = [];

  categoriasRelatorio: any[] = [];

  exibirSidebar = false;

  resumo = {
    receitas: 0,
    despesas: 0,
    saldo: 0
  };

  filtros = {
    inicio: '',
    fim: ''
  };

  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {

      const user = JSON.parse(
        localStorage.getItem('usuarioLogado') || '{}'
      );

      this.usuarioId = user.id;

      this.usuarioNome = user.nome || 'Usuário';

      this.usuarioCompleto = user;

      if (!this.usuarioId) {

        this.router.navigate(['/login']);

        return;
      }

      this.carregarDados();
    }
  }

  carregarDados() {

    this.carregarContas();

    this.carregarResumo();

    this.carregarCategorias();

    this.carregarTransacoes();
  }

  toggleSidebar(): void {

    this.exibirSidebar = !this.exibirSidebar;

    this.cdr.detectChanges();
  }

  carregarContas() {

    this.http.get<any[]>(
      `http://localhost:8080/api/contas/usuario/${this.usuarioId}`
    )
    .subscribe({

      next: (res) => {

        this.contasBancarias = res;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Erro ao carregar contas', err);
      }
    });
  }

  carregarResumo() {

    this.http.get<any>(
      `http://localhost:8080/api/relatorios/resumo/${this.usuarioId}`
    )
    .subscribe({

      next: (res) => {

        this.resumo = {

          receitas: res.receitas || 0,

          despesas: res.despesas || 0,

          saldo: res.saldo || 0
        };

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Erro ao carregar resumo', err);
      }
    });
  }

  carregarCategorias() {

    this.http.get<any[]>(
      `http://localhost:8080/api/relatorios/gastos-categoria/${this.usuarioId}`
    )
    .subscribe({

      next: (res) => {

        this.categoriasRelatorio = res;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Erro ao carregar categorias', err);
      }
    });
  }

  carregarTransacoes() {

    let url =
      `http://localhost:8080/api/relatorios/transacoes/${this.usuarioId}`;

    if (this.filtros.inicio && this.filtros.fim) {

      url =
        `http://localhost:8080/api/relatorios/transacoes/${this.usuarioId}` +
        `?inicio=${this.filtros.inicio}&fim=${this.filtros.fim}`;
    }

    this.http.get<any[]>(url)
      .subscribe({

        next: (res) => {

          this.listaTransacoes = res;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error('Erro ao carregar transações', err);
        }
      });
  }

  aplicarFiltros() {

    this.carregarTransacoes();
  }

  limparFiltros() {

    this.filtros = {
      inicio: '',
      fim: ''
    };

    this.carregarTransacoes();
  }

  exportarPDF() {

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text('Relatório Financeiro', 20, 20);

    doc.setFontSize(12);

    doc.text(
      `Receitas: R$ ${this.resumo.receitas.toFixed(2)}`,
      20,
      40
    );

    doc.text(
      `Despesas: R$ ${this.resumo.despesas.toFixed(2)}`,
      20,
      50
    );

    doc.text(
      `Saldo: R$ ${this.resumo.saldo.toFixed(2)}`,
      20,
      60
    );

    let y = 80;

    doc.setFontSize(14);

    doc.text('Transações', 20, y);

    y += 10;

    this.listaTransacoes.forEach((item) => {

      doc.setFontSize(11);

      doc.text(
        `${item.descricao} | ${item.tipo} | R$ ${item.valor}`,
        20,
        y
      );

      y += 8;

      if (y > 270) {

        doc.addPage();

        y = 20;
      }
    });

    doc.save('relatorio-financeiro.pdf');
  }

  logout() {

    if (isPlatformBrowser(this.platformId)) {

      localStorage.removeItem('usuarioLogado');

      this.router.navigate(['/login']);
    }
  }

  calcularPorcentagem(valor: number): number {

    const total =
      this.categoriasRelatorio.reduce(
        (acc, item) => acc + item.valor,
        0
      );

    if (!total || total === 0) {

      return 0;
    }

    return (valor / total) * 100;
  }
}