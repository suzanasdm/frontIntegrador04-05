import { HttpClient } from '@angular/common/http';
import { Component, inject, ChangeDetectorRef } from '@angular/core'; 
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperarsenha',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperarsenha.html',
  styleUrl: './recuperarsenha.css',
})
export class Recuperarsenha {
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); 

  passo: number = 1; 
  email: string = '';
  codigo: string = '';
  novaSenha: string = '';
  confirmarSenha: string = '';
  errorMessage: string = '';

  solicitarCodigo() {
    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Por favor, informe seu e-mail.';
      return;
    }

    this.http.post('http://localhost:8080/api/auth/recuperar-senha', { email: this.email.trim() }, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          this.passo = 2;
          this.cdr.detectChanges(); 

          setTimeout(() => {
            alert(res); 
          }, 50);
        },
        error: (err) => {
          console.error('Erro ao solicitar código:', err);
          this.errorMessage = err.error || 'Erro ao processar solicitação.';
        }
      });
  }

  alterarSenha() {
    this.errorMessage = '';

    if (!this.codigo.trim() || !this.novaSenha.trim() || !this.confirmarSenha.trim()) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.errorMessage = 'As senhas digitadas não coincidem.';
      return;
    }

    // BLINDAGEM: Remove espaços indesejados e garante exatamente 6 dígitos com zeros à esquerda
    const codigoLimpo = this.codigo.trim().padStart(6, '0');

    const payload = {
      email: this.email.trim(), // Remove espaços acidentais do email também
      codigo: codigoLimpo,      // Envia o código 100% tratado e limpo
      novaSenha: this.novaSenha
    };

    console.log('Dados enviados ao Back-end (Redefinição):', payload);

    this.http.post('http://localhost:8080/api/auth/redefinir-senha', payload, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert(res); 
          this.router.navigate(['/login']); 
        },
        error: (err) => {
          console.error('Erro ao redefinir senha:', err);
          this.errorMessage = err.error || 'Erro ao redefinir a senha.';
        }
      });
  }
}