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
  selector: 'app-transacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './transacao.html',
  styleUrl: './transacao.css',
})
export class Transacao implements OnInit {

  private platformId = inject(PLATFORM_ID);

  private http = inject(HttpClient);

  private router = inject(Router);

  private cdr = inject(ChangeDetectorRef);

  // =========================
  // USUÁRIO
  // =========================

  usuarioId: number = 0;

  usuarioNome: string = '';

  usuarioCompleto: any = {};

  // =========================
  // LISTAS
  // =========================

  contasBancarias: any[] = [];

  categorias: any[] = [];

  listaTransacoes: any[] = [];

  // =========================
  // UI
  // =========================

  exibirSidebar: boolean = false;

  arquivoOFX!: File;

  // =========================
  // FORM
  // =========================

  dadosForm = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    categoriaId: '',
    contaId: '',
    tipo: 'DESPESA'
  };

  // =========================
  // INIT
  // =========================

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

  // =========================
  // SIDEBAR
  // =========================

  toggleSidebar(): void {

    this.exibirSidebar = !this.exibirSidebar;

    this.cdr.detectChanges();

  }

  // =========================
  // CARREGAR DADOS
  // =========================

  carregarDados(): void {

    this.carregarContas();

    this.carregarCategorias();

    this.carregarTransacoes();

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
        console.error(err);
      }

    });

  }

  carregarCategorias(): void {

    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}`
    ).subscribe({

      next: (res) => {

        this.categorias = res;

        this.cdr.detectChanges();

      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  carregarTransacoes(): void {

    this.http.get<any[]>(
      `http://localhost:8080/transacao`
    ).subscribe({

      next: (res) => {

        this.listaTransacoes = res;

        this.cdr.detectChanges();

      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  // =========================
  // SALVAR
  // =========================

  salvarTransacao(): void {

    if (!this.dadosForm.contaId) {

      alert('Selecione uma conta');

      return;

    }

    const payload = {

      ...this.dadosForm,

      categoriaId: Number(
        this.dadosForm.categoriaId
      ),

      contaId: Number(
        this.dadosForm.contaId
      )

    };

    this.http.post(
      'http://localhost:8080/transacao',
      payload
    ).subscribe({

      next: () => {

        alert('Transação salva!');

        this.carregarTransacoes();

        this.carregarContas();

        this.resetarFormulario();

      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  // =========================
  // OFX
  // =========================

  selecionarArquivo(event: any): void {

    this.arquivoOFX =
      event.target.files[0];

  }

  importarOFX(): void {

    if (!this.arquivoOFX) {

      alert('Selecione um arquivo OFX');

      return;

    }

    if (!this.dadosForm.contaId) {

      alert('Selecione uma conta');

      return;

    }

    const formData = new FormData();

    formData.append(
      'file',
      this.arquivoOFX
    );

    formData.append(
      'contaId',
      this.dadosForm.contaId
    );

    this.http.post(
      'http://localhost:8080/ofx/upload',
      formData
    ).subscribe({

      next: () => {

        alert('OFX importado com sucesso!');

        this.carregarTransacoes();

        this.carregarContas();

      },

      error: (err) => {
        console.error(err);
      }

    });

  }

  // =========================
  // RESET
  // =========================

  resetarFormulario(): void {

    this.dadosForm = {

      descricao: '',

      valor: 0,

      data: new Date()
        .toISOString()
        .split('T')[0],

      categoriaId: '',

      contaId: '',

      tipo: 'DESPESA'

    };

    this.cdr.detectChanges();

  }

  // =========================
  // LOGOUT
  // =========================

  logout(): void {

    if (isPlatformBrowser(this.platformId)) {

      localStorage.removeItem(
        'usuarioLogado'
      );

      this.router.navigate(['/login']);

    }

  }

}