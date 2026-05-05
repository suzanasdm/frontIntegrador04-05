import { BancoEnum } from "./BancoEnum";


export interface ContaBancaria {
    banco: BancoEnum;
    agencia: string;
    numeroConta: string;
    saldo: number;
    usuarioId: number;
}