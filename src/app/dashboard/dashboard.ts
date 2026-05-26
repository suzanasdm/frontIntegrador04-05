import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  
  exibirSidebar: boolean = false;
  usuarioCompleto: any = {};
  usuarioNome: string = '';
  contasBancarias: any[] = [];

  dadosDashboard: any = {
    saldoTotal: 0,
    receita: 0,
    despesa: 0,
    transacoes: []
  };

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('usuarioLogado');
      
      if (!userJson) {
        this.router.navigate(['/login']);
        return;
      }

      const user = JSON.parse(userJson);
      this.usuarioCompleto = user;
      this.usuarioNome = user.nome || 'Usuário';

     
      this.carregarTudo(user.id);
    }
  }

  carregarTudo(idUsuario: number) {
   
    this.http.get(`http://localhost:8080/api/dashboard/${idUsuario}`).subscribe({
      next: (res: any) => {
        this.dadosDashboard = res;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Erro ao carregar dashboard', err)
    });

    this.http.get(`http://localhost:8080/api/contas/usuario/${idUsuario}`).subscribe({
      next: (res: any) => {
        this.contasBancarias = res;
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Erro ao buscar contas', err)
    });
  }

  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}