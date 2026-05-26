import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.css',
})
export class Cadastro implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private fb = inject(FormBuilder);

  cadastroForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cadastroForm = this.fb.group(
      {
        nome: ['', Validators.required],

        email: ['', [Validators.required, Validators.email]],

        senha: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])(?=\S+$).{8,}$/
            )
          ]
        ],

        confirmarSenha: ['', Validators.required]
      },
      {
        validators: this.senhasIguais
      }
    );
  }

  senhasIguais(form: FormGroup) {
    const senha = form.get('senha')?.value;
    const confirmarSenha = form.get('confirmarSenha')?.value;

    if (senha !== confirmarSenha) {
      return { naoConfere: true };
    }

    return null;
  }

  cadastrar() {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    const payload = {
      nome: this.cadastroForm.value.nome,
      email: this.cadastroForm.value.email,
      senha: this.cadastroForm.value.senha
    };

    this.http.post('http://localhost:8080/api/usuarios', payload).subscribe({
      next: (res: any) => {
        if (isPlatformBrowser(this.platformId)) {

          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Erro ao cadastrar', err);
        alert(err.error || 'Erro ao cadastrar usuário.');
      }
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}
