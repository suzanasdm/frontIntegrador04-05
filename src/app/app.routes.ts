import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Receita } from './receita/receita';
import { Despesa } from './despesa/despesa';
import { Cadastro } from './cadastro/cadastro';
import { Contabancaria } from './contabancaria/contabancaria';
import { Transacao } from './transacao/transacao';
import { FluxoCaixa } from './fluxo-caixa/fluxo-caixa';
import { Orcamento } from './orcamento/orcamento';

export const routes: Routes = [
    {path: '', redirectTo: 'login', pathMatch: 'full'},
     {path: 'cadastro', component: Cadastro },
     {path: 'contasbancarias', component: Contabancaria },
    {path: 'login', component: Login },
    {path: 'dashboard', component: Dashboard },
    {path: 'receitas',component: Receita},
    {path: 'despesas', component: Despesa},
    {path: 'transacoes', component: Transacao},
    {path: 'fluxo-caixa', component: FluxoCaixa},
    {path: 'orcamentos',component: Orcamento}

];
