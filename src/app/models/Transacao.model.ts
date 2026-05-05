export interface Transacao {
    descricao: string;
    valor: number;
    data: string; // No TS usamos string para datas vindas do input date (yyyy-mm-dd)
    contaId: number;
    categoriaId: number;
}