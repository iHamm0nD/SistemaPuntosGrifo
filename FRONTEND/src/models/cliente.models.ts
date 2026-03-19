export interface Cliente {
    id: number;
    dni: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    puntos_acumulados: number;
    fecha_registro: string;
    total_consumos?: number;
}
