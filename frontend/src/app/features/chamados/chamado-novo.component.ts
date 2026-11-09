import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Categoria, ChamadosService } from '../../core/chamados.service';

@Component({
  selector: 'app-chamado-novo',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <main class="pagina">
      <a routerLink="/chamados">← Voltar</a>
      <h1>Novo chamado</h1>

      <form [formGroup]="form" (ngSubmit)="enviar()">
        <label>
          Título
          <input type="text" formControlName="titulo" />
        </label>

        <label>
          Descrição
          <textarea rows="5" formControlName="descricao"></textarea>
        </label>

        <label>
          Prioridade
          <select formControlName="prioridade">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </label>

        <label>
          Categoria
          <select formControlName="category_id">
            <option [ngValue]="null">Sem categoria</option>
            @for (c of categorias(); track c.id) {
              <option [ngValue]="c.id">{{ c.nome }}</option>
            }
          </select>
        </label>

        @if (erro()) {
          <p class="erro">{{ erro() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || enviando()">
          {{ enviando() ? 'Enviando...' : 'Abrir chamado' }}
        </button>
      </form>
    </main>
  `,
  styles: [
    `
      .pagina { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
      form { display: grid; gap: 16px; margin-top: 16px; }
      label { display: grid; gap: 4px; font-size: 0.9rem; }
      input, textarea, select { padding: 8px; font-size: 1rem; font-family: inherit; }
      button { padding: 10px; font-size: 1rem; }
      .erro { margin: 0; color: #b42318; }
    `,
  ],
})
export class ChamadoNovoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ChamadosService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(5)]],
    descricao: ['', Validators.required],
    prioridade: ['media'],
    category_id: [null as number | null],
  });
  categorias = signal<Categoria[]>([]);
  erro = signal('');
  enviando = signal(false);

  ngOnInit() {
    this.service.categorias().subscribe((lista) => this.categorias.set(lista));
  }

  enviar() {
    if (this.form.invalid) return;
    this.erro.set('');
    this.enviando.set(true);

    this.service.criar(this.form.getRawValue()).subscribe({
      next: (chamado) => this.router.navigate(['/chamados', chamado.id]),
      error: () => {
        this.enviando.set(false);
        this.erro.set('Não foi possível abrir o chamado. Tente novamente.');
      },
    });
  }
}