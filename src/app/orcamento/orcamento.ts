import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router  , RouterModule} from '@angular/router';

@Component({
  selector: 'app-orcamento',
  standalone: true,
  imports: [CommonModule , FormsModule, RouterModule],
  templateUrl: './orcamento.html',
  styleUrl: './orcamento.css',
})
export class Orcamento implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};
  
  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaOrcamentos: any[] = [];

  exibirSidebar: boolean = false;

  // Form estruturado para o OrcamentoDTO do Java
  dadosForm = {
    valorLimite: 0,
    categoriaId: '',
    mesAno: new Date().toISOString().substring(0, 7) // Gera "2026-05" (Ano-Mês atual)
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
    this.carregarContas(); // Mantém saldos atualizados na Sidebar
    this.carregarOrcamentos();
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
    this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}`)
      .subscribe(res => { 
        this.categorias = res; 
        this.cdr.detectChanges(); 
      });
  }

  carregarOrcamentos() {
    this.http.get<any[]>(`http://localhost:8080/api/orcamentos/usuario/${this.usuarioId}`)
      .subscribe(res => {
        this.listaOrcamentos = res;
        this.cdr.detectChanges(); // Renderiza as barras de progresso instantaneamente
      });
  }

  salvarOrcamento() {
    if (!this.dadosForm.categoriaId || this.dadosForm.valorLimite <= 0) {
      alert('Selecione uma categoria e insira um limite válido!');
      return;
    }

    const payload = {
      ...this.dadosForm,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId)
    };

    this.http.post('http://localhost:8080/api/orcamentos', payload).subscribe({
      next: () => {
        alert('Orçamento definido com sucesso!');
        this.carregarOrcamentos(); // Recarrega a lista trazendo a nova meta
        this.resetarFormulario();
      },
      error: (err) => console.error('Erro ao salvar orçamento', err)
    });
  }

  resetarFormulario() {
    this.dadosForm = {
      valorLimite: 0,
      categoriaId: '',
      mesAno: new Date().toISOString().substring(0, 7)
    };
    this.cdr.detectChanges();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }

  // Calcula a largura da barra de progresso sem deixar passar de 100% no CSS
  calcularPorcentagem(gasto: number, limite: number): number {
    if (!limite || limite === 0) return 0;
    const porcentagem = (gasto / limite) * 100;
    return porcentagem > 100 ? 100 : porcentagem;
  }
}
