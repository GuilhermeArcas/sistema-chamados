import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ChamadoDetalhe, ChamadosService, StatusChamado } from '../../core/chamados.service';

@Component({
  selector: 'app-chamado-detalhe',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  template: `
    <main class="pagina">
      <a routerLink="/chamados">← Voltar</a>

      @if (erro()) {
        <p class="erro">{{ erro() }}</p>
      }

      @if (chamado(); as c) {
        <h1>#{{ c.id }} {{ c.titulo }}</h1>
        <p class="meta">
          <strong>{{ rotuloStatus[c.status] }}</strong> · prioridade {{ c.prioridade }} · aberto em
          {{ c.criado_em | date: 'dd/MM/yyyy HH:mm' }}
        </p>
        <p class="descricao">{{ c.descricao }}</p>

        @if (podeMudarStatus()) {
          <section class="acoes">
            @for (s of statusOpcoes; track s.valor) {
              @if (s.valor !== c.status) {
                <button type="button" (click)="mudarStatus(s.valor)">Marcar como {{ s.rotulo }}</button>
              }
            }
          </section>
        }

        <h2>Comentários</h2>
        @for (m of c.comentarios; track m.id) {
          <article class="comentario">
            <strong>{{ m.autor }}</strong>
            <span>{{ m.criado_em | date: 'dd/MM/yyyy HH:mm' }}</span>
            <p>{{ m.texto }}</p>
          </article>
        } @empty {
          <p>Nenhum comentário ainda.</p>
        }

         <div class="novo-comentario">
          <textarea rows="3" [formControl]="texto" placeholder="Escreva um comentário"></textarea>
          <button type="button" [disabled]="texto.invalid" (click)="comentar()">Comentar</button>
        </div>

        <h2>Histórico de status</h2>
        <ul>
          @for (h of c.historico; track $index) {
            <li>
              @if (h.de) {
                {{ rotuloStatus[h.de] }} → {{ rotuloStatus[h.para] }}
              } @else {
                Chamado aberto
              }
              por {{ h.alterado_por }} em {{ h.alterado_em | date: 'dd/MM/yyyy HH:mm' }}
            </li>
          }
        </ul>
      } @else if (!erro()) {
        <p>Carregando...</p>
      }
    </main>
  `,
  styles: [
    `
      .pagina { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
      .meta { color: #52606d; }
      .descricao { white-space: pre-wrap; }
      .acoes { display: flex; gap: 8px; margin: 16px 0; }
      .comentario { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      .comentario span { margin-left: 8px; color: #7b8794; font-size: 0.85rem; }
      .comentario p { margin: 4px 0 0; white-space: pre-wrap; }
      .novo-comentario { display: grid; gap: 8px; margin-top: 12px; }
      textarea { padding: 8px; font-size: 1rem; font-family: inherit; }
      .erro { color: #b42318; }
    `,
  ],
})
export class ChamadoDetalheComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(ChamadosService);
  private auth = inject(AuthService);
  private id = Number(this.route.snapshot.paramMap.get('id'));

  readonly statusOpcoes: { valor: StatusChamado; rotulo: string }[] = [
    { valor: 'aberto', rotulo: 'Aberto' },
    { valor: 'em_andamento', rotulo: 'Em andamento' },
    { valor: 'resolvido', rotulo: 'Resolvido' },
  ];
  readonly rotuloStatus: Record<string, string> = {
    aberto: 'Aberto',
    em_andamento: 'Em andamento',
    resolvido: 'Resolvido',
  };

  chamado = signal<ChamadoDetalhe | null>(null);
  erro = signal('');
  texto = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  podeMudarStatus = computed(() => {
    const role = this.auth.usuario()?.role;
    return role === 'tecnico' || role === 'admin';
  });

  ngOnInit() {
    this.carregar();
  }

  mudarStatus(status: StatusChamado) {
    this.erro.set('');
    this.service.mudarStatus(this.id, status).subscribe({
      next: () => this.carregar(),
      error: () => this.erro.set('Não foi possível alterar o status.'),
    });
  }

  comentar() {
    const texto = this.texto.value.trim();
    if (!texto) return;
    this.erro.set('');
    this.service.comentar(this.id, texto).subscribe({
      next: () => {
        this.texto.reset();
        this.carregar();
      },
      error: () => this.erro.set('Não foi possível enviar o comentário.'),
    });
  }

  private carregar() {
    this.service.obter(this.id).subscribe({
      next: (c) => this.chamado.set(c),
      error: (e) =>
        this.erro.set(
          e.status === 404 ? 'Chamado não encontrado.' : 'Não foi possível carregar o chamado.'
        ),
    });
  }
}