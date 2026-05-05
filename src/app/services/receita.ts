import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReceitaService {
  private http = inject(HttpClient);
  private readonly API_RECEITAS = 'http://localhost:8080/api/receitas';
  private readonly API_CATEGORIAS = 'http://localhost:8080/api/categorias';



  listarReceitasPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_RECEITAS}/usuario/${usuarioId}`);
  }

  salvarReceita(payload: any): Observable<any> {
    return this.http.post<any>(this.API_RECEITAS, payload);
  }



  listarCategoriasPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_CATEGORIAS}/usuario/${usuarioId}`);
  }

  salvarCategoria(payload: any): Observable<any> {
    return this.http.post<any>(this.API_CATEGORIAS, payload);
  }
}
