import { CommonModule, isPlatformBrowser } from '@angular/common';
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

@Component({
  selector: 'app-orcamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  categoriasMeta: any[] = [];
  listaOrcamentos: any[] = [];

  exibirSidebar: boolean = false;
  listaMetas: any[] = [];

  metaForm = {
  id: null as number | null,
  descricao: '',
  valorObjetivo: null as number | null,
  valorAtual: 0,
  prazo: '',
  prioridade: 'MEDIA',
  categoriaId: null as number | null
  };

  editandoMeta: boolean = false;

  dadosForm = {
    valorLimite: 0,
    categoriaId: '',
    mesAno: this.obterMesAtual()
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

  obterMesAtual(): string {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    return `${ano}-${mes}`;
  }

  carregarDados(): void {
    this.carregarCategorias();
    this.carregarCategoriasMeta();
    this.carregarContas();
    this.carregarOrcamentos();
     this.carregarMetas();
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
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
        console.error('Erro ao buscar contas', err);
      }
    });
  }

  carregarCategoriasMeta(): void {
  this.http.get<any[]>(
    `http://localhost:8080/api/categorias/usuario/${this.usuarioId}`
  ).subscribe({
    next: (res) => {
      this.categoriasMeta = res;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erro ao buscar categorias para metas', err);
      alert(err.error?.message || 'Erro ao carregar categorias para metas.');
    }
  });
}
  carregarCategorias(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/DESPESA`
    ).subscribe({
      next: (res) => {
        this.categorias = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar categorias de despesa', err);
        alert(err.error?.message || 'Erro ao carregar categorias de despesa.');
      }
    });
  }

  carregarOrcamentos(): void {
    if (!this.dadosForm.mesAno) {
      return;
    }

    this.http.get<any[]>(
      `http://localhost:8080/api/orcamentos/usuario/${this.usuarioId}?mesAno=${this.dadosForm.mesAno}`
    ).subscribe({
      next: (res) => {
        this.listaOrcamentos = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar orçamentos', err);
        alert(err.error?.message || 'Erro ao carregar orçamentos.');
      }
    });
  }

  salvarOrcamento(): void {
    if (!this.dadosForm.categoriaId) {
      alert('Selecione uma categoria.');
      return;
    }

    if (!this.dadosForm.valorLimite || Number(this.dadosForm.valorLimite) <= 0) {
      alert('Informe um limite maior que zero.');
      return;
    }

    if (!this.dadosForm.mesAno) {
      alert('Informe o mês de vigência.');
      return;
    }

    const payload = {
      valorLimite: Number(this.dadosForm.valorLimite),
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      mesAno: this.dadosForm.mesAno
    };

    this.http.post(
      'http://localhost:8080/api/orcamentos',
      payload
    ).subscribe({
      next: () => {
        alert('Orçamento definido com sucesso!');

        this.carregarOrcamentos();
        this.resetarFormularioMantendoMes();
      },
      error: (err) => {
        console.error('Erro ao salvar orçamento', err);
        alert(err.error?.message || 'Erro ao salvar orçamento.');
      }
    });
  }

  alterarMes(): void {
    this.carregarOrcamentos();
  }

  resetarFormularioMantendoMes(): void {
    const mesSelecionado = this.dadosForm.mesAno;

    this.dadosForm = {
      valorLimite: 0,
      categoriaId: '',
      mesAno: mesSelecionado
    };

    this.cdr.detectChanges();
  }

  calcularPorcentagem(gasto: number, limite: number): number {
    if (!limite || limite === 0) {
      return 0;
    }

    const porcentagem = (gasto / limite) * 100;

    return porcentagem > 100 ? 100 : porcentagem;
  }
  carregarMetas(): void {
  this.http.get<any[]>(
    `http://localhost:8080/api/metas/usuario/${this.usuarioId}`
  ).subscribe({
    next: (res) => {
      this.listaMetas = res;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erro ao buscar metas', err);
      alert(err.error?.message || 'Erro ao carregar metas.');
    }
  });
}

