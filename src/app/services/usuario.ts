import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from '../models/Usuario.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly API = 'http://localhost:8080/usuario';

  constructor(private http: HttpClient) {}

  cadastrar(usuario: Usuario[]): Observable<Usuario[]> {
    return this.http.post<Usuario[]>(this.API, usuario);
  }

  buscar(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API}/${id}`);
  }
}