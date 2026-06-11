import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-transacao',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transacao.html',
  styleUrl: './transacao.css',
})
export class Transacao implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  contasBancarias: any[] = [];
  categorias: any[] = [];
  listaTransacoes: any[] = [];
  listaTransacoesFiltradas: any[] = [];
  arquivosOfx: any[] = [];

  exibirNovaCategoriaEdicao: boolean = false;
  novaCategoriaEdicao: string = '';

  filtroTipo: string = 'TODOS';
  exibirSidebar: boolean = false;
  arquivoOFX!: File;

  notificacao = {
    visivel: false,
    tipo: 'sucesso' as 'sucesso' | 'erro' | 'aviso',
    titulo: '',
    mensagem: ''
  };

  private timeoutNotificacao: any;

  confirmacao = {
    visivel: false,
    titulo: '',
    mensagem: '',
    textoConfirmar: 'Confirmar',
    textoCancelar: 'Cancelar',
    acao: null as (() => void) | null
  };

  dadosForm = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    categoriaId: '',
    contaId: '',
    tipo: 'DESPESA'
  };

  itemEditando: any = null;
  categoriasEdicao: any[] = [];

  formEdicao = {
    id: null as number | null,
    origem: '',
    descricao: '',
    valor: 0,
    data: '',
    tipo: '',
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

  normalizarOrigem(origem: any): string {
    return String(origem || '').trim().toUpperCase();
  }

  ehOfx(item: any): boolean {
    return this.normalizarOrigem(item?.origem).includes('OFX');
  }

  ehManual(item: any): boolean {
    return this.normalizarOrigem(item?.origem).includes('MANUAL');
  }

  ehOfxEditando(): boolean {
    return this.normalizarOrigem(this.formEdicao.origem).includes('OFX');
  }

  ehManualEditando(): boolean {
    return this.normalizarOrigem(this.formEdicao.origem).includes('MANUAL');
  }

  obterIdItem(item: any): number | null {
    return item?.id ?? item?.transacaoId ?? item?.receitaId ?? item?.despesaId ?? null;
  }

  obterCategoriaId(item: any): string {
    const id =
      item?.categoriaId ??
      item?.categoria?.id ??
      item?.categoria_id ??
      null;

    return id ? String(id) : '';
  }

  obterContaId(item: any): string {
    const id =
      item?.contaId ??
      item?.conta?.id ??
      item?.conta_id ??
      null;

    return id ? String(id) : '';
  }

  formatarDataParaInput(data: any): string {
    if (!data) {
      return '';
    }

    return String(data).substring(0, 10);
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


  abrirConfirmacao(
    titulo: string,
    mensagem: string,
    acao: () => void,
    textoConfirmar: string = 'Confirmar',
    textoCancelar: string = 'Cancelar'
  ): void {
    this.fecharNotificacao();

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
    const acao = this.confirmacao.acao;

    this.cancelarConfirmacao();

    if (acao) {
      acao();
    }
  }



  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }


  carregarDados(): void {
    this.carregarContas();
    this.carregarCategorias();
    this.carregarTransacoes();
    this.carregarArquivosOfx();
  }

  carregarContas(): void {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.contasBancarias = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar contas:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar contas',
            err.error?.message || 'Não foi possível buscar suas contas bancárias.'
          );
        }
      });
  }

  carregarCategorias(): void {
    this.http.get<any[]>(`http://localhost:8080/api/categorias/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.categorias = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar categorias:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar categorias',
            err.error?.message || 'Não foi possível buscar suas categorias.'
          );
        }
      });
  }

  carregarTransacoes(): void {
    this.http.get<any[]>(`http://localhost:8080/api/movimentacoes/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.listaTransacoes = res;
          this.aplicarFiltroTipo();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar movimentações:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar transações',
            err.error?.message || 'Não foi possível buscar suas movimentações.'
          );
        }
      });
  }

  carregarArquivosOfx(): void {
    this.http.get<any[]>(`http://localhost:8080/api/ofx/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.arquivosOfx = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao carregar arquivos OFX:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar arquivos OFX',
            err.error?.message || 'Não foi possível buscar os arquivos OFX importados.'
          );
        }
      });
  }



  alterarFiltroTipo(tipo: string): void {
    this.filtroTipo = tipo;
    this.aplicarFiltroTipo();
  }

  aplicarFiltroTipo(): void {
    if (this.filtroTipo === 'TODOS') {
      this.listaTransacoesFiltradas = this.listaTransacoes;
      return;
    }

    this.listaTransacoesFiltradas = this.listaTransacoes.filter(
      item => item.tipo === this.filtroTipo
    );
  }



  selecionarArquivo(event: any): void {
    const arquivoSelecionado = event.target.files[0];

    if (arquivoSelecionado) {
      this.arquivoOFX = arquivoSelecionado;

      this.mostrarNotificacao(
        'sucesso',
        'Arquivo selecionado',
        `Arquivo "${arquivoSelecionado.name}" pronto para importação.`
      );
    }
  }

  importarOFX(): void {
    if (!this.arquivoOFX) {
      this.mostrarNotificacao(
        'aviso',
        'Arquivo obrigatório',
        'Selecione um arquivo OFX antes de importar.'
      );
      return;
    }

    if (!this.dadosForm.contaId) {
      this.mostrarNotificacao(
        'aviso',
        'Conta obrigatória',
        'Selecione uma conta bancária antes de importar o OFX.'
      );
      return;
    }

    const formData = new FormData();
    formData.append('file', this.arquivoOFX);
    formData.append('contaId', this.dadosForm.contaId.toString());
    formData.append('usuarioId', this.usuarioId.toString());

    this.http.post(
      'http://localhost:8080/api/ofx/upload',
      formData,
      { responseType: 'text' }
    ).subscribe({
      next: (res) => {
        this.mostrarNotificacao(
          'sucesso',
          'OFX importado!',
          res || 'Arquivo OFX importado com sucesso.'
        );

        this.carregarArquivosOfx();
        this.carregarTransacoes();
        this.carregarContas();

        this.arquivoOFX = undefined as any;
        this.dadosForm.contaId = '';

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao importar OFX:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao importar OFX',
          err.error?.message || err.error || 'Não foi possível importar o arquivo OFX.'
        );
      }
    });
  }

  excluirArquivoOfx(arquivo: any): void {
    if (!arquivo?.id) {
      this.mostrarNotificacao(
        'erro',
        'Arquivo inválido',
        'Não foi possível identificar o arquivo OFX para exclusão.'
      );
      return;
    }

    this.abrirConfirmacao(
      'Excluir arquivo OFX?',
      `Deseja realmente excluir o arquivo "${arquivo.nomeArquivo}"? Todas as transações importadas por esse arquivo também serão removidas.`,
      () => this.executarExclusaoArquivoOfx(arquivo),
      'Excluir',
      'Cancelar'
    );
  }

  executarExclusaoArquivoOfx(arquivo: any): void {
    this.http.delete(
      `http://localhost:8080/api/ofx/${arquivo.id}/usuario/${this.usuarioId}`
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Arquivo OFX excluído!',
          'O arquivo e suas transações vinculadas foram removidos com sucesso.'
        );

        this.carregarArquivosOfx();
        this.carregarTransacoes();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao excluir arquivo OFX:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir OFX',
          err.error?.message || err.error || 'Não foi possível excluir o arquivo OFX.'
        );
      }
    });
  }


  abrirEdicao(item: any): void {
    const id = this.obterIdItem(item);

    if (!id) {
      this.mostrarNotificacao(
        'erro',
        'Item inválido',
        'Não foi possível identificar a movimentação selecionada.'
      );
      return;
    }

    this.itemEditando = item;

    this.formEdicao = {
      id,
      origem: this.normalizarOrigem(item.origem),
      descricao: item.descricao || '',
      valor: Number(item.valor || 0),
      data: this.formatarDataParaInput(item.data),
      tipo: item.tipo || '',
      categoriaId: this.obterCategoriaId(item),
      contaId: this.obterContaId(item)
    };

    this.carregarCategoriasPorTipoEdicao();

    this.mostrarNotificacao(
      'aviso',
      'Editando transação',
      `Você está editando a movimentação "${item.descricao}".`
    );

    setTimeout(() => {
      const card = document.querySelector('.edit-card');
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    this.cdr.detectChanges();
  }

  cancelarEdicao(): void {
    this.itemEditando = null;

    this.formEdicao = {
      id: null,
      origem: '',
      descricao: '',
      valor: 0,
      data: '',
      tipo: '',
      categoriaId: '',
      contaId: ''
    };

    this.categoriasEdicao = [];
    this.exibirNovaCategoriaEdicao = false;
    this.novaCategoriaEdicao = '';

    this.mostrarNotificacao(
      'aviso',
      'Edição cancelada',
      'Nenhuma alteração foi salva.'
    );

    this.cdr.detectChanges();
  }

  private cancelarEdicaoSemMensagem(): void {
    this.itemEditando = null;

    this.formEdicao = {
      id: null,
      origem: '',
      descricao: '',
      valor: 0,
      data: '',
      tipo: '',
      categoriaId: '',
      contaId: ''
    };

    this.categoriasEdicao = [];
    this.exibirNovaCategoriaEdicao = false;
    this.novaCategoriaEdicao = '';

    this.cdr.detectChanges();
  }

  salvarEdicao(): void {
    if (!this.formEdicao.id) {
      this.mostrarNotificacao(
        'aviso',
        'Nenhum item selecionado',
        'Selecione uma transação para editar.'
      );
      return;
    }

    if (!this.formEdicao.descricao.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a descrição.'
      );
      return;
    }

    if (!this.formEdicao.data) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe a data.'
      );
      return;
    }

    if (!this.formEdicao.valor || Number(this.formEdicao.valor) === 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor inválido',
        'Informe um valor diferente de zero.'
      );
      return;
    }

    if (!this.formEdicao.tipo) {
      this.mostrarNotificacao(
        'aviso',
        'Campo obrigatório',
        'Informe o tipo da movimentação.'
      );
      return;
    }

    if (this.ehOfxEditando()) {
      this.salvarEdicaoOFX();
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

    if (this.formEdicao.tipo === 'RECEITA') {
      this.salvarEdicaoReceita();
      return;
    }

    if (this.formEdicao.tipo === 'DESPESA') {
      this.salvarEdicaoDespesa();
      return;
    }

    this.mostrarNotificacao(
      'erro',
      'Tipo não reconhecido',
      'Não foi possível identificar o tipo da movimentação.'
    );
  }

  salvarEdicaoOFX(): void {
  const payload = {
    descricao: this.formEdicao.descricao.trim(),
    tipo: this.formEdicao.tipo,
    categoriaId: this.formEdicao.categoriaId
      ? Number(this.formEdicao.categoriaId)
      : null,
    usuarioId: this.usuarioId
  };

  this.http.put(
    `http://localhost:8080/api/transacoes/${this.formEdicao.id}`,
    payload
  ).subscribe({
    next: () => {
      this.mostrarNotificacao(
        'sucesso',
        'Transação OFX atualizada!',
        'A descrição, tipo ou categoria da movimentação foram atualizados com sucesso.'
      );

      this.recarregarAposEdicao();
    },
    error: (err) => {
      console.error('Erro ao editar transação OFX:', err);

      this.mostrarNotificacao(
        'erro',
        'Erro ao editar OFX',
        err.error?.message || err.error || 'Não foi possível editar a transação OFX.'
      );
    }

  });

}

  salvarEdicaoReceita(): void {
    const payload = {
      descricao: this.formEdicao.descricao.trim(),
      valor: Math.abs(Number(this.formEdicao.valor)),
      data: this.formEdicao.data,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.formEdicao.categoriaId),
      contaId: Number(this.formEdicao.contaId)
    };

    this.http.put(
      `http://localhost:8080/api/receitas/${this.formEdicao.id}`,
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Receita atualizada!',
          'A receita foi atualizada e o saldo da conta foi recalculado.'
        );

        this.recarregarAposEdicao();
      },
      error: (err) => {
        console.error('Erro ao editar receita:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao editar receita',
          err.error?.message || err.error || 'Não foi possível editar a receita.'
        );
      }
    });
  }

  salvarEdicaoDespesa(): void {
    const payload = {
      descricao: this.formEdicao.descricao.trim(),
      valor: Math.abs(Number(this.formEdicao.valor)),
      data: this.formEdicao.data,
      usuarioId: this.usuarioId,
      categoriaId: Number(this.formEdicao.categoriaId),
      contaId: Number(this.formEdicao.contaId)
    };

    this.http.put(
      `http://localhost:8080/api/despesas/${this.formEdicao.id}`,
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Despesa atualizada!',
          'A despesa foi atualizada e o saldo da conta foi recalculado.'
        );

        this.recarregarAposEdicao();
      },
      error: (err) => {
        console.error('Erro ao editar despesa:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao editar despesa',
          err.error?.message || err.error || 'Não foi possível editar a despesa.'
        );
      }
    });
  }

  recarregarAposEdicao(): void {
    this.filtroTipo = 'TODOS';
    this.cancelarEdicaoSemMensagem();
    this.carregarTransacoes();
    this.carregarContas();
    this.carregarArquivosOfx();
  }



  toggleNovaCategoriaEdicao(): void {
    this.exibirNovaCategoriaEdicao = !this.exibirNovaCategoriaEdicao;

    if (!this.exibirNovaCategoriaEdicao) {
      this.novaCategoriaEdicao = '';
    }

    this.cdr.detectChanges();
  }

  carregarCategoriasPorTipoEdicao(): void {
    if (!this.formEdicao.tipo) {
      this.categoriasEdicao = [];
      return;
    }

    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/${this.formEdicao.tipo}`
    ).subscribe({
      next: (res) => {
        this.categoriasEdicao = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar categorias da edição:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar categorias',
          err.error?.message || 'Não foi possível buscar as categorias para edição.'
        );
      }
    });
  }

  criarCategoriaNaEdicao(): void {
    if (!this.novaCategoriaEdicao.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Categoria vazia',
        'Informe o nome da categoria.'
      );
      return;
    }

    if (!this.formEdicao.tipo) {
      this.mostrarNotificacao(
        'aviso',
        'Tipo obrigatório',
        'Informe o tipo da movimentação antes de criar a categoria.'
      );
      return;
    }

    const payload = {
      nome: this.novaCategoriaEdicao.trim(),
      tipo: this.formEdicao.tipo,
      usuarioId: this.usuarioId
    };

    this.http.post<any>(
      'http://localhost:8080/api/categorias',
      payload
    ).subscribe({
      next: (categoriaCriada) => {
        this.mostrarNotificacao(
          'sucesso',
          'Categoria criada!',
          'A categoria foi criada e selecionada na edição.'
        );

        this.novaCategoriaEdicao = '';
        this.exibirNovaCategoriaEdicao = false;

        this.carregarCategoriasPorTipoEdicao();

        setTimeout(() => {
          this.formEdicao.categoriaId = String(categoriaCriada.id);
          this.cdr.detectChanges();
        }, 200);
      },
      error: (err) => {
        console.error('Erro ao criar categoria:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao criar categoria',
          err.error?.message || err.error || 'Não foi possível criar a categoria.'
        );
      }
    });
  }



  excluirMovimentacao(item: any): void {
    const id = this.obterIdItem(item);

    if (!id) {
      this.mostrarNotificacao(
        'erro',
        'Item inválido',
        'Não foi possível identificar a movimentação para exclusão.'
      );
      return;
    }

    this.abrirConfirmacao(
      'Excluir movimentação?',
      `Deseja realmente excluir a movimentação "${item.descricao}"? O saldo da conta poderá ser atualizado.`,
      () => {
        if (this.ehOfx(item)) {
          this.excluirOFX(id);
          return;
        }

        if (this.ehManual(item) && item.tipo === 'RECEITA') {
          this.excluirReceita(id);
          return;
        }

        if (this.ehManual(item) && item.tipo === 'DESPESA') {
          this.excluirDespesa(id);
          return;
        }

        if (item.tipo === 'RECEITA') {
          this.excluirReceita(id);
          return;
        }

        if (item.tipo === 'DESPESA') {
          this.excluirDespesa(id);
          return;
        }

        this.mostrarNotificacao(
          'erro',
          'Tipo não reconhecido',
          'Não foi possível identificar essa movimentação.'
        );
      },
      'Excluir',
      'Cancelar'
    );
  }

  excluirOFX(id: number): void {
    this.http.delete(
      `http://localhost:8080/api/transacoes/${id}/usuario/${this.usuarioId}`
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Transação OFX excluída!',
          'A transação importada foi removida com sucesso.'
        );

        this.carregarTransacoes();
        this.carregarContas();
        this.carregarArquivosOfx();

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao excluir transação OFX:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir OFX',
          err.error?.message || err.error || 'Não foi possível excluir a transação OFX.'
        );
      }
    });
  }

  excluirReceita(id: number): void {
    this.http.delete(
      `http://localhost:8080/api/receitas/${id}/usuario/${this.usuarioId}`
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Receita excluída!',
          'A receita foi removida e o saldo da conta foi atualizado.'
        );

        this.carregarTransacoes();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao excluir receita:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir receita',
          err.error?.message || err.error || 'Não foi possível excluir a receita.'
        );
      }
    });
  }

  excluirDespesa(id: number): void {
    this.http.delete(
      `http://localhost:8080/api/despesas/${id}/usuario/${this.usuarioId}`
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Despesa excluída!',
          'A despesa foi removida e o saldo da conta foi atualizado.'
        );

        this.carregarTransacoes();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao excluir despesa:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir despesa',
          err.error?.message || err.error || 'Não foi possível excluir a despesa.'
        );
      }
    });
  }



  salvarTransacao(): void {
    if (!this.dadosForm.contaId) {
      this.mostrarNotificacao(
        'aviso',
        'Conta obrigatória',
        'Selecione uma conta bancária.'
      );
      return;
    }

    if (!this.dadosForm.categoriaId) {
      this.mostrarNotificacao(
        'aviso',
        'Categoria obrigatória',
        'Selecione uma categoria.'
      );
      return;
    }

    const payload = {
      descricao: this.dadosForm.descricao.trim(),
      valor: Number(this.dadosForm.valor),
      data: this.dadosForm.data + 'T00:00:00',
      categoriaId: Number(this.dadosForm.categoriaId),
      contaId: Number(this.dadosForm.contaId)
    };

    this.http.post(
      `http://localhost:8080/api/transacoes/usuario/${this.usuarioId}`,
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Transação salva!',
          'A transação foi registrada com sucesso.'
        );

        this.carregarTransacoes();
        this.carregarContas();
        this.resetarFormulario();
      },
      error: (err) => {
        console.error('Erro ao salvar transação:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao salvar transação',
          err.error?.message || err.error || 'Não foi possível salvar a transação.'
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
      contaId: '',
      tipo: 'DESPESA'
    };

    this.cdr.detectChanges();
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
