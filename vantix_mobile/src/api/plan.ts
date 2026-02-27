import { apiClient } from './client';

export interface DetallePlan {
    id_detalle: number;
    id_plan: number;
    dia_semana: string;
    hora_programada: string;
    tipo_actividad: string;
    id_cliente: number;
    cliente?: {
        id_cliente: number;
        nombre_cliente: string;
    };
}

export interface Plan {
    id_plan: number;
    fecha_inicio_semana: string;
    fecha_fin_semana: string;
    estado: string;
    detalles_agenda: DetallePlan[];
}

export const planService = {
    getMisPlanes: async (idEmpleado: number): Promise<Plan[]> => {
        const response = await apiClient.get('/api/v1/planes/', {
            params: { id_empleado: idEmpleado }
        });
        return response.data;
    },
};
