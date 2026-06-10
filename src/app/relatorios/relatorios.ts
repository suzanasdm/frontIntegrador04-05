import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
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


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CurrencyPipe
  ],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css'
})
export class Relatorios implements OnInit {


  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);


  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};


  contasBancarias: any[] = [];
  listaTransacoes: any[] = [];
  categoriasRelatorio: any[] = [];


  exibirSidebar = false;


  resumo = {
    receitas: 0,
    despesas: 0,
    saldo: 0
  };


  filtros = {
    inicio: '',
    fim: ''
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


  carregarDados(): void {
    this.carregarContas();
    this.carregarResumo();
    this.carregarCategorias();
    this.carregarTransacoes();
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
        this.contasBancarias = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar contas', err);
      }
    });
  }


  carregarResumo(): void {
    this.http.get<any>(
      `http://localhost:8080/api/relatorios/resumo/${this.usuarioId}`
    ).subscribe({
      next: (res) => {
        this.resumo = {
          receitas: res?.receitas || 0,
          despesas: res?.despesas || 0,
          saldo: res?.saldo || 0
        };


        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar resumo', err);
      }
    });
  }


  carregarCategorias(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/relatorios/gastos-categoria/${this.usuarioId}`
    ).subscribe({
      next: (res) => {
        this.categoriasRelatorio = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar categorias', err);
      }
    });
  }


  carregarTransacoes(): void {
    let url =
      `http://localhost:8080/api/relatorios/transacoes/${this.usuarioId}`;


    if (this.filtros.inicio && this.filtros.fim) {
      url =
        `http://localhost:8080/api/relatorios/transacoes/${this.usuarioId}` +
        `?inicio=${this.filtros.inicio}&fim=${this.filtros.fim}`;
    }


    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.listaTransacoes = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar transações', err);
      }
    });
  }


  aplicarFiltros(): void {
    this.carregarTransacoes();
  }


  limparFiltros(): void {
    this.filtros = {
      inicio: '',
      fim: ''
    };


    this.carregarTransacoes();
  }


  exportarPDF(): void {
    const doc = new jsPDF();


    const formatarMoeda = (valor: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(valor || 0);
    };


    const formatarData = (data: string): string => {
      if (!data) {
        return '-';
      }


      return new Date(data).toLocaleDateString('pt-BR');
    };


    const periodo =
      this.filtros.inicio && this.filtros.fim
        ? `${formatarData(this.filtros.inicio)} até ${formatarData(this.filtros.fim)}`
        : 'Todos os períodos';


    // Cabeçalho
    doc.setFillColor(64, 150, 135);
    doc.rect(0, 0, 210, 34, 'F');


    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', 14, 18);


    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('CyberSoft - Sistema Financeiro', 14, 27);


    doc.text(
      `Emitido em: ${new Date().toLocaleDateString('pt-BR')}`,
      145,
      18
    );


    doc.text(
      `Usuário: ${this.usuarioNome}`,
      145,
      27
    );


    // Título resumo
    doc.setTextColor(35, 35, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Resumo financeiro', 14, 48);


    // Cards
    this.criarCardResumo(
      doc,
      14,
      56,
      'Receitas',
      formatarMoeda(this.resumo.receitas)
    );


    this.criarCardResumo(
      doc,
      76,
      56,
      'Despesas',
      formatarMoeda(this.resumo.despesas)
    );


    this.criarCardResumo(
      doc,
      138,
      56,
      'Saldo',
      formatarMoeda(this.resumo.saldo)
    );


    // Informações
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Período: ${periodo}`, 14, 91);
    doc.text(`Total de transações: ${this.listaTransacoes.length}`, 14, 98);


    // Tabela
    doc.setTextColor(35, 35, 35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Transações', 14, 112);


    const dadosTabela = this.listaTransacoes.map((item) => [
      formatarData(item.data),
      item.descricao || '-',
      item.categoria?.nome || item.categoria || '-',
      item.conta?.banco || item.conta || '-',
      item.tipo || '-',
      formatarMoeda(item.valor)
    ]);


    autoTable(doc, {
      startY: 118,
      head: [[
        'Data',
        'Descrição',
        'Categoria',
        'Conta',
        'Tipo',
        'Valor'
      ]],
      body: dadosTabela,
      theme: 'grid',
      margin: {
        left: 14,
        right: 14
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [64, 150, 135],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 249]
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 48 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30, halign: 'right' }
      }
    });


    // Rodapé
    const totalPaginas = doc.getNumberOfPages();


    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);


      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);


      doc.text(
        'CyberSoft - Sistema Financeiro',
        14,
        287
      );


      doc.text(
        `Página ${i} de ${totalPaginas}`,
        175,
        287
      );
    }


    doc.save(
      `relatorio-financeiro-${new Date().getTime()}.pdf`
    );
  }


  criarCardResumo(
    doc: jsPDF,
    x: number,
    y: number,
    titulo: string,
    valor: string
  ): void {
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, 58, 24, 3, 3, 'FD');


    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(titulo, x + 5, y + 8);


    doc.setTextColor(64, 150, 135);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(valor, x + 5, y + 18);
  }


  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }


  calcularPorcentagem(valor: number): number {
    const total =
      this.categoriasRelatorio.reduce(
        (acc, item) => acc + item.valor,
        0
      );


    if (!total || total === 0) {
      return 0;
    }


    return (valor / total) * 100;
  }
}


