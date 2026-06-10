export interface PlanoHospital {
  id: number;
  hospitalId: number;
  hospitalNombre: string;
  nombre: string;
  urlImagen: string;
  orden: number;
}

export interface ActivoEnArea {
  activoId: number | null;
  activoDescripcion: string;
  ultimaActualizacion: string;
}

export interface AreaEnPlano {
  areaId: number;
  areaNombre: string;
  posX: number;
  posY: number;
  activos: ActivoEnArea[];
}

export interface BebeEnZona {
  brazaleteId: number;
  brazaleteCodigo: string;
  pacienteId: number | null;
  pacienteNombre: string | null;
  pacienteApellidos: string | null;
  nombreMadre: string | null;
  apellidosMadre: string | null;
  ultimaActualizacion: string;
}

export interface ZonaEnPlano {
  zonaId: number;
  zonaNombre: string;
  tipoZona: string;
  posX: number | null;
  posY: number | null;
  bebes: BebeEnZona[];
}

export interface VistaPlano {
  id: number;
  nombre: string;
  urlImagen: string;
  orden: number;
  areas: AreaEnPlano[];
  zonas: ZonaEnPlano[];
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

export interface ZonaConPosicion {
  id: number;
  hospitalId: number;
  nombre: string;
  tipo: number;
  estado: number;
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
