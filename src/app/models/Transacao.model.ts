export interface Transacao {

  id?: number;

  descricao: string;

  valor: number;

  data: string;

  tipo?: 'RECEITA' | 'DESPESA';

  fitId?: string;

  contaId: number;

  categoriaId?: number;

}