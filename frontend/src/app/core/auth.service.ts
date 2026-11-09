import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'usuario' | 'tecnico' | 'admin';
}

interface Sessao {
  token: string;
  usuario: Usuario;
}

const CHAVE = 'chamados.sessao';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private sessao = signal<Sessao | null>(this.lerSessao());
  readonly usuario = computed(() => this.sessao()?.usuario ?? null);
  readonly token = computed(() => this.sessao()?.token ?? null);
  readonly logado = computed(() => this.sessao() !== null);

  login(email: string, senha: string) {
    return this.http.post<Sessao>('/api/auth/login', { email, senha }).pipe(
      tap((sessao) => {
        this.sessao.set(sessao);
        localStorage.setItem(CHAVE, JSON.stringify(sessao));
      })
    );
  }

  logout() {
    this.sessao.set(null);
    localStorage.removeItem(CHAVE);
    this.router.navigate(['/login']);
  }

  private lerSessao(): Sessao | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch {
      return null;
    }
  }
}