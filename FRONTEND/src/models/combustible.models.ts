export interface TipoCombustible {
    id: number;
    nombre: string;
    precio_referencial: number;
    puntos_por_galon: number;
    puntos_por_diez_soles?: number;
}
