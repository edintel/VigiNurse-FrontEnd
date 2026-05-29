export interface MedicamentoAdmin {
  id: number;
  nombreGenerico: string;
  nombreComercial: string;
  formulacionFarma: string;
  concentracion: string;
}

export interface CreateMedicamentoDTO {
  nombreGenerico: string;
  nombreComercial: string;
  formulacionFarma: string;
  concentracion: string;
}

export type UpdateMedicamentoDTO = CreateMedicamentoDTO;

export interface PaginatedMedicamentos {
  datos: MedicamentoAdmin[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

