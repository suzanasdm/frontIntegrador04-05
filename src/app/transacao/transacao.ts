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
  selector: 'app-transacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
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


filtroTipo: string = 'TODOS';






  exibirSidebar: boolean = false;


  arquivoOFX!: File;


  dadosForm = {
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    categoriaId: '',
    contaId: '',
    tipo: 'DESPESA'
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




  toggleSidebar(): void {


    this.exibirSidebar = !this.exibirSidebar;


    this.cdr.detectChanges();


  }


  carregarDados(): void {


    this.carregarContas();


    this.carregarCategorias();


    this.carregarTransacoes();


  }


  carregarContas(): void {


    this.http.get<any[]>(
      `http://localhost:8080/api/contas/usuario/${this.usuarioId}`
    ).subscribe({


      next: (res) => {


        this.contasBancarias = res;


        this.cdr.detectChanges();


      },


      error: (err) => {
        console.error(err);
      }


    });


  }


  carregarCategorias(): void {


    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}`
    ).subscribe({


      next: (res) => {


        this.categorias = res;


        this.cdr.detectChanges();


      },


      error: (err) => {
        console.error(err);
      }


    });


  }


carregarTransacoes(): void {
  this.http.get<any[]>(
    `http://localhost:8080/api/movimentacoes/usuario/${this.usuarioId}`
  ).subscribe({
    next: (res) => {
      this.listaTransacoes = res;
      this.aplicarFiltroTipo();
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erro ao carregar movimentações:', err);
      alert(err.error?.message || 'Erro ao carregar movimentações.');
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


 salvarTransacao(): void {
  if (!this.dadosForm.contaId) {
    alert('Selecione uma conta');
    return;
  }


  if (!this.dadosForm.categoriaId) {
    alert('Selecione uma categoria');
    return;
  }


  const payload = {
    descricao: this.dadosForm.descricao,
    valor: Number(this.dadosForm.valor),
    data: this.dadosForm.data + 'T00:00:00',
    categoriaId: Number(this.dadosForm.categoriaId),
    contaId: Number(this.dadosForm.contaId)
  };


  console.log('Dados enviados para transação:', payload);


  this.http.post(`http://localhost:8080/api/transacoes/usuario/${this.usuarioId}`, payload).subscribe({
    next: () => {
      alert('Transação salva!');


      this.carregarTransacoes();
      this.carregarContas();
      this.resetarFormulario();
    },
    error: (err) => {
      console.error('Erro ao salvar transação:', err);
      console.error('Status:', err.status);
      console.error('Mensagem:', err.error);


      alert(err.error || 'Erro ao salvar transação.');
    }
  });
}


 selecionarArquivo(event: any): void {
  const arquivoSelecionado = event.target.files[0];


  if (arquivoSelecionado) {
    this.arquivoOFX = arquivoSelecionado;
  }
}



importarOFX(): void {
  if (!this.arquivoOFX) {
    alert('Selecione um arquivo OFX.');
    return;
  }


  if (!this.dadosForm.contaId) {
    alert('Selecione uma conta bancária antes de importar o OFX.');
    return;
  }


  const formData = new FormData();


  formData.append('file', this.arquivoOFX);


  formData.append(
    'contaId',
    this.dadosForm.contaId.toString()
  );


  formData.append(
    'usuarioId',
    this.usuarioId.toString()
  );


  this.http.post('http://localhost:8080/api/ofx/upload', formData, {
    responseType: 'text'
  }).subscribe({
    next: (res) => {
      console.log('OFX importado:', res);
      alert(res);


      this.carregarTransacoes();
      this.carregarContas();


      this.arquivoOFX = undefined as any;
      this.dadosForm.contaId = '';
    },
    error: (err) => {
  console.error('Erro ao importar OFX:', err);

  const mensagem =
    err.error?.message ||
    err.error ||
    'Erro ao importar OFX.';

  alert(mensagem);
}
  });
}




  resetarFormulario(): void {


    this.dadosForm = {


      descricao: '',


      valor: 0,


      data: new Date()
        .toISOString()
        .split('T')[0],


      categoriaId: '',


      contaId: '',


      tipo: 'DESPESA'


    };


    this.cdr.detectChanges();


  }




  logout(): void {


    if (isPlatformBrowser(this.platformId)) {


      localStorage.removeItem(
        'usuarioLogado'
      );


      this.router.navigate(['/login']);


    }


  }


}



