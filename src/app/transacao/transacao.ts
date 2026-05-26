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

abrirEdicao(item: any): void {
  this.itemEditando = item;

  this.formEdicao = {
    id: item.id,
    origem: item.origem,
    descricao: item.descricao,
    valor: item.valor,
    data: item.data ? item.data.substring(0, 10) : '',
    tipo: item.tipo,
    categoriaId: item.categoriaId || '',
    contaId: item.contaId || ''
  };

  this.carregarCategoriasPorTipoEdicao();
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
    }
  });
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
}
salvarEdicao(): void {
  if (!this.formEdicao.id) {
    alert('Nenhum item selecionado para edição.');
    return;
  }

  if (!this.formEdicao.descricao.trim()) {
    alert('Informe a descrição.');
    return;
  }

  if (!this.formEdicao.tipo) {
    alert('Informe o tipo.');
    return;
  }

  if (this.formEdicao.origem !== 'OFX') {
    if (!this.formEdicao.valor || Number(this.formEdicao.valor) <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    if (!this.formEdicao.data) {
      alert('Informe a data.');
      return;
    }

    if (!this.formEdicao.categoriaId) {
      alert('Selecione uma categoria.');
      return;
    }

    if (!this.formEdicao.contaId) {
      alert('Selecione uma conta bancária.');
      return;
    }
  }

  if (this.formEdicao.origem === 'OFX') {
    this.salvarEdicaoOFX();
    return;
  }

  if (this.itemEditando.tipo === 'RECEITA') {
    this.salvarEdicaoReceita();
    return;
  }

  if (this.itemEditando.tipo === 'DESPESA') {
    this.salvarEdicaoDespesa();
    return;
  }
}
salvarEdicaoOFX(): void {
  const payload = {
    descricao: this.formEdicao.descricao,
    tipo: this.formEdicao.tipo,
    categoriaId: this.formEdicao.categoriaId ? Number(this.formEdicao.categoriaId) : null,
    usuarioId: this.usuarioId
  };

  this.http.put(
    `http://localhost:8080/api/transacoes/${this.formEdicao.id}`,
    payload
  ).subscribe({
    next: () => {
      alert('Transação OFX atualizada com sucesso.');
      this.cancelarEdicao();
      this.carregarTransacoes();
    },
    error: (err) => {
      console.error('Erro ao editar transação OFX:', err);
      alert(err.error?.message || 'Erro ao editar transação OFX.');
    }
  });
}

salvarEdicaoReceita(): void {
  const payload = {
    descricao: this.formEdicao.descricao,
    valor: Number(this.formEdicao.valor),
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
      alert('Receita atualizada com sucesso.');
      this.cancelarEdicao();
      this.carregarTransacoes();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao editar receita:', err);
      alert(err.error?.message || 'Erro ao editar receita.');
    }
  });
}
salvarEdicaoDespesa(): void {
  const payload = {
    descricao: this.formEdicao.descricao,
    valor: Number(this.formEdicao.valor),
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
      alert('Despesa atualizada com sucesso.');
      this.cancelarEdicao();
      this.carregarTransacoes();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao editar despesa:', err);
      alert(err.error?.message || 'Erro ao editar despesa.');
    }
  });
}
  carregarDados(): void {


    this.carregarContas();


    this.carregarCategorias();


    this.carregarTransacoes();


  }

excluirMovimentacao(item: any): void {
  const confirmar = confirm(
    `Deseja realmente excluir "${item.descricao}"?`
  );

  if (!confirmar) {
    return;
  }

  if (item.origem === 'OFX') {
    this.excluirOFX(item.id);
    return;
  }

  if (item.tipo === 'RECEITA') {
    this.excluirReceita(item.id);
    return;
  }

  if (item.tipo === 'DESPESA') {
    this.excluirDespesa(item.id);
    return;
  }
}
excluirOFX(id: number): void {
  this.http.delete(
    `http://localhost:8080/api/transacoes/${id}/usuario/${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Transação OFX excluída com sucesso.');
      this.carregarTransacoes();
    },
    error: (err) => {
      console.error('Erro ao excluir OFX:', err);
      alert(err.error?.message || 'Erro ao excluir transação OFX.');
    }
  });
}

excluirReceita(id: number): void {
  this.http.delete(
    `http://localhost:8080/api/receitas/${id}/usuario/${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Receita excluída com sucesso.');
      this.carregarTransacoes();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao excluir receita:', err);
      alert(err.error?.message || 'Erro ao excluir receita.');
    }
  });
}

excluirDespesa(id: number): void {
  this.http.delete(
    `http://localhost:8080/api/despesas/${id}/usuario/${this.usuarioId}`
  ).subscribe({
    next: () => {
      alert('Despesa excluída com sucesso.');
      this.carregarTransacoes();
      this.carregarContas();
    },
    error: (err) => {
      console.error('Erro ao excluir despesa:', err);
      alert(err.error?.message || 'Erro ao excluir despesa.');
    }
  });
}carregarContas(): void {


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



