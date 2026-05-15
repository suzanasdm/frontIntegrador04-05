import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-despesa',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './despesa.html',
  styleUrl: './despesa.css',
})
export class Despesa implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Dados do Utilizador
  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  // Listas
  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaDespesas: any[] = [];

  // Estados de UI
  exibirSidebar: boolean = false;
  exibirInputCategoria = false;
  novaCategoriaNome = '';

  // Formulário ajustado com contaId
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

  carregarDados() {
    this.carregarCategorias();
    this.carregarDespesas();
    this.carregarContas();
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }

  carregarContas() {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.contasBancarias = res;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Erro ao buscar contas', err)
      });
  }

 carregarCategorias() {
  this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/DESPESA`)
    .subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar categorias de despesa:', err);
      }
    });
}

  carregarDespesas() {
    this.http.get<any[]>(`http://localhost:8080/api/despesas/usuario/${this.usuarioId}`)
      .subscribe(res => {
        this.listaDespesas = res;
        this.cdr.detectChanges(); // Garante que a conta apareça na tabela na hora
      });
  }

  salvarCategoria() {
  if (!this.novaCategoriaNome) return;

  const payload = {
    nome: this.novaCategoriaNome,
    tipo: 'DESPESA',
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

  salvarDespesa() {
    // Validação importante: Despesa precisa de uma conta de onde sair o dinheiro
    if (!this.dadosForm.contaId) {
      alert('Selecione uma conta para registrar a saída do valor!');
      return;
    }

    const payload = {
      ...this.dadosForm,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      contaId: Number(this.dadosForm.contaId) // Converte para número para o Java
    };

    this.http.post('http://localhost:8080/api/despesas', payload).subscribe({
      next: () => {
        alert('Despesa registrada e saldo atualizado!');
        this.carregarDespesas();
        this.carregarContas();
        this.resetarFormulario();
      },
      error: (err) => console.error('Erro ao salvar despesa', err)
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
