export interface RegistroConsumo {
    id?: number;
    cliente: number;
    cliente_dni?: string;
    cliente_nombre?: string;
    empleado?: number;
    empleado_nombre?: string;
    tipo_combustible: number;
    tipo_combustible_nombre?: string;
    galones: number;
    monto_total?: number;
    puntos_otorgados?: number;
    fecha?: string;
}

export interface RegistrarConsumoRequest {
    dni: string;
    nombres: string;
    apellidos: string;
    tipo_combustible: number;
    monto_consumido: number;
    tanque_lleno?: boolean;
}

export interface RegistrarConsumoResponse {
    mensaje: string;
    detalle: {
        cliente: string;
        dni: string;
        combustible: string;
        galones: string;
        monto_total: string;
        puntos_otorgados: number;
        puntos_acumulados: number;
    };
}

export interface DashboardData {
    total_clientes: number;
    total_puntos_otorgados: number;
    total_consumos: number;
    top_clientes: any[];
    consumo_por_tipo: any[];
}
