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

  // =========================
  // DADOS USUÁRIO
  // =========================

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  // =========================
  // LISTAS
  // =========================

  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaDespesas: any[] = [];

  // =========================
  // CONTROLE UI
  // =========================

  exibirSidebar: boolean = false;

  exibirInputCategoria: boolean = false;

  novaCategoriaNome: string = '';

  // =========================
  // FORMULÁRIO
  // =========================

  dadosForm = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    categoriaId: '',
    contaId: ''
  };

despesaEditando: any = null;

formEdicao = {
  id: null as number | null,
  descricao: '',
  valor: 0,
  data: '',
  categoriaId: '',
  contaId: ''
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

  // =========================
  // CARREGAR DADOS
  // =========================

  carregarDados(): void {
    this.carregarCategorias();
    this.carregarDespesas();
    this.carregarContas();
  }

  // =========================
  // SIDEBAR
  // =========================

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }

  // =========================
  // CONTAS
  // =========================

  carregarContas(): void {

    this.http.get<any[]>(
      `http://localhost:8080/api/contas/usuario/${this.usuarioId}`
    )
    .subscribe({

      next: (res) => {

        this.contasBancarias = res;

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('Erro ao carregar contas:', err);
      }

    });
  }

  // =========================
  // CATEGORIAS
  // =========================

  carregarCategorias(): void {

    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/DESPESA`
    )
    .subscribe({

      next: (res) => {

        this.categorias = res;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Erro ao carregar categorias:', err);
      }

    });
  }

  // =========================
  // DESPESAS
  // =========================

  carregarDespesas(): void {

    this.http.get<any[]>(
      `http://localhost:8080/api/despesas/usuario/${this.usuarioId}`
    )
    .subscribe({

      next: (res) => {

        this.listaDespesas = res;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('Erro ao carregar despesas:', err);
      }

    });
  }

  // =========================
  // SALVAR CATEGORIA
  // =========================

  salvarCategoria(): void {

    if (!this.novaCategoriaNome.trim()) {

      alert('Informe o nome da categoria.');

      return;
    }

    const payload = {

      nome: this.novaCategoriaNome,

      tipo: 'DESPESA',

      usuarioId: this.usuarioId
    };

    this.http.post(
      'http://localhost:8080/api/categorias',
      payload
    )
    .subscribe({

      next: (res: any) => {

        // adiciona na lista
        this.categorias.push(res);

        // seleciona automaticamente
        this.dadosForm.categoriaId = res.id;

        // limpa campo
        this.novaCategoriaNome = '';

        // fecha input
        this.exibirInputCategoria = false;

        this.cdr.detectChanges();

        alert('Categoria cadastrada com sucesso!');
      },

      error: (err) => {

        console.error('Erro ao salvar categoria:', err);

        alert(
          err.error?.message ||
          'Erro ao cadastrar categoria.'
        );
      }

    });
  }

  // =========================
  // SALVAR DESPESA
  // =========================

  salvarDespesa(): void {

    // DESCRIÇÃO

    if (!this.dadosForm.descricao.trim()) {

      alert('Informe a descrição da despesa.');

      return;
    }

    // VALOR

    if (!this.dadosForm.valor ||
        Number(this.dadosForm.valor) <= 0) {

      alert('Informe um valor maior que zero.');

      return;
    }

    // DATA

    if (!this.dadosForm.data) {

      alert('Informe a data da despesa.');

      return;
    }

    // CATEGORIA

    if (!this.dadosForm.categoriaId) {

      alert('Selecione uma categoria.');

      return;
    }

    // CONTA

    if (!this.dadosForm.contaId) {

      alert('Selecione uma conta bancária.');

      return;
    }

    // PAYLOAD

    const payload = {

      descricao: this.dadosForm.descricao,

      valor: Number(this.dadosForm.valor),

      data: this.dadosForm.data,

      categoriaId: Number(this.dadosForm.categoriaId),

      contaId: Number(this.dadosForm.contaId),

      usuarioId: this.usuarioId
    };

    this.http.post(
      'http://localhost:8080/api/despesas',
      payload
    )
    .subscribe({

      next: () => {

        alert('Despesa registrada com sucesso!');

        this.carregarDespesas();

        this.carregarContas();

        this.resetarFormulario();
      },

      error: (err) => {

        console.error('Erro ao salvar despesa:', err);

        alert(
          err.error?.message ||
          'Erro ao salvar despesa.'
        );
      }

    });
  }

  // =========================
  // RESETAR FORMULÁRIO
  // =========================

  resetarFormulario(): void {

    this.dadosForm = {

      descricao: '',

      valor: 0,

      data: new Date().toISOString().split('T')[0],

      categoriaId: '',

      contaId: ''
    };

    this.cdr.detectChanges();
  }

  abrirEdicaoDespesa(item: any): void {
  this.despesaEditando = item;

  this.formEdicao = {
    id: item.id,
    descricao: item.descricao,
    valor: item.valor,
    data: item.data,
    categoriaId: item.categoria?.id ? String(item.categoria.id) : '',
    contaId: item.conta?.id ? String(item.conta.id) : ''
  };

  setTimeout(() => {
    const card = document.querySelector('.edit-card');
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);

  this.cdr.detectChanges();
}

cancelarEdicaoDespesa(): void {
  this.despesaEditando = null;

  this.formEdicao = {
    id: null,
    descricao: '',
    valor: 0,
    data: '',
    categoriaId: '',
    contaId: ''
  };

  this.cdr.detectChanges();
}

salvarEdicaoDespesa(): void {
  if (!this.formEdicao.id) {
    alert('Nenhuma despesa selecionada para edição.');
    return;
  }

  if (!this.formEdicao.descricao.trim()) {
    alert('Informe a descrição da despesa.');
    return;
  }

  if (!this.formEdicao.valor || Number(this.formEdicao.valor) <= 0) {
    alert('Informe um valor maior que zero.');
    return;
  }

  if (!this.formEdicao.data) {
    alert('Informe a data da despesa.');
    return;
  }

  if (!this.formEdicao.categoriaId) {
    alert('Selecione uma categoria.');
    return;
  }

  if (!this.formEdicao.contaId) {
    alert('Selecione uma conta.');
    return;
  }

  const payload = {
    descricao: this.formEdicao.descricao,
    valor: Number(this.formEdicao.valor),
    data: this.formEdicao.data,
    categoriaId: Number(this.formEdicao.categoriaId),
    contaId: Number(this.formEdicao.contaId),
    usuarioId: this.usuarioId
  };

  this.http.put(
    `http://localhost:8080/api/despesas/${this.formEdicao.id}`,
    payload
  ).subscribe({
    next: () => {
      alert('Despesa atualizada com sucesso!');
      this.cancelarEdicaoDespesa();
      this.carregarDespesas();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao editar despesa', err);
      alert(err.error?.message || 'Erro ao editar despesa.');
    }
  });
}

excluirDespesa(item: any): void {
  const confirmar = confirm(
    `Deseja realmente excluir a despesa "${item.descricao}"?`
  );

  if (!confirmar) {
    return;
  }

  this.http.delete(
    `http://localhost:8080/api/despesas/${item.id}?usuarioId=${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Despesa excluída com sucesso!');
      this.carregarDespesas();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao excluir despesa', err);
      alert(err.error?.message || 'Erro ao excluir despesa.');
    }
  });
}

  logout(): void {

    if (isPlatformBrowser(this.platformId)) {

      localStorage.removeItem('usuarioLogado');

      this.router.navigate(['/login']);
    }
  }
}
