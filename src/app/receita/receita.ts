import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
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

  // Dados do Utilizador
  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  // Listas para a Interface
  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaReceitas: any[] = [];

  // Estados de UI (Padrão visual Despesa)
  exibirSidebar: boolean = false;
  exibirInputCategoria: boolean = false;
  novaCategoriaNome: string = '';

  // LOGICA DE CONTAS: Adicionado contaId ao formulário
  dadosForm = { 
    descricao: '', 
    valor: 0, 
    data: new Date().toISOString().split('T')[0], 
    categoriaId: '',
    contaId: '' // Campo que armazenará o ID da conta selecionada
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
  }

  carregarDados() {
    this.carregarCategorias();
    this.carregarReceitas();
    this.carregarContas();
  }

  // LOGICA DE CONTAS: Busca as contas do usuário para preencher o Select e a Sidebar
  carregarContas() {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => this.contasBancarias = res,
        error: (err) => console.error('Erro ao buscar contas', err)
      });
  }

  carregarCategorias() {
    this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}`)
      .subscribe(res => this.categorias = res);
  }

  carregarReceitas() {
    this.http.get<any[]>(`http://localhost:8080/api/receitas/usuario/${this.usuarioId}`)
      .subscribe(res => this.listaReceitas = res);
  }

  salvarCategoria() {
    if (!this.novaCategoriaNome) return;
    const payload = { nome: this.novaCategoriaNome, usuarioId: this.usuarioId };
    this.http.post('http://localhost:8080/api/categorias', payload).subscribe((res: any) => {
      this.categorias.push(res);
      this.dadosForm.categoriaId = res.id;
      this.novaCategoriaNome = '';
      this.exibirInputCategoria = false;
    });
  }

  // LOGICA DE CONTAS: Salva a receita enviando o contaId para atualizar o saldo no Java
  salvarReceita() {
    if (!this.dadosForm.contaId) {
      alert('Selecione uma conta bancária para receber o valor!');
      return;
    }

    const payload = { 
      ...this.dadosForm, 
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      contaId: Number(this.dadosForm.contaId) // Envia o ID numérico
    };
    
    this.http.post('http://localhost:8080/api/receitas', payload).subscribe({
      next: () => {
        alert('Receita registrada e saldo atualizado!');
        this.carregarReceitas();
        this.carregarContas(); // Recarrega as contas para atualizar o saldo na Sidebar
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
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}