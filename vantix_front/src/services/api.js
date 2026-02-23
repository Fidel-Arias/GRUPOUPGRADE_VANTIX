const API_URL = 'http://127.0.0.1:8000/api/v1';

export const empleadoService = {
    async getAll(skip = 0, limit = 100) {
        const response = await fetch(`${API_URL}/empleados/?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Error al obtener empleados');
        return response.json();
    },

    async create(empleadoData) {
        const response = await fetch(`${API_URL}/empleados/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al crear empleado');
        }
        return response.json();
    },

    async update(id, empleadoData) {
        const response = await fetch(`${API_URL}/empleados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData),
        });
        if (!response.ok) throw new Error('Error al actualizar empleado');
        return response.json();
    },

    async toggleActive(id) {
        const response = await fetch(`${API_URL}/empleados/${id}/toggle-active`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Error al cambiar estado del empleado');
        return response.json();
    }
};

export const clienteService = {
    async getAll(skip = 0, limit = 100) {
        const response = await fetch(`${API_URL}/cartera/?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Error al obtener clientes');
        return response.json();
    },

    async update(id, clienteData) {
        const response = await fetch(`${API_URL}/cartera/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clienteData),
        });
        if (!response.ok) throw new Error('Error al actualizar cliente');
        return response.json();
    },

    async importMasivo(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_URL}/cartera/importar-masivo/`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error en la importación masiva');
        }
        return response.json();
    }
};

export const planService = {
    async getAll(skip = 0, limit = 100, idEmpleado = null) {
        let url = `${API_URL}/planes/?skip=${skip}&limit=${limit}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener planes de trabajo');
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_URL}/planes/${id}`);
        if (!response.ok) throw new Error('Error al obtener detalle del plan');
        return response.json();
    },

    async create(planData, idEmpleado) {
        const response = await fetch(`${API_URL}/planes/?id_empleado=${idEmpleado}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al crear plan de trabajo');
        }
        return response.json();
    },

    async update(id, planData) {
        const response = await fetch(`${API_URL}/planes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData),
        });
        if (!response.ok) throw new Error('Error al actualizar plan de trabajo');
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_URL}/planes/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar plan de trabajo');
        return response.json();
    }
};
