import { apiClient } from './client';

export interface GastoData {
    id_plan: number;
    id_ciente?: number;
    fecha_gasto: string;
    lugar_origen: string;
    lugar_destino: string;
    institucion_visitada: string;
    motivo_visita: string;
    monto_gastado: number;
}

export const finanzasService = {
    registrarGasto: async (data: GastoData) => {
        const response = await apiClient.post('/api/v1/finanzas/', data);
        return response.data;
    },
    getGastosByPlan: async (idPlan: number) => {
        const response = await apiClient.get(`/api/v1/finanzas/?id_plan=${idPlan}`);
        return response.data;
    },
};
