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
  private cdr = inject(ChangeDetectorRef);


  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};


  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaReceitas: any[] = [];

  confirmacao = {
  visivel: false,
  titulo: '',
  mensagem: '',
  textoConfirmar: 'Confirmar',
  textoCancelar: 'Cancelar',
  acao: null as (() => void) | null
};

  exibirSidebar: boolean = false;
  exibirInputCategoria: boolean = false;
  novaCategoriaNome: string = '';


  notificacao = {
    visivel: false,
    tipo: 'sucesso' as 'sucesso' | 'erro' | 'aviso',
    titulo: '',
    mensagem: ''
  };

  private timeoutNotificacao: any;


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

abrirConfirmacao(
  titulo: string,
  mensagem: string,
  acao: () => void,
  textoConfirmar: string = 'Confirmar',
  textoCancelar: string = 'Cancelar'
): void {
  this.confirmacao = {
    visivel: true,
    titulo,
    mensagem,
    textoConfirmar,
    textoCancelar,
    acao
  };

  this.cdr.detectChanges();
}

cancelarConfirmacao(): void {
  this.confirmacao = {
    visivel: false,
    titulo: '',
    mensagem: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    acao: null
  };

  this.cdr.detectChanges();
}

confirmarAcao(): void {
  if (this.confirmacao.acao) {
    this.confirmacao.acao();
  }

  this.cancelarConfirmacao();
}
  mostrarNotificacao(
    tipo: 'sucesso' | 'erro' | 'aviso',
    titulo: string,
    mensagem: string
  ): void {
    this.notificacao = {
      visivel: true,
      tipo,
      titulo,
      mensagem
    };

    this.cdr.detectChanges();

    clearTimeout(this.timeoutNotificacao);

    this.timeoutNotificacao = setTimeout(() => {
      this.fecharNotificacao();
    }, 3500);
  }

  fecharNotificacao(): void {
    this.notificacao.visivel = false;
    this.cdr.detectChanges();
  }



  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }


  carregarDados(): void {
    this.carregarCategorias();
    this.carregarReceitas();
    this.carregarContas();
  }

  carregarContas(): void {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.contasBancarias = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao buscar contas', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar contas',
            err.error?.message || 'Não foi possível buscar suas contas bancárias.'
          );
        }
      });
  }

  carregarCategorias(): void {
    this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/RECEITA`)
      .subscribe({
        next: (res) => {
          this.categorias = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar categorias de receita:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar categorias',
            err.error?.message || 'Não foi possível buscar as categorias de receita.'
          );
        }
      });
  }

  carregarReceitas(): void {
    this.http.get<any[]>(`http://localhost:8080/api/receitas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.listaReceitas = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar receitas', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar receitas',
            err.error?.message || 'Não foi possível buscar suas receitas cadastradas.'
          );
        }
      });
  }



  salvarCategoria(): void {
    if (!this.novaCategoriaNome.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Categoria vazia',
        'Informe o nome da categoria antes de salvar.'
      );
      return;
    }

    const payload = {
      nome: this.novaCategoriaNome.trim(),
      tipo: 'RECEITA',
      usuarioId: this.usuarioId
    };

    this.http.post('http://localhost:8080/api/categorias', payload).subscribe({
      next: (res: any) => {
        this.categorias.push(res);
        this.dadosForm.categoriaId = String(res.id);
        this.novaCategoriaNome = '';
        this.exibirInputCategoria = false;

        this.mostrarNotificacao(
          'sucesso',
          'Categoria criada!',
          'A nova categoria de receita foi adicionada com sucesso.'
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao salvar categoria', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao criar categoria',
          err.error?.message || 'Não foi possível cadastrar a categoria.'
        );
      }
    });
  }


  salvarReceita(): void {
    if (!this.dadosForm.descricao.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a descrição da receita.'
      );
      return;
    }

    if (!this.dadosForm.valor || Number(this.dadosForm.valor) <= 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor inválido',
        'Informe um valor maior que zero.'
      );
      return;
    }

    if (!this.dadosForm.data) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a data da receita.'
      );
      return;
    }

    if (!this.dadosForm.categoriaId) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Selecione uma categoria.'
      );
      return;
    }

    if (!this.dadosForm.contaId) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Selecione uma conta bancária para receber o valor.'
      );
      return;
    }

    const payload = {
      descricao: this.dadosForm.descricao.trim(),
      valor: Number(this.dadosForm.valor),
      data: this.dadosForm.data,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      contaId: Number(this.dadosForm.contaId)
    };

    this.http.post('http://localhost:8080/api/receitas', payload).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Receita cadastrada!',
          'A receita foi registrada e o saldo da conta foi atualizado.'
        );

        this.carregarReceitas();
        this.carregarContas();
        this.resetarFormulario();
      },
      error: (err) => {
        console.error('Erro ao salvar receita', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao salvar receita',
          err.error?.message || 'Não foi possível cadastrar a receita.'
        );
      }
    });
  }

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

    this.mostrarNotificacao(
      'aviso',
      'Editando receita',
      `Você está editando a receita "${item.descricao}".`
    );

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

    this.mostrarNotificacao(
      'aviso',
      'Edição cancelada',
      'Nenhuma alteração foi salva.'
    );

    this.cdr.detectChanges();
  }

  salvarEdicaoReceita(): void {
    if (!this.formEdicao.id) {
      this.mostrarNotificacao(
        'aviso',
        'Nenhuma receita selecionada',
        'Selecione uma receita para editar.'
      );
      return;
    }

    if (!this.formEdicao.descricao.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a descrição da receita.'
      );
      return;
    }

    if (!this.formEdicao.valor || Number(this.formEdicao.valor) <= 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor inválido',
        'Informe um valor maior que zero.'
      );
      return;
    }

    if (!this.formEdicao.data) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a data da receita.'
      );
      return;
    }

    if (!this.formEdicao.categoriaId) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Selecione uma categoria.'
      );
      return;
    }

    if (!this.formEdicao.contaId) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Selecione uma conta bancária.'
      );
      return;
    }

    const payload = {
      descricao: this.formEdicao.descricao.trim(),
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
        this.mostrarNotificacao(
          'sucesso',
          'Receita atualizada!',
          'As informações da receita foram salvas com sucesso.'
        );

        this.cancelarEdicaoSemMensagem();
        this.carregarReceitas();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao editar receita', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao editar receita',
          err.error?.message || 'Não foi possível atualizar a receita.'
        );
      }
    });
  }

  private cancelarEdicaoSemMensagem(): void {
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



 excluirReceita(item: any): void {
  this.abrirConfirmacao(
    'Excluir receita?',
    `Deseja realmente excluir a receita "${item.descricao}"? Essa ação também atualizará o saldo da conta vinculada.`,
    () => {
      this.http.delete(
        `http://localhost:8080/api/receitas/${item.id}/usuario/${this.usuarioId}`
      ).subscribe({
        next: () => {
          this.mostrarNotificacao(
            'sucesso',
            'Receita excluída!',
            'A receita foi removida e o saldo da conta foi atualizado.'
          );

          this.carregarReceitas();
          this.carregarContas();
        },
        error: (err) => {
          console.error('Erro ao excluir receita', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao excluir receita',
            err.error?.message || 'Não foi possível excluir a receita.'
          );
        }
      });
    },
    'Excluir',
    'Cancelar'
  );
}



  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');

      this.mostrarNotificacao(
        'sucesso',
        'Sessão encerrada',
        'Você saiu do CyberSoft com segurança.'
      );

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 700);
    }
  }
}
