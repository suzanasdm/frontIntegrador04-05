import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private readonly API = 'http://localhost:8080/api/usuarios/login';


  login(loginData: any): Observable<any> {
    return this.http.post<any>(this.API, loginData).pipe(
      tap(res => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('usuarioLogado', JSON.stringify(res));
        }
      })
    );
  }


  isUsuarioLogado(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('usuarioLogado');
    }
    return false;
  }


  executarLogout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioLogado');
      this.router.navigate(['/login']);
    }
  }

  getDadosUsuario(): any {
    if (isPlatformBrowser(this.platformId)) {
      const user = localStorage.getItem('usuarioLogado');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}
