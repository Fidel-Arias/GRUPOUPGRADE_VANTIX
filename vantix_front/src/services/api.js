export const BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api/v1`;

// Helper para peticiones autenticadas
const authFetch = async (endpoint, options = {}) => {
    const isBrowser = typeof window !== 'undefined';
    const token = isBrowser ? localStorage.getItem('token') : null;
    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (isBrowser && (response.status === 401 || response.status === 403)) {
        // Si el token expiró o es inválido, limpiamos y redirigimos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }

    return response;
};

export const authService = {
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login/access-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al iniciar sesión');
        }

        const data = await response.json();
        const isBrowser = typeof window !== 'undefined';

        if (isBrowser) {
            localStorage.setItem('token', data.access_token);
        }

        // Obtenemos info del usuario actual
        const userResponse = await authFetch('/empleados/me');
        if (userResponse.ok) {
            const userData = await userResponse.json();
            if (isBrowser) {
                localStorage.setItem('user', JSON.stringify(userData));
            }
        }

        return data;
    },

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    },

    getUser() {
        if (typeof window === 'undefined') return null;
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        if (typeof window === 'undefined') return false;
        return !!localStorage.getItem('token');
    }
};

export const empleadoService = {
    async getAll(skip = 0, limit = 100) {
        const response = await authFetch(`/empleados/?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error('Error al obtener empleados');
        return response.json();
    },

    async create(empleadoData) {
        const response = await authFetch('/empleados/', {
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
        const response = await authFetch(`/empleados/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empleadoData),
        });
        if (!response.ok) throw new Error('Error al actualizar empleado');
        return response.json();
    },

    async toggleActive(id) {
        const response = await authFetch(`/empleados/${id}/toggle-active`, {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Error al cambiar estado del empleado');
        return response.json();
    }
};

export const clienteService = {
    async getAll(skip = 0, limit = 100, idEmpleado = null) {
        let url = `/cartera/?skip=${skip}&limit=${limit}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener clientes');
        return response.json();
    },

    async update(id, clienteData) {
        const response = await authFetch(`/cartera/${id}`, {
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
        const response = await authFetch('/cartera/importar-masivo/', {
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
        const response = await authFetch('/maestro/', {
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
        const response = await authFetch('/geo/departamentos?limit=30');
        if (!response.ok) throw new Error('Error al obtener departamentos');
        return response.json();
    },

    async getProvincias(idDepartamento) {
        const response = await authFetch(`/geo/provincias?id_departamento=${idDepartamento}&limit=100`);
        if (!response.ok) throw new Error('Error al obtener provincias');
        return response.json();
    },

    async getDistritos(idProvincia) {
        const response = await authFetch(`/geo/distritos?id_provincia=${idProvincia}&limit=100`);
        if (!response.ok) throw new Error('Error al obtener distritos');
        return response.json();
    }
};

export const planService = {
    async getAll(skip = 0, limit = 100, idEmpleado = null) {
        let url = `/planes/?skip=${skip}&limit=${limit}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener planes de trabajo');
        return response.json();
    },

    async getById(id) {
        const response = await authFetch(`/planes/${id}`);
        if (!response.ok) throw new Error('Error al obtener detalle del plan');
        return response.json();
    },

    async create(planData, idEmpleado) {
        const response = await authFetch(`/planes/?id_empleado=${idEmpleado}`, {
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
        const response = await authFetch(`/planes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData),
        });
        if (!response.ok) throw new Error('Error al actualizar plan de trabajo');
        return response.json();
    },

    async delete(id) {
        const response = await authFetch(`/planes/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar plan de trabajo');
        return response.json();
    },

    async revisar(id, reviewData) {
        const response = await authFetch(`/planes/${id}/revisar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al revisar el plan');
        }
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

        const response = await authFetch(`/visitas/?${params.toString()}`);
        if (!response.ok) throw new Error('Error al obtener visitas');
        return response.json();
    },

    async create(formData) {
        const response = await authFetch('/visitas/', {
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
        const response = await authFetch(`/visitas/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar visita');
        return response.json();
    },

    async getById(id) {
        const response = await authFetch(`/visitas/${id}`);
        if (!response.ok) throw new Error('Error al obtener detalle de visita');
        return response.json();
    }
};

export const crmService = {
    async getLlamadas(idPlan = null, skip = 0, limit = 100) {
        let url = `/crm/llamadas/?skip=${skip}&limit=${limit}`;
        if (idPlan) url += `&id_plan=${idPlan}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener registro de llamadas');
        return response.json();
    },

    async registrarLlamada(formData) {
        const response = await authFetch('/crm/llamadas/', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al registrar llamada');
        }
        return response.json();
    },

    async getEmails(idPlan = null, skip = 0, limit = 100) {
        let url = `/crm/emails/?skip=${skip}&limit=${limit}`;
        if (idPlan) url += `&id_plan=${idPlan}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener registro de correos');
        return response.json();
    },

    async registrarEmail(formData) {
        const response = await authFetch('/crm/emails/', {
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
    async getInformes(skip = 0, limit = 100, idEmpleado = null) {
        let url = `/kpi/informes/?skip=${skip}&limit=${limit}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener informes de KPI');
        return response.json();
    },

    async getIncentivos(idEmpleado = null, soloPendientes = false) {
        let url = `/kpi/incentivos/?solo_pendientes=${soloPendientes}`;
        if (idEmpleado) url += `&id_empleado=${idEmpleado}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener incentivos');
        return response.json();
    },

    async getInformeByPlan(idPlan) {
        const response = await authFetch(`/kpi/informes/${idPlan}`);
        if (!response.ok) throw new Error('Error al obtener informe de KPI');
        return response.json();
    },

    async updateInforme(idInforme, data) {
        const response = await authFetch(`/kpi/informes/${idInforme}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al actualizar metas de KPI');
        return response.json();
    },

    async marcarIncentivoPagado(idIncentivo) {
        const response = await authFetch(`/kpi/incentivos/${idIncentivo}/pagar`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Error al procesar pago de incentivo');
        return response.json();
    }
};

export const finanzasService = {
    async getAll(idPlan = null) {
        let url = '/finanzas/';
        if (idPlan) url += `?id_plan=${idPlan}`;
        const response = await authFetch(url);
        if (!response.ok) throw new Error('Error al obtener gastos');
        return response.json();
    },

    async create(data) {
        const response = await authFetch('/finanzas/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al registrar gasto');
        return response.json();
    },

    async update(id, data) {
        const response = await authFetch(`/finanzas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Error al actualizar gasto');
        return response.json();
    },

    async delete(id) {
        const response = await authFetch(`/finanzas/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar gasto');
        return response.json();
    },

    async getTotalByPlan(idPlan) {
        const response = await authFetch(`/finanzas/total/${idPlan}`);
        if (!response.ok) throw new Error('Error al obtener total del plan');
        return response.json();
    }
};

export const syncExternaService = {
    async getCotizaciones(idEmpleado = null) {
        let url = '/sync-externa/cotizaciones-detalladas';
        const params = new URLSearchParams();
        if (idEmpleado) params.append('id_empleado', idEmpleado);

        const response = await authFetch(`${url}${params.toString() ? '?' + params.toString() : ''}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al obtener cotizaciones');
        }
        return response.json();
    }
};

