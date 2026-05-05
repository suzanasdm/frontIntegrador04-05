import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
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

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};
  contasBancarias: any[] = [];
  exibirSidebar: boolean = false;
  exibirInputCategoria = false;
  novaCategoriaNome = '';

  dadosForm = { descricao: '', valor: 0, data: '', categoriaId: '' };
  categorias: any[] = [];
  listaDespesas: any[] = [];

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

      this.carregarCategorias();
      this.carregarDespesas();
      this.carregarContas();
    }
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
  }

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

  carregarDespesas() {
    this.http.get<any[]>(`http://localhost:8080/api/despesas/usuario/${this.usuarioId}`)
      .subscribe(res => this.listaDespesas = res);
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

  salvarDespesa() {
    const payload = { ...this.dadosForm, usuarioId: this.usuarioId };
    this.http.post('http://localhost:8080/api/despesas', payload).subscribe({
      next: () => {
        this.carregarDespesas();
        this.dadosForm = { descricao: '', valor: 0, data: '', categoriaId: '' };
      },
      error: (err) => console.error('Erro ao salvar despesa', err)
    });
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}