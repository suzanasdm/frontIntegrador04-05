import { Component, OnInit, inject } from '@angular/core';
import { LoginService }from '../services/login';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  
  private loginService = inject(LoginService);
  private router = inject(Router);

  loginData = { email: '', senha: '' };
  errorMessage: string = '';

  ngOnInit(): void {
    // Usando o método renomeado
    if (this.loginService.isUsuarioLogado()) {
      this.router.navigate(['/login']);
    }
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.senha) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.loginService.login(this.loginData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro no login:', err);
        this.errorMessage = 'E-mail ou senha incorretos.';
      }
    });
  }
}