salvarMeta(): void {
  if (!this.metaForm.descricao || this.metaForm.descricao.trim() === '') {
    alert('Informe a descrição da meta.');
    return;
  }

  if (!this.metaForm.valorObjetivo || Number(this.metaForm.valorObjetivo) <= 0) {
    alert('Informe um valor objetivo maior que zero.');
    return;
  }

  if (this.metaForm.valorAtual < 0) {
    alert('O valor atual não pode ser negativo.');
    return;
  }

  if (!this.metaForm.prazo) {
    alert('Informe o prazo da meta.');
    return;
  }

  const payload = {
    descricao: this.metaForm.descricao,
    valorObjetivo: Number(this.metaForm.valorObjetivo),
    valorAtual: Number(this.metaForm.valorAtual || 0),
    prazo: this.metaForm.prazo,
    prioridade: this.metaForm.prioridade,
    usuarioId: this.usuarioId,
    categoriaId: this.metaForm.categoriaId ? Number(this.metaForm.categoriaId) : null
  };

  if (this.editandoMeta && this.metaForm.id) {
    this.http.put(
      `http://localhost:8080/api/metas/${this.metaForm.id}`,
      payload
    ).subscribe({
      next: () => {
        alert('Meta atualizada com sucesso!');
        this.carregarMetas();
        this.limparFormularioMeta();
      },
      error: (err) => {
        console.error('Erro ao atualizar meta', err);
        alert(err.error?.message || 'Erro ao atualizar meta.');
      }
    });

    return;
  }

  this.http.post(
    'http://localhost:8080/api/metas',
    payload
  ).subscribe({
    next: () => {
      alert('Meta cadastrada com sucesso!');
      this.carregarMetas();
      this.limparFormularioMeta();
    },
    error: (err) => {
      console.error('Erro ao salvar meta', err);
      alert(err.error?.message || 'Erro ao salvar meta.');
    }
  });
}

editarMeta(meta: any): void {
  this.editandoMeta = true;

  this.metaForm = {
    id: meta.id,
    descricao: meta.descricao,
    valorObjetivo: meta.valorObjetivo,
    valorAtual: meta.valorAtual,
    prazo: meta.prazo,
    prioridade: meta.prioridade,
    categoriaId: meta.categoriaId
  };

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

  this.cdr.detectChanges();
}

deletarMeta(id: number): void {
  const confirmar = confirm('Deseja realmente excluir esta meta?');

  if (!confirmar) {
    return;
  }

  this.http.delete(
    `http://localhost:8080/api/metas/${id}`
  ).subscribe({
    next: () => {
      alert('Meta excluída com sucesso!');
      this.carregarMetas();
    },
    error: (err) => {
      console.error('Erro ao excluir meta', err);
      alert(err.error?.message || 'Erro ao excluir meta.');
    }
  });
}

limparFormularioMeta(): void {
  this.editandoMeta = false;

  this.metaForm = {
    id: null,
    descricao: '',
    valorObjetivo: null,
    valorAtual: 0,
    prazo: '',
    prioridade: 'MEDIA',
    categoriaId: null
  };

  this.cdr.detectChanges();
}

calcularPorcentagemMeta(valorAtual: number, valorObjetivo: number): number {
  if (!valorObjetivo || valorObjetivo === 0) {
    return 0;
  }

  const porcentagem = (valorAtual / valorObjetivo) * 100;

  return porcentagem > 100 ? 100 : porcentagem;
}

  obterClasseStatusMeta(status: string): string {
  if (status === 'CONCLUIDA') {
    return 'meta-status-concluida';
  }

  if (status === 'ATRASADA') {
    return 'meta-status-atrasada';
  }

  return 'meta-status-andamento';
  }

obterClassePrioridade(prioridade: string): string {
  if (prioridade === 'ALTA') {
    return 'prioridade-alta';
  }

  if (prioridade === 'BAIXA') {
    return 'prioridade-baixa';
  }

  return 'prioridade-media';
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}
