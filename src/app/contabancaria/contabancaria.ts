import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

export enum BancoEnum {
  ITAU = 'ITAU',
  NUBANK = 'NUBANK'
}

@Component({
  selector: 'app-contabancaria',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contabancaria.html',
  styleUrl: './contabancaria.css',
})
export class Contabancaria implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};
  exibirSidebar: boolean = false;

  contasBancarias: any[] = [];
  contaEditando: any = null;
  contaParaExcluir: any = null;

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
    textoConfirmar: 'Excluir',
    textoCancelar: 'Cancelar'
  };

  dadosForm = {
    banco: '' as BancoEnum | '',
    agencia: '',
    numeroConta: '',
    saldo: 0,
    usuarioId: 0
  };

  formEdicao = {
    id: null as number | null,
    banco: '' as BancoEnum | '',
    agencia: '',
    numeroConta: '',
    saldo: 0,
    usuarioId: 0
  };

  opcoesBancos = [
    { label: 'Itaú', value: BancoEnum.ITAU },
    { label: 'Nubank', value: BancoEnum.NUBANK }
  ];

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

      this.dadosForm.usuarioId = this.usuarioId;
      this.formEdicao.usuarioId = this.usuarioId;

      this.carregarContas();
    }
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

  abrirModalExcluirConta(conta: any): void {
    this.contaParaExcluir = conta;

    this.confirmacao = {
      visivel: true,
      titulo: 'Excluir conta bancária?',
      mensagem: `Deseja realmente excluir a conta ${conta.banco} - ${conta.numeroConta}? Essa ação pode afetar receitas, despesas ou transações vinculadas.`,
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar'
    };

    this.cdr.detectChanges();
  }

  cancelarConfirmacao(): void {
    this.contaParaExcluir = null;

    this.confirmacao = {
      visivel: false,
      titulo: '',
      mensagem: '',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar'
    };

    this.cdr.detectChanges();
  }

  confirmarExclusaoConta(): void {
    if (!this.contaParaExcluir) {
      this.cancelarConfirmacao();
      return;
    }

    const conta = this.contaParaExcluir;

    this.http.delete(
      `http://localhost:8080/api/contas/${conta.id}/usuario/${this.usuarioId}`
    ).subscribe({
      next: () => {
        this.cancelarConfirmacao();

        this.mostrarNotificacao(
          'sucesso',
          'Conta excluída!',
          'A conta bancária foi removida com sucesso.'
        );

        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao excluir conta:', err);

        this.cancelarConfirmacao();

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir conta',
          err.error?.message || err.error || 'Não foi possível excluir a conta.'
        );
      }
    });
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
    this.cdr.detectChanges();
  }

  carregarContas(): void {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => {
          this.contasBancarias = res;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erro ao buscar contas:', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao carregar contas',
            err.error?.message || 'Não foi possível buscar suas contas bancárias.'
          );
        }
      });
  }

  cadastrar(): void {
    if (!this.dadosForm.banco) {
      this.mostrarNotificacao(
        'aviso',
        'Banco obrigatório',
        'Selecione o banco da conta.'
      );
      return;
    }

    if (!this.dadosForm.agencia.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Agência obrigatória',
        'Informe a agência da conta.'
      );
      return;
    }

    if (!this.dadosForm.numeroConta.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Número obrigatório',
        'Informe o número da conta.'
      );
      return;
    }

    if (
      this.dadosForm.saldo === null ||
      this.dadosForm.saldo === undefined ||
      Number(this.dadosForm.saldo) < 0
    ) {
      this.mostrarNotificacao(
        'aviso',
        'Saldo inválido',
        'Informe um saldo maior ou igual a zero.'
      );
      return;
    }

    const payload = {
      banco: this.dadosForm.banco,
      agencia: this.dadosForm.agencia.trim(),
      numeroConta: this.dadosForm.numeroConta.trim(),
      saldo: Number(this.dadosForm.saldo),
      usuarioId: this.usuarioId
    };

    this.http.post('http://localhost:8080/api/contas', payload).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Conta cadastrada!',
          'A conta bancária foi cadastrada com sucesso.'
        );

        this.resetarFormulario();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao cadastrar conta',
          err.error?.message || 'Não foi possível cadastrar a conta bancária.'
        );
      }
    });
  }

  abrirEdicao(conta: any): void {
    this.contaEditando = conta;

    this.formEdicao = {
      id: conta.id,
      banco: conta.banco,
      agencia: conta.agencia,
      numeroConta: conta.numeroConta,
      saldo: conta.saldo || 0,
      usuarioId: this.usuarioId
    };

    this.mostrarNotificacao(
      'aviso',
      'Editando conta',
      `Você está editando a conta ${conta.banco} - ${conta.numeroConta}.`
    );

    setTimeout(() => {
      const card = document.querySelector('.edit-card');
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    this.cdr.detectChanges();
  }

  cancelarEdicao(): void {
    this.contaEditando = null;

    this.formEdicao = {
      id: null,
      banco: '',
      agencia: '',
      numeroConta: '',
      saldo: 0,
      usuarioId: this.usuarioId
    };

    this.mostrarNotificacao(
      'aviso',
      'Edição cancelada',
      'Nenhuma alteração foi salva.'
    );

    this.cdr.detectChanges();
  }

  private cancelarEdicaoSemMensagem(): void {
    this.contaEditando = null;

    this.formEdicao = {
      id: null,
      banco: '',
      agencia: '',
      numeroConta: '',
      saldo: 0,
      usuarioId: this.usuarioId
    };

    this.cdr.detectChanges();
  }

  salvarEdicao(): void {
    if (!this.formEdicao.id) {
      this.mostrarNotificacao(
        'aviso',
        'Nenhuma conta selecionada',
        'Selecione uma conta para editar.'
      );
      return;
    }

    if (!this.formEdicao.banco) {
      this.mostrarNotificacao(
        'aviso',
        'Banco obrigatório',
        'Selecione o banco da conta.'
      );
      return;
    }

    if (!this.formEdicao.agencia.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Agência obrigatória',
        'Informe a agência da conta.'
      );
      return;
    }

    if (!this.formEdicao.numeroConta.trim()) {
      this.mostrarNotificacao(
        'aviso',
        'Número obrigatório',
        'Informe o número da conta.'
      );
      return;
    }

    if (
      this.formEdicao.saldo === null ||
      this.formEdicao.saldo === undefined ||
      Number(this.formEdicao.saldo) < 0
    ) {
      this.mostrarNotificacao(
        'aviso',
        'Saldo inválido',
        'Informe um saldo maior ou igual a zero.'
      );
      return;
    }

    const payload = {
      banco: this.formEdicao.banco,
      agencia: this.formEdicao.agencia.trim(),
      numeroConta: this.formEdicao.numeroConta.trim(),
      saldo: Number(this.formEdicao.saldo),
      usuarioId: this.usuarioId
    };

    this.http.put(
      `http://localhost:8080/api/contas/${this.formEdicao.id}`,
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Conta atualizada!',
          'As informações da conta bancária foram salvas com sucesso.'
        );

        this.cancelarEdicaoSemMensagem();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao editar conta:', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao editar conta',
          err.error?.message || 'Não foi possível editar a conta bancária.'
        );
      }
    });
  }

  resetarFormulario(): void {
    this.dadosForm = {
      banco: '',
      agencia: '',
      numeroConta: '',
      saldo: 0,
      usuarioId: this.usuarioId
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
