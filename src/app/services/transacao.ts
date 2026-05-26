import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


import { Observable } from 'rxjs';


import { Transacao } from '../transacao/transacao';


@Injectable({
  providedIn: 'root'
})
export class TransacaoService {


  private api = 'http://localhost:8080/api/transacoes';


  private apiOfx = 'http://localhost:8080/api/ofx';


  constructor(
    private http: HttpClient
  ) {}


  listar(): Observable<Transacao[]> {
    return this.http.get<Transacao[]>(this.api);
  }


  salvar(transacao: Transacao): Observable<Transacao> {
    return this.http.post<Transacao>(this.api, transacao);
  }


  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }


  importarOFX(
    file: File,
    contaId: number
  ): Observable<any> {
    const formData = new FormData();


    formData.append('file', file);
    formData.append('contaId', contaId.toString());


    return this.http.post(
      `${this.apiOfx}/upload`,
      formData,
      {
        responseType: 'text'
      }
    );
  }
}


