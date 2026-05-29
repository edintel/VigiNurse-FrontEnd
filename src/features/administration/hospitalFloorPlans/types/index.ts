export interface PlanoHospital {
  id: number;
  hospitalId: number;
  hospitalNombre: string;
  nombre: string;
  urlImagen: string;
  orden: number;
}

export interface DispositivoEnPlano {
  tipo: string;
  activoId: number | null;
  activoDescripcion: string | null;
  bebeId: number | null;
  bebeNombre: string | null;
  ultimaActualizacion: string;
}

export interface AreaEnPlano {
  areaId: number;
  areaNombre: string;
  posX: number;
  posY: number;
  dispositivos: DispositivoEnPlano[];
}

export interface VistaPlano {
  id: number;
  nombre: string;
  urlImagen: string;
  orden: number;
  areas: AreaEnPlano[];
}

export interface AreaConPosicion {
  id: number;
  hospitalId: number;
  hospitalNombre: string;
  nombre: string;
  planoHospitalId: number | null;
  planoNombre: string | null;
  posX: number | null;
  posY: number | null;
}

export interface GuardarPosicionAreaDTO {
  planoHospitalId: number | null;
  posX: number | null;
  posY: number | null;
}
