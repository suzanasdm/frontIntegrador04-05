import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContaService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/api/contas';

  cadastrar(conta: any): Observable<any> {
    return this.http.post<any>(this.API, conta);
  }

  listarPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/usuario/${usuarioId}`);
  }
}