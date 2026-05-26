import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Definição do Enum conforme seu código
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

  // Controle de Estado e UI
  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};
  exibirSidebar: boolean = false;
  contasBancarias: any[] = []; // Para listar na Sidebar igual ao Dashboard

  // Objeto seguindo exatamente a interface ContaBancaria
  dadosForm = {
    banco: '' as BancoEnum, 
    agencia: '',
    numeroConta: '',
    saldo: 0, 
    usuarioId: 0
  };

  // Mapeamento para o Select exibir nomes amigáveis
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
      } else {
        this.dadosForm.usuarioId = this.usuarioId;
        this.carregarContasSidebar(); // Carrega as contas para exibir na Sidebar
      }
    }
  }

  // Abre/Fecha a Sidebar
  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
  }

  // Busca as contas apenas para manter a Sidebar atualizada
  carregarContasSidebar(): void {
    this.http.get<any[]>(`http://localhost:8080/api/contas/usuario/${this.usuarioId}`)
      .subscribe({
        next: (res) => this.contasBancarias = res,
        error: (err) => console.error('Erro ao buscar contas para sidebar:', err)
      });
  }

  // Método de Cadastro
  cadastrar(): void {
    if (!this.dadosForm.banco || !this.dadosForm.agencia || !this.dadosForm.numeroConta) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    this.http.post('http://localhost:8080/api/contas', this.dadosForm).subscribe({
      next: () => {
        alert('Conta cadastrada com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar conta:', err);
        alert('Erro ao salvar conta. Verifique o console.');
      }
    });
  }

  // Logout do Sistema
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}