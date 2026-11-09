import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { RouterLink } from '@angular/router';

interface Chamado {
  id: number;
  titulo: string;
  status: 'aberto' | 'em_andamento' | 'resolvido';
  prioridade: string;
  criado_em: string;
  autor: string;
  categoria: string | null;
  responsavel: string | null;
}

@Component({
  selector: 'app-chamados-lista',
  imports: [DatePipe, RouterLink],
  template: `
    <main class="pagina">
      <header class="topo">
        <h1>Chamados</h1>
        <div>
          <span>{{ auth.usuario()?.nome }} ({{ auth.usuario()?.role }})</span>
          <a routerLink="/chamados/novo">Novo chamado</a>
            <button type="button" (click)="auth.logout()">Sair</button>
        </div>
      </header>

      <div class="filtros">
        @for (f of filtros; track f.valor) {
          <button type="button" [class.ativo]="filtro() === f.valor" (click)="filtrar(f.valor)">
            {{ f.rotulo }}
          </button>
        }
      </div>

      @if (carregando()) {
        <p>Carregando...</p>
      } @else if (erro()) {
        <p class="erro">{{ erro() }}</p>
      } @else if (chamados().length === 0) {
        <p>Nenhum chamado encontrado.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th>#</th><th>Título</th><th>Status</th><th>Prioridade</th>
              <th>Autor</th><th>Responsável</th><th>Aberto em</th>
            </tr>
          </thead>
          <tbody>
            @for (c of chamados(); track c.id) {
              <tr>
                <td>{{ c.id }}</td>
                <td><a [routerLink]="['/chamados', c.id]">{{ c.titulo }}</a></td>
                <td>{{ rotuloStatus[c.status] }}</td>
                <td>{{ c.prioridade }}</td>
                <td>{{ c.autor }}</td>
                <td>{{ c.responsavel ?? '-' }}</td>
                <td>{{ c.criado_em | date: 'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
    </main>
  `,
  styles: [
    `
      .pagina { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
      .topo { display: flex; justify-content: space-between; align-items: center; }
      .topo span { margin-right: 12px; }
      .filtros { display: flex; gap: 8px; margin: 16px 0; }
      .filtros .ativo { font-weight: 700; background: #dbeafe; }
      table { width: 100%; border-collapse: collapse; background: #fff; }
      th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
      .erro { color: #b42318; }
    `,
  ],
})
export class ChamadosListaComponent implements OnInit {
  readonly auth = inject(AuthService);
  private http = inject(HttpClient);

  readonly filtros = [
    { valor: '', rotulo: 'Todos' },
    { valor: 'aberto', rotulo: 'Abertos' },
    { valor: 'em_andamento', rotulo: 'Em andamento' },
    { valor: 'resolvido', rotulo: 'Resolvidos' },
  ];
  readonly rotuloStatus: Record<string, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em andamento',
    resolvido: 'Resolvido',
  };

  chamados = signal<Chamado[]>([]);
  filtro = signal('');
  carregando = signal(false);
  erro = signal('');

  ngOnInit() {
    this.carregar();
  }

  filtrar(valor: string) {
    this.filtro.set(valor);
    this.carregar();
  }

    private carregar() {
    this.carregando.set(true);
    this.erro.set('');
    const params: Record<string, string> = this.filtro() ? { status: this.filtro() } : {};

    this.http.get<Chamado[]>('/api/tickets', { params }).subscribe({
      next: (lista) => {
        this.chamados.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os chamados.');
        this.carregando.set(false);
      },
    });
  }
}