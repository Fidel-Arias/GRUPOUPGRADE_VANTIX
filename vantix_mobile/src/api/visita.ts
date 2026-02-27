import { apiClient } from './client';

export interface VisitaData {
    id_plan: string;
    id_cliente: string;
    resultado: string;
    nombre_tecnico?: string;
    observaciones?: string;
    lat?: string;
    lon?: string;
    foto_lugar?: string;
    foto_sello?: string;
}

export const visitaService = {
    registrar: async (data: VisitaData) => {
        const formData = new FormData();

        // Append text fields
        formData.append('id_plan', data.id_plan);
        formData.append('id_cliente', data.id_cliente);
        formData.append('resultado', data.resultado);
        if (data.nombre_tecnico) formData.append('nombre_tecnico', data.nombre_tecnico);
        if (data.observaciones) formData.append('observaciones', data.observaciones);
        if (data.lat) formData.append('lat', data.lat);
        if (data.lon) formData.append('lon', data.lon);

        // Append files
        if (data.foto_lugar) {
            const filename = data.foto_lugar.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('foto_lugar', { uri: data.foto_lugar, name: filename, type } as any);
        }

        if (data.foto_sello) {
            const filename = data.foto_sello.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('foto_sello', { uri: data.foto_sello, name: filename, type } as any);
        }

        const response = await apiClient.post('/api/v1/visitas/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};
