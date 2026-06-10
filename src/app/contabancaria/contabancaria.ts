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
          alert(err.error?.message || 'Erro ao carregar contas bancárias.');
        }
      });
  }

  cadastrar(): void {
    if (!this.dadosForm.banco) {
      alert('Selecione o banco.');
      return;
    }

    if (!this.dadosForm.agencia.trim()) {
      alert('Informe a agência.');
      return;
    }

    if (!this.dadosForm.numeroConta.trim()) {
      alert('Informe o número da conta.');
      return;
    }

    if (this.dadosForm.saldo === null || this.dadosForm.saldo === undefined || Number(this.dadosForm.saldo) < 0) {
      alert('Informe um saldo maior ou igual a zero.');
      return;
    }

    const payload = {
      banco: this.dadosForm.banco,
      agencia: this.dadosForm.agencia,
      numeroConta: this.dadosForm.numeroConta,
      saldo: Number(this.dadosForm.saldo),
      usuarioId: this.usuarioId
    };

    this.http.post('http://localhost:8080/api/contas', payload).subscribe({
      next: () => {
        alert('Conta cadastrada com sucesso!');
        this.resetarFormulario();
        this.carregarContas();
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);
        alert(err.error?.message || 'Erro ao salvar conta.');
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

    this.cdr.detectChanges();
  }

  salvarEdicao(): void {
    if (!this.formEdicao.id) {
      alert('Nenhuma conta selecionada para edição.');
      return;
    }

    if (!this.formEdicao.banco) {
      alert('Selecione o banco.');
      return;
    }

    if (!this.formEdicao.agencia.trim()) {
      alert('Informe a agência.');
      return;
    }

    if (!this.formEdicao.numeroConta.trim()) {
      alert('Informe o número da conta.');
      return;
    }

    if (this.formEdicao.saldo === null || this.formEdicao.saldo === undefined || Number(this.formEdicao.saldo) < 0) {
      alert('Informe um saldo maior ou igual a zero.');
      return;
    }

    const payload = {
      banco: this.formEdicao.banco,
      agencia: this.formEdicao.agencia,
      numeroConta: this.formEdicao.numeroConta,
      saldo: Number(this.formEdicao.saldo),
      usuarioId: this.usuarioId
    };

    this.http.put(`http://localhost:8080/api/contas/${this.formEdicao.id}`, payload)
      .subscribe({
        next: () => {
          alert('Conta atualizada com sucesso!');
          this.cancelarEdicao();
          this.carregarContas();
        },
        error: (err) => {
          console.error('Erro ao editar conta:', err);
          alert(err.error?.message || 'Erro ao editar conta.');
        }
      });
  }

 excluirConta(conta: any): void {
  const confirmar = confirm(
    `Deseja realmente excluir a conta ${conta.banco} - ${conta.numeroConta}?`
  );

  if (!confirmar) {
    return;
  }

  this.http.delete(
    `http://localhost:8080/api/contas/${conta.id}/usuario/${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Conta excluída com sucesso!');
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao excluir conta:', err);

      alert(
        err.error?.message ||
        err.error ||
        'Erro ao excluir conta.'
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
      this.router.navigate(['/login']);
    }
  }
}
