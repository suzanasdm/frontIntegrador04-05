
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

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
   
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  cadastrar() {
    if (this.cadastroForm.valid) {
      const payload = this.cadastroForm.value;
      
    
      this.http.post('http://localhost:8080/api/usuarios', payload).subscribe({
        next: (res: any) => {
          if (isPlatformBrowser(this.platformId)) {
           
            localStorage.setItem('usuarioLogado', JSON.stringify(res));
          
            this.router.navigate(['/login']);
          }
        },
        error: (err) => console.error('Erro ao cadastrar', err)
      });
    }
  }
  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}