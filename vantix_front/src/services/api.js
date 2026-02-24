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

export const maestroService = {
    async create(prospectoData) {
        const response = await fetch(`${API_URL}/maestro/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prospectoData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al registrar prospecto/cliente');
        }
        return response.json();
    }
};

export const geoService = {
    async getDepartamentos() {
        const response = await fetch(`${API_URL}/geo/departamentos?limit=30`);
        if (!response.ok) throw new Error('Error al obtener departamentos');
        return response.json();
    },

    async getProvincias(idDepartamento) {
        const response = await fetch(`${API_URL}/geo/provincias?id_departamento=${idDepartamento}&limit=100`);
        if (!response.ok) throw new Error('Error al obtener provincias');
        return response.json();
    },

    async getDistritos(idProvincia) {
        const response = await fetch(`${API_URL}/geo/distritos?id_provincia=${idProvincia}&limit=100`);
        if (!response.ok) throw new Error('Error al obtener distritos');
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

export const visitaService = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        if (filters.id_empleado) params.append('id_empleado', filters.id_empleado);
        if (filters.id_plan) params.append('id_plan', filters.id_plan);
        if (filters.id_cliente) params.append('id_cliente', filters.id_cliente);
        if (filters.skip) params.append('skip', filters.skip);
        if (filters.limit) params.append('limit', filters.limit);

        const response = await fetch(`${API_URL}/visitas/?${params.toString()}`);
        if (!response.ok) throw new Error('Error al obtener visitas');
        return response.json();
    },

    async create(formData) {
        // Usamos FormData directamente porque el controller es multipart/form-data
        const response = await fetch(`${API_URL}/visitas/`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al registrar visita');
        }
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_URL}/visitas/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar visita');
        return response.json();
    },

    async getById(id) {
        const response = await fetch(`${API_URL}/visitas/${id}`);
        if (!response.ok) throw new Error('Error al obtener detalle de visita');
        return response.json();
    }
};
export const crmService = {
    // LLAMADAS
    async getLlamadas(idPlan = null, skip = 0, limit = 100) {
        let url = `${API_URL}/crm/llamadas/?skip=${skip}&limit=${limit}`;
        if (idPlan) url += `&id_plan=${idPlan}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener registro de llamadas');
        return response.json();
    },

    async registrarLlamada(formData) {
        // Backend ahora usa Form(...) y UploadFile, recibimos FormData
        const response = await fetch(`${API_URL}/crm/llamadas/`, {
            method: 'POST',
            body: formData, // No enviamos cabecera Content-Type para que el navegador ponga el boundary
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al registrar llamada');
        }
        return response.json();
    },

    // EMAILS
    async getEmails(idPlan = null, skip = 0, limit = 100) {
        let url = `${API_URL}/crm/emails/?skip=${skip}&limit=${limit}`;
        if (idPlan) url += `&id_plan=${idPlan}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener registro de correos');
        return response.json();
    },

    async registrarEmail(formData) {
        // Backend ahora usa Form(...) y UploadFile, recibimos FormData
        const response = await fetch(`${API_URL}/crm/emails/`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al registrar correo');
        }
        return response.json();
    }
};
export const kpiService = {
    async getInformes(idEmpleado = null) {
        let url = `${API_URL}/kpi/informes/`;
        if (idEmpleado) url += `?id_empleado=${idEmpleado}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener informes de KPI');
        return response.json();
    },

    async getIncentivos(idEmpleado = null, soloPendientes = false) {
        let url = `${API_URL}/kpi/incentivos/?solo_pendientes=${soloPendientes}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener incentivos');
        return response.json();
    },

    async getInformeByPlan(idPlan) {
        const response = await fetch(`${API_URL}/kpi/informes/${idPlan}`);
        if (!response.ok) throw new Error('Error al obtener informe de KPI');
        return response.json();
    },

    async updateInforme(idInforme, data) {
        const response = await fetch(`${API_URL}/kpi/informes/${idInforme}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al actualizar metas de KPI');
        return response.json();
    },

    async marcarIncentivoPagado(idIncentivo) {
        const response = await fetch(`${API_URL}/kpi/incentivos/${idIncentivo}/pagar`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Error al procesar pago de incentivo');
        return response.json();
    }
};

export const finanzasService = {
    async getAll(idPlan = null) {
        let url = `${API_URL}/finanzas/`;
        if (idPlan) url += `?id_plan=${idPlan}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al obtener gastos');
        return response.json();
    },

    async create(data) {
        const response = await fetch(`${API_URL}/finanzas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al registrar gasto');
        return response.json();
    },

    async update(id, data) {
        const response = await fetch(`${API_URL}/finanzas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al actualizar gasto');
        return response.json();
    },

    async delete(id) {
        const response = await fetch(`${API_URL}/finanzas/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar gasto');
        return response.json();
    },

    async getTotalByPlan(idPlan) {
        const response = await fetch(`${API_URL}/finanzas/total/${idPlan}`);
        if (!response.ok) throw new Error('Error al obtener total del plan');
        return response.json();
    }
};
