import { apiClient } from './client';

export interface Cliente {
    id_cliente: number;
    nombre_cliente: string;
    ruc_dni?: string;
}

export const carteraService = {
    getMisClientes: async (idEmpleado: number): Promise<Cliente[]> => {
        const response = await apiClient.get('/api/v1/cartera/', {
            params: { id_empleado: idEmpleado }
        });
        return response.data;
    },
};
