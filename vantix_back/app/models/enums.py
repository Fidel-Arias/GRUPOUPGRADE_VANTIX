import enum

class TipoActividadEnum(str, enum.Enum):
    VISITA = 'Visita'
    VISITA_ASISTIDA = 'Visita asistida'
    LLAMADA = 'Llamada'
    CORREO = 'Correo'
    COTIZACION = 'Cotización'
    VENTA = 'Venta'

class ResultadoEstadoEnum(str, enum.Enum):
    CLIENTE_INTERESADO = 'Cliente interesado'
    EN_EVALUACION = 'En evaluación'
    VENTA_CERRADA = 'Venta cerrada'
    NO_INTERESADO = 'No interesado'

class CategoriaClienteEnum(str, enum.Enum):
    CORPORATIVO = 'Corporativo'
    GOBIERNO = 'Gobierno'
    RETAIL = 'Retail'

class DiaSemanaEnum(str, enum.Enum):
    LUNES = 'Lunes'
    MARTES = 'Martes'
    MIERCOLES = 'Miercoles'
    JUEVES = 'Jueves'
    VIERNES = 'Viernes'
    SABADO = 'Sabado'