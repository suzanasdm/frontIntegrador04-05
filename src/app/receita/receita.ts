import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-receita',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './receita.html',
  styleUrl: './receita.css',
})
export class Receita implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // Injetado para forçar a atualização da tela

  // Dados do Utilizador
  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  // Listas para a Interface
  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaReceitas: any[] = [];

  // Estados de UI
  exibirSidebar: boolean = false;
  exibirInputCategoria: boolean = false;
  novaCategoriaNome: string = '';

  // LOGICA DE FORMULÁRIO
  dadosForm = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    categoriaId: '',
    contaId: ''
  };

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

      this.carregarDados();
    }
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges(); // Garante que a sidebar abra/feche suavemente
  }

  carregarDados() {
    this.carregarCategorias();
    this.carregarReceitas();
    this.carregarContas();
  }

  carregarContas() {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.contasBancarias = res;
          this.cdr.detectChanges(); // Atualiza os saldos na sidebar automaticamente
        },
        error: (err) => console.error('Erro ao buscar contas', err)
      });
  }

  carregarCategorias() {
  this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/RECEITA`)
    .subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar categorias de receita:', err);
      }
    });
}

  carregarReceitas() {
    this.http.get<any[]>(`http://localhost:8080/api/receitas/usuario/${this.usuarioId}`)
      .subscribe(res => {
        this.listaReceitas = res;
        this.cdr.detectChanges(); // Faz as novas receitas aparecerem na tabela na hora
      });
  }

  salvarCategoria() {
  if (!this.novaCategoriaNome) return;

  const payload = {
    nome: this.novaCategoriaNome,
    tipo: 'RECEITA',
    usuarioId: this.usuarioId
  };

  this.http.post('http://localhost:8080/api/categorias', payload).subscribe((res: any) => {
    this.categorias.push(res);
    this.dadosForm.categoriaId = res.id;
    this.novaCategoriaNome = '';
    this.exibirInputCategoria = false;
    this.cdr.detectChanges();
  });
}

  salvarReceita() {
    if (!this.dadosForm.contaId) {
      alert('Selecione uma conta bancária para receber o valor!');
      return;
    }

    const payload = {
      ...this.dadosForm,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      contaId: Number(this.dadosForm.contaId)
    };

    this.http.post('http://localhost:8080/api/receitas', payload).subscribe({
      next: () => {
        alert('Receita registrada e saldo atualizado!');
        this.carregarReceitas(); // Dispara o carregar que já tem o detectChanges
        this.carregarContas();   // Dispara o carregar que já tem o detectChanges
        this.resetarFormulario();
      },
      error: (err) => console.error('Erro ao salvar receita', err)
    });
  }

  resetarFormulario() {
    this.dadosForm = {
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      categoriaId: '',
      contaId: ''
    };
    this.cdr.detectChanges();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}
