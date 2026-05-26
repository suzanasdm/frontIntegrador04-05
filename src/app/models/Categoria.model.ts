import { CategoriaEnum } from "./CategoriaEnum";

export interface Categoria {
    descricao: string;
    tipo: CategoriaEnum;
    usuarioId: number;
}
