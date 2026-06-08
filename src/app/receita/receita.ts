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
receitaEditando: any = null;

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

      if (!this.dadosForm.descricao.trim()) {
  alert('Informe a descrição da receita.');
  return;
}

if (!this.dadosForm.valor || Number(this.dadosForm.valor) <= 0) {
  alert('Informe um valor maior que zero.');
  return;
}

if (!this.dadosForm.data) {
  alert('Informe a data da receita.');
  return;
}

if (!this.dadosForm.categoriaId) {
  alert('Selecione uma categoria.');
  return;
}

if (!this.dadosForm.contaId) {
  alert('Selecione uma conta bancária.');
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
      error: (err) => {
  console.error('Erro ao salvar receita', err);
  alert(err.error?.message || 'Erro ao salvar receita.');
}
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
abrirEdicaoReceita(item: any): void {
  this.receitaEditando = item;

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

cancelarEdicaoReceita(): void {
  this.receitaEditando = null;

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

salvarEdicaoReceita(): void {
  if (!this.formEdicao.id) {
    alert('Nenhuma receita selecionada para edição.');
    return;
  }

  if (!this.formEdicao.descricao.trim()) {
    alert('Informe a descrição da receita.');
    return;
  }

  if (!this.formEdicao.valor || Number(this.formEdicao.valor) <= 0) {
    alert('Informe um valor maior que zero.');
    return;
  }

  if (!this.formEdicao.data) {
    alert('Informe a data da receita.');
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
    `http://localhost:8080/api/receitas/${this.formEdicao.id}`,
    payload
  ).subscribe({
    next: () => {
      alert('Receita atualizada com sucesso!');
      this.cancelarEdicaoReceita();
      this.carregarReceitas();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao editar receita', err);
      alert(err.error?.message || 'Erro ao editar receita.');
    }
  });
}

excluirReceita(item: any): void {
  const confirmar = confirm(
    `Deseja realmente excluir a receita "${item.descricao}"?`
  );

  if (!confirmar) {
    return;
  }

  this.http.delete(
    `http://localhost:8080/api/receitas/${item.id}?usuarioId=${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Receita excluída com sucesso!');
      this.carregarReceitas();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao excluir receita', err);
      alert(err.error?.message || 'Erro ao excluir receita.');
    }
  });
}
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}
