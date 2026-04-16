export interface TipoSignoVital {
  id: number;
  nombre: string;
  minimoNormal: number;
  maximoNormal: number;
  unidad: string;
}

export interface CreateTipoSignoVitalDTO {
  nombre: string;
  minimoNormal: number;
  maximoNormal: number;
  unidad: string;
}

export interface UpdateTipoSignoVitalDTO {
  nombre: string;
  minimoNormal: number;
  maximoNormal: number;
  unidad: string;
}
