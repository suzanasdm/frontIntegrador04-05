import { CommonModule, isPlatformBrowser } from '@angular/common';
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

@Component({
  selector: 'app-orcamento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orcamento.html',
  styleUrl: './orcamento.css',
})
export class Orcamento implements OnInit {

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioId: number = 0;
  usuarioNome: string = '';
  usuarioCompleto: any = {};

  contasBancarias: any[] = [];
  categorias: any[] = [];
  categoriasMeta: any[] = [];
  listaOrcamentos: any[] = [];
  listaMetas: any[] = [];

  exibirSidebar: boolean = false;
  editandoMeta: boolean = false;

  notificacao = {
    visivel: false,
    tipo: 'sucesso' as 'sucesso' | 'erro' | 'aviso',
    titulo: '',
    mensagem: ''
  };

  private timeoutNotificacao: any;
  private alertasMetasMostrados = new Set<string>();

  private readonly PERCENTUAL_META_PROXIMA = 80;
  private readonly DIAS_PRAZO_PROXIMO = 7;
  private readonly DIAS_META_CURTA = 30;
  private readonly VALOR_DIA_ALTO = 100;

  dadosForm = {
    valorLimite: 0,
    categoriaId: '',
    mesAno: this.obterMesAtual()
  };

  metaForm = {
    id: null as number | null,
    descricao: '',
    valorObjetivo: null as number | null,
    valorAtual: 0,
    prazo: '',
    prioridade: 'MEDIA',
    categoriaId: null as number | null
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
    }, 4500);
  }

  fecharNotificacao(): void {
    this.notificacao.visivel = false;
    this.cdr.detectChanges();
  }

  obterMesAtual(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');

    return `${ano}-${mes}`;
  }

  carregarDados(): void {
    this.carregarCategorias();
    this.carregarCategoriasMeta();
    this.carregarContas();
    this.carregarOrcamentos();
    this.carregarMetas();
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
        console.error('Erro ao buscar contas', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar contas',
          err.error?.message || 'Não foi possível carregar suas contas bancárias.'
        );
      }
    });
  }

  carregarCategorias(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}/tipo/DESPESA`
    ).subscribe({
      next: (res) => {
        this.categorias = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar categorias de despesa', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar categorias',
          err.error?.message || 'Não foi possível carregar as categorias de despesa.'
        );
      }
    });
  }

  carregarCategoriasMeta(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/categorias/usuario/${this.usuarioId}`
    ).subscribe({
      next: (res) => {
        this.categoriasMeta = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar categorias para metas', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar categorias',
          err.error?.message || 'Não foi possível carregar as categorias para metas.'
        );
      }
    });
  }

  carregarOrcamentos(): void {
    if (!this.dadosForm.mesAno) {
      return;
    }

    this.http.get<any[]>(
      `http://localhost:8080/api/orcamentos/usuario/${this.usuarioId}?mesAno=${this.dadosForm.mesAno}`
    ).subscribe({
      next: (res) => {
        this.listaOrcamentos = res || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao buscar orçamentos', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar orçamentos',
          err.error?.message || 'Não foi possível carregar os orçamentos.'
        );
      }
    });
  }

  salvarOrcamento(): void {
    if (!this.dadosForm.categoriaId) {
      this.mostrarNotificacao(
        'aviso',
        'Categoria obrigatória',
        'Selecione uma categoria para definir o limite.'
      );
      return;
    }

    if (!this.dadosForm.valorLimite || Number(this.dadosForm.valorLimite) <= 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor inválido',
        'Informe um limite maior que zero.'
      );
      return;
    }

    if (!this.dadosForm.mesAno) {
      this.mostrarNotificacao(
        'aviso',
        'Mês obrigatório',
        'Informe o mês de vigência do orçamento.'
      );
      return;
    }

    const payload = {
      valorLimite: Number(this.dadosForm.valorLimite),
      usuarioId: this.usuarioId,
      categoriaId: Number(this.dadosForm.categoriaId),
      mesAno: this.dadosForm.mesAno
    };

    this.http.post(
      'http://localhost:8080/api/orcamentos',
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Orçamento definido!',
          'O limite mensal foi configurado com sucesso.'
        );

        this.carregarOrcamentos();
        this.resetarFormularioMantendoMes();
      },
      error: (err) => {
        console.error('Erro ao salvar orçamento', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao salvar orçamento',
          err.error?.message || 'Não foi possível salvar o orçamento.'
        );
      }
    });
  }

  alterarMes(): void {
    this.carregarOrcamentos();
  }

  resetarFormularioMantendoMes(): void {
    const mesSelecionado = this.dadosForm.mesAno;

    this.dadosForm = {
      valorLimite: 0,
      categoriaId: '',
      mesAno: mesSelecionado
    };

    this.cdr.detectChanges();
  }

  calcularPorcentagem(gasto: number, limite: number): number {
    if (!limite || limite === 0) {
      return 0;
    }

    const porcentagem = (Number(gasto || 0) / Number(limite)) * 100;

    return porcentagem > 100 ? 100 : porcentagem;
  }

  carregarMetas(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/metas/usuario/${this.usuarioId}`
    ).subscribe({
      next: (res) => {
        this.listaMetas = res || [];
        this.cdr.detectChanges();

        setTimeout(() => {
          this.avaliarAlertasMetas();
        }, 300);
      },
      error: (err) => {
        console.error('Erro ao buscar metas', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao carregar metas',
          err.error?.message || 'Não foi possível carregar as metas.'
        );
      }
    });
  }

  salvarMeta(): void {
    if (!this.metaForm.descricao || this.metaForm.descricao.trim() === '') {
      this.mostrarNotificacao(
        'aviso',
        'Descrição obrigatória',
        'Informe a descrição da meta.'
      );
      return;
    }

    if (!this.metaForm.valorObjetivo || Number(this.metaForm.valorObjetivo) <= 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor inválido',
        'Informe um valor objetivo maior que zero.'
      );
      return;
    }

    if (Number(this.metaForm.valorAtual || 0) < 0) {
      this.mostrarNotificacao(
        'aviso',
        'Valor atual inválido',
        'O valor atual não pode ser negativo.'
      );
      return;
    }

    if (!this.metaForm.prazo) {
      this.mostrarNotificacao(
        'aviso',
        'Prazo obrigatório',
        'Informe o prazo da meta.'
      );
      return;
    }

    const payload = {
      descricao: this.metaForm.descricao.trim(),
      valorObjetivo: Number(this.metaForm.valorObjetivo),
      valorAtual: Number(this.metaForm.valorAtual || 0),
      prazo: this.metaForm.prazo,
      prioridade: this.metaForm.prioridade,
      usuarioId: this.usuarioId,
      categoriaId: this.metaForm.categoriaId ? Number(this.metaForm.categoriaId) : null
    };

    if (this.editandoMeta && this.metaForm.id) {
      this.http.put(
        `http://localhost:8080/api/metas/${this.metaForm.id}`,
        payload
      ).subscribe({
        next: () => {
          this.mostrarNotificacao(
            'sucesso',
            'Meta atualizada!',
            'A meta financeira foi atualizada com sucesso.'
          );

          this.carregarMetas();
          this.limparFormularioMeta();
        },
        error: (err) => {
          console.error('Erro ao atualizar meta', err);

          this.mostrarNotificacao(
            'erro',
            'Erro ao atualizar meta',
            err.error?.message || 'Não foi possível atualizar a meta.'
          );
        }
      });

      return;
    }

    this.http.post(
      'http://localhost:8080/api/metas',
      payload
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Meta cadastrada!',
          'A meta financeira foi cadastrada com sucesso.'
        );

        this.carregarMetas();
        this.limparFormularioMeta();
      },
      error: (err) => {
        console.error('Erro ao salvar meta', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao salvar meta',
          err.error?.message || 'Não foi possível salvar a meta.'
        );
      }
    });
  }

  editarMeta(meta: any): void {
    this.editandoMeta = true;

    this.metaForm = {
      id: meta.id,
      descricao: meta.descricao,
      valorObjetivo: meta.valorObjetivo,
      valorAtual: meta.valorAtual,
      prazo: meta.prazo ? meta.prazo.substring(0, 10) : '',
      prioridade: meta.prioridade || 'MEDIA',
      categoriaId: meta.categoriaId || null
    };

    this.mostrarNotificacao(
      'aviso',
      'Editando meta',
      `Você está editando a meta "${meta.descricao}".`
    );

    setTimeout(() => {
      const card = document.querySelector('.meta-card');
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    this.cdr.detectChanges();
  }

  deletarMeta(meta: any): void {
    const confirmar = confirm(
      `Deseja realmente excluir a meta "${meta.descricao}"?`
    );

    if (!confirmar) {
      return;
    }

    this.http.delete(
      `http://localhost:8080/api/metas/${meta.id}`
    ).subscribe({
      next: () => {
        this.mostrarNotificacao(
          'sucesso',
          'Meta excluída!',
          'A meta foi removida com sucesso.'
        );

        this.carregarMetas();
      },
      error: (err) => {
        console.error('Erro ao excluir meta', err);

        this.mostrarNotificacao(
          'erro',
          'Erro ao excluir meta',
          err.error?.message || 'Não foi possível excluir a meta.'
        );
      }
    });
  }

  limparFormularioMeta(): void {
    this.editandoMeta = false;

    this.metaForm = {
      id: null,
      descricao: '',
      valorObjetivo: null,
      valorAtual: 0,
      prazo: '',
      prioridade: 'MEDIA',
      categoriaId: null
    };

    this.cdr.detectChanges();
  }

  calcularPorcentagemMeta(valorAtual: number, valorObjetivo: number): number {
    if (!valorObjetivo || valorObjetivo === 0) {
      return 0;
    }

    const porcentagem = (Number(valorAtual || 0) / Number(valorObjetivo)) * 100;

    return porcentagem > 100 ? 100 : porcentagem;
  }

  obterPercentualMeta(meta: any): number {
    const valorAtual = Number(meta.valorAtual || 0);
    const valorObjetivo = Number(meta.valorObjetivo || 0);

    if (!valorObjetivo || valorObjetivo <= 0) {
      return 0;
    }

    return (valorAtual / valorObjetivo) * 100;
  }

  calcularDiasRestantesMeta(prazo: string): number {
    if (!prazo) {
      return 9999;
    }

    const dataNormalizada = prazo.substring(0, 10);
    const partes = dataNormalizada.split('-').map(Number);

    if (partes.length !== 3 || !partes[0] || !partes[1] || !partes[2]) {
      return 9999;
    }

    const dataPrazo = new Date(partes[0], partes[1] - 1, partes[2], 23, 59, 59);
    const hoje = new Date();

    const diferenca = dataPrazo.getTime() - hoje.getTime();

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  obterAlertaMeta(meta: any): string {
    const percentual = this.obterPercentualMeta(meta);
    const diasRestantes = this.calcularDiasRestantesMeta(meta.prazo);

    const valorAtual = Number(meta.valorAtual || 0);
    const valorObjetivo = Number(meta.valorObjetivo || 0);
    const valorRestante = valorObjetivo - valorAtual;
    const valorPorDia = valorRestante / Math.max(diasRestantes, 1);

    if (percentual >= 100) {
      return 'Meta concluída! Você já atingiu o valor objetivo.';
    }

    if (diasRestantes < 0) {
      return 'O prazo desta meta já passou e ela ainda não foi concluída.';
    }

    if (diasRestantes <= this.DIAS_PRAZO_PROXIMO) {
      return `Atenção: faltam apenas ${diasRestantes} dia(s) para o prazo desta meta.`;
    }

    if (percentual >= this.PERCENTUAL_META_PROXIMA) {
      return `Você já atingiu ${percentual.toFixed(1)}% desta meta. Falta pouco para concluir.`;
    }

    if (
      diasRestantes <= this.DIAS_META_CURTA &&
      valorPorDia >= this.VALOR_DIA_ALTO
    ) {
      return `Esta meta está agressiva para o prazo informado. Para concluir, seria necessário guardar cerca de ${valorPorDia.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })} por dia.`;
    }

    return '';
  }

  avaliarAlertasMetas(): void {
    for (const meta of this.listaMetas) {
      const mensagem = this.obterAlertaMeta(meta);

      if (!mensagem) {
        continue;
      }

      const chave = `${meta.id}-${mensagem}`;

      if (this.alertasMetasMostrados.has(chave)) {
        continue;
      }

      this.alertasMetasMostrados.add(chave);

      const percentual = this.obterPercentualMeta(meta);

      if (percentual >= 100) {
        this.mostrarNotificacao(
          'sucesso',
          'Meta concluída',
          mensagem
        );
      } else {
        this.mostrarNotificacao(
          'aviso',
          'Atenção à sua meta',
          mensagem
        );
      }

      break;
    }
  }

  obterClasseStatusMeta(status: string): string {
    if (status === 'CONCLUIDA') {
      return 'meta-status-concluida';
    }

    if (status === 'ATRASADA') {
      return 'meta-status-atrasada';
    }

    return 'meta-status-andamento';
  }

  obterClassePrioridade(prioridade: string): string {
    if (prioridade === 'ALTA') {
      return 'prioridade-alta';
    }

    if (prioridade === 'BAIXA') {
      return 'prioridade-baixa';
    }

    return 'prioridade-media';
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
