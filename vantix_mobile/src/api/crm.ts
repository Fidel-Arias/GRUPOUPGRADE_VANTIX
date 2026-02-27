import { apiClient } from './client';

export interface LlamadaData {
    id_plan: string;
    numero_destino: string;
    nombre_destinatario?: string;
    duracion_segundos?: string;
    resultado: string;
    notas_llamada?: string;
    foto_prueba?: string;
}

export interface EmailData {
    id_plan: string;
    email_destino: string;
    asunto?: string;
    estado_envio: string;
    foto_prueba?: string;
}

export const crmService = {
    registrarLlamada: async (data: LlamadaData) => {
        const formData = new FormData();
        formData.append('id_plan', data.id_plan);
        formData.append('numero_destino', data.numero_destino);
        formData.append('resultado', data.resultado);
        if (data.nombre_destinatario) formData.append('nombre_destinatario', data.nombre_destinatario);
        if (data.duracion_segundos) formData.append('duracion_segundos', data.duracion_segundos);
        if (data.notas_llamada) formData.append('notas_llamada', data.notas_llamada);

        if (data.foto_prueba) {
            const filename = data.foto_prueba.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('foto_prueba', { uri: data.foto_prueba, name: filename, type } as any);
        }

        const response = await apiClient.post('/api/v1/crm/llamadas/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },

    registrarEmail: async (data: EmailData) => {
        const formData = new FormData();
        formData.append('id_plan', data.id_plan);
        formData.append('email_destino', data.email_destino);
        if (data.asunto) formData.append('asunto', data.asunto);
        if (data.estado_envio) formData.append('estado_envio', data.estado_envio);

        if (data.foto_prueba) {
            const filename = data.foto_prueba.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image`;
            formData.append('foto_prueba', { uri: data.foto_prueba, name: filename, type } as any);
        }

        const response = await apiClient.post('/api/v1/crm/emails/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};
