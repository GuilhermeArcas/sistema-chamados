import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type StatusChamado = 'aberto' | 'em_andamento' | 'resolvido';

export interface Categoria {
  id: number;
  nome: string;
}

export interface Comentario {
  id: number;
  texto: string;
  criado_em: string;
  autor: string;
}

export interface Historico {
  de: StatusChamado | null;
  para: StatusChamado;
  alterado_em: string;
  alterado_por: string;
}

export interface ChamadoDetalhe {
  id: number;
  titulo: string;
  descricao: string;
  status: StatusChamado;
  prioridade: string;
  criado_em: string;
  comentarios: Comentario[];
  historico: Historico[];
}

export interface NovoChamado {
  titulo: string;
  descricao: string;
  prioridade: string;
  category_id: number | null;
}

@Injectable({ providedIn: 'root' })
export class ChamadosService {
  private http = inject(HttpClient);

  categorias() {
    return this.http.get<Categoria[]>('/api/categorias');
  }

  obter(id: number) {
    return this.http.get<ChamadoDetalhe>(`/api/tickets/${id}`);
  }

  criar(dados: NovoChamado) {
    return this.http.post<{ id: number }>('/api/tickets', dados);
  }

  mudarStatus(id: number, status: StatusChamado) {
    return this.http.patch(`/api/tickets/${id}/status`, { status });
  }

  comentar(id: number, texto: string) {
    return this.http.post(`/api/tickets/${id}/comentarios`, { texto });
  }
}