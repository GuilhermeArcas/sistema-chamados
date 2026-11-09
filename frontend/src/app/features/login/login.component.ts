import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <main class="login">
      <form [formGroup]="form" (ngSubmit)="entrar()">
        <h1>Sistema de Chamados</h1>

        <label>
          E-mail
          <input type="email" formControlName="email" autocomplete="username" />
        </label>

        <label>
          Senha
          <input type="password" formControlName="senha" autocomplete="current-password" />
        </label>

        @if (erro()) {
          <p class="erro">{{ erro() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || carregando()">
          {{ carregando() ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </main>
  `,
  styles: [
    `
      .login { display: grid; place-items: center; min-height: 100vh; }
      form { display: grid; gap: 16px; width: 320px; padding: 24px; background: #fff;
             border-radius: 8px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15); }
      h1 { margin: 0; font-size: 1.3rem; }
      label { display: grid; gap: 4px; font-size: 0.9rem; }
      input { padding: 8px; font-size: 1rem; }
      button { padding: 10px; font-size: 1rem; }
      .erro { margin: 0; color: #b42318; }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });
  erro = signal('');
  carregando = signal(false);

  entrar() {
    if (this.form.invalid) return;
    this.erro.set('');
    this.carregando.set(true);
    const { email, senha } = this.form.getRawValue();

    this.auth.login(email, senha).subscribe({
      next: () => this.router.navigate(['/chamados']),
      error: (e) => {
        this.carregando.set(false);
        this.erro.set(
          e.status === 401 ? 'E-mail ou senha inválidos.' : 'Não foi possível entrar. Tente novamente.'
        );
      },
    });
  }
}