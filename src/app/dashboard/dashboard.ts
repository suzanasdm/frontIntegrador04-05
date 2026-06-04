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
graficoDespesasStyle: any = {};
graficoReceitasStyle: any = {};

categoriasDespesasGrafico: any[] = [];
categoriasReceitasGrafico: any[] = [];


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
        this.montarGraficosDashboard();
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
 gerarCorCategoria(index: number): string {
  const hue = (index * 47) % 360;
  return `hsl(${hue}, 65%, 45%)`;
    }


  toggleSidebar(): void {
    this.exibirSidebar = !this.exibirSidebar;
  }
montarGraficoPorTipo(tipo: 'RECEITA' | 'DESPESA'): any {
  const transacoes = this.dadosDashboard?.transacoes || [];

  const itensFiltrados = transacoes.filter(
    (item: any) => item.tipo === tipo
  );

  if (itensFiltrados.length === 0) {
    return {
      categorias: [],
      style: {
        background: '#e5e7eb'
      }
    };
  }

  const agrupado: any = {};

  itensFiltrados.forEach((item: any) => {
    const categoria = item.categoria || 'Sem categoria';

    if (!agrupado[categoria]) {
      agrupado[categoria] = 0;
    }

    agrupado[categoria] += Number(item.valor);
  });

  const total = Object.values(agrupado)
    .reduce((acc: number, valor: any) => acc + Number(valor), 0);

  let inicio = 0;

  const categorias = Object.keys(agrupado).map((categoria, index) => {
    const valor = agrupado[categoria];
    const percentual = total > 0 ? (valor / total) * 100 : 0;

    const fim = inicio + percentual;
    const cor = this.gerarCorCategoria(index);

    const itemGrafico = {
      categoria,
      valor,
      percentual,
      cor,
      inicio,
      fim
    };

    inicio = fim;

    return itemGrafico;
  });

  const partesGradiente = categorias.map((item: any) => {
    return `${item.cor} ${item.inicio}% ${item.fim}%`;
  });

  return {
    categorias,
    style: {
      background: `conic-gradient(${partesGradiente.join(', ')})`
    }
  };
}
montarGraficosDashboard(): void {
  const graficoDespesas = this.montarGraficoPorTipo('DESPESA');

  this.categoriasDespesasGrafico = graficoDespesas.categorias;
  this.graficoDespesasStyle = graficoDespesas.style;

  const graficoReceitas = this.montarGraficoPorTipo('RECEITA');

  this.categoriasReceitasGrafico = graficoReceitas.categorias;
  this.graficoReceitasStyle = graficoReceitas.style;
}
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }
}
