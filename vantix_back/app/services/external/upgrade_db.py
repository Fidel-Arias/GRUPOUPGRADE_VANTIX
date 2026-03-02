import psycopg2
from psycopg2.extras import RealDictCursor
from app.core.config import settings
import logging
from datetime import date
from decimal import Decimal

logger = logging.getLogger(__name__)

class ExternalDBService:
    @staticmethod
    def get_connection():
        """Establece una conexión con la base de datos externa de Upgrade."""
        try:
            conn = psycopg2.connect(
                host=settings.EXTERNAL_DB_HOST,
                port=settings.EXTERNAL_DB_PORT,
                user=settings.EXTERNAL_DB_USER,
                password=settings.EXTERNAL_DB_PASSWORD,
                database=settings.EXTERNAL_DB_NAME
            )
            return conn
        except Exception as e:
            logger.error(f"Error conectando a la base de datos externa: {e}")
            raise e

    @staticmethod
    def fetch_cotizaciones_detalladas(
        vendedor_id_externo: int = None, 
        fecha_inicio: date = None, 
        fecha_fin: date = None, 
        limit: int = 100
    ):
        """
        Trae el detalle COMPLETO de cotizaciones cruzando todas las tablas solicitadas
        con filtros por vendedor, rango de fechas y límite.
        """
        conn = ExternalDBService.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        c.numero as numero_cotizacion,
                        c.fecha,
                        cl.nombre as nombre_cliente,
                        p.nombre as producto,
                        m.nombre as marca,
                        d.cantidad,
                        d.total as total_linea,
                        d.precio_producto,
                        d.precio_unitario_real,
                        mon.simbolo as moneda_simbolo,
                        c.creado,
                        c.vendedor_id as vendedor_id_externo
                    FROM cmrlz.cotizacion_ventas_det d
                    INNER JOIN cmrlz.cotizacion_ventas_cab c ON d.cotizacion_id = c.id
                    INNER JOIN extcs.productos p ON d.producto_id = p.id
                    INNER JOIN extcs.marcas m ON p.marca_id = m.id
                    INNER JOIN public.monedas mon ON c.moneda_id = mon.id
                    -- Relación para obtener el nombre del cliente
                    INNER JOIN tcros.direcciones dir ON c.direccion_cliente_id = dir.id
                    INNER JOIN tcros.personas cl ON dir.persona_id = cl.id
                    WHERE 1=1
                """
                params = []
                if vendedor_id_externo:
                    query += " AND c.vendedor_id = %s"
                    params.append(vendedor_id_externo)
                
                if fecha_inicio:
                    query += " AND c.fecha >= %s"
                    params.append(fecha_inicio)
                
                if fecha_fin:
                    query += " AND c.fecha <= %s"
                    params.append(fecha_fin)
                
                query += " ORDER BY c.fecha DESC, c.numero DESC LIMIT %s"
                params.append(limit)
                
                cur.execute(query, params)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def count_cotizaciones(vendedor_id_externo: int, fecha_inicio, fecha_fin) -> int:
        """
        Cuenta cuántas cotizaciones realizó el vendedor en un rango de fechas.
        """
        conn = ExternalDBService.get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT COUNT(*) 
                    FROM cmrlz.cotizacion_ventas_cab 
                    WHERE vendedor_id = %s 
                    AND fecha BETWEEN %s AND %s
                """
                cur.execute(query, (vendedor_id_externo, fecha_inicio, fecha_fin))
                result = cur.fetchone()
                return result[0] if result else 0
        finally:
            conn.close()
    @staticmethod
    def fetch_ventas_detalladas(
        vendedor_id_externo: int = None, 
        fecha_inicio: date = None, 
        fecha_fin: date = None, 
        limit: int = 100
    ):
        """
        Trae el resumen de Notas de Pedido (Cabecera) para un vendedor. 
        Evita duplicados por productos usando agregación.
        """
        conn = ExternalDBService.get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        c.numero as numero_orden,
                        c.almacen_id,
                        v.nombre as vendedor_nombre,
                        cl.nombre as cliente_nombre,
                        string_agg(p.nombre, ', ') as producto,
                        c.total,
                        c.fecha,
                        mon.simbolo as moneda_simbolo
                    FROM cmrlz.notas_pedido_cab c
                    INNER JOIN tcros.personas v ON c.vendedor_id = v.id
                    INNER JOIN tcros.direcciones dir ON c.direccion_cliente_id = dir.id
                    INNER JOIN tcros.personas cl ON dir.persona_id = cl.id
                    INNER JOIN public.monedas mon ON c.moneda_id = mon.id
                    LEFT JOIN cmrlz.notas_pedido_det d ON d.nota_pedido_id = c.id
                    LEFT JOIN extcs.productos p ON d.producto_id = p.id
                    WHERE c.anulada = false AND c.aprobada = true
                """
                params = []
                if vendedor_id_externo:
                    query += " AND c.vendedor_id = %s"
                    params.append(vendedor_id_externo)
                
                if fecha_inicio:
                    query += " AND c.fecha >= %s"
                    params.append(fecha_inicio)
                
                if fecha_fin:
                    query += " AND c.fecha <= %s"
                    params.append(fecha_fin)
                
                query += """ 
                    GROUP BY c.id, c.numero, c.almacen_id, v.nombre, cl.nombre, c.total, c.fecha, mon.simbolo 
                    ORDER BY c.fecha DESC, c.numero DESC 
                    LIMIT %s
                """
                params.append(limit)
                
                cur.execute(query, params)
                return cur.fetchall()
        finally:
            conn.close()

    @staticmethod
    def sum_ventas_monto(vendedor_id_externo: int, fecha_inicio: date, fecha_fin: date) -> Decimal:
        """
        Obtiene el monto total de notas de pedido (Suma de columna total) para un vendedor en un periodo.
        """
        conn = ExternalDBService.get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT SUM(total) 
                    FROM cmrlz.notas_pedido_cab 
                    WHERE vendedor_id = %s 
                    AND fecha BETWEEN %s AND %s
                    AND anulada = false 
                    AND aprobada = true
                """
                cur.execute(query, (vendedor_id_externo, fecha_inicio, fecha_fin))
                result = cur.fetchone()
                return result[0] if result and result[0] else Decimal("0.00")
        finally:
            conn.close()

    @staticmethod
    def fetch_resumen_ventas_vendedores(fecha_inicio: date, fecha_fin: date):
        """
        Trae el total vendido por CADA vendedor en un rango de fechas usando Notas de Pedido Aprobadas.
        """
        conn = ExternalDBService.get_connection()
        try:
            with conn.cursor() as cur:
                query = """
                    SELECT vendedor_id, SUM(total) 
                    FROM cmrlz.notas_pedido_cab 
                    WHERE fecha BETWEEN %s AND %s
                    AND anulada = false 
                    AND aprobada = true
                    GROUP BY vendedor_id
                """
                cur.execute(query, (fecha_inicio, fecha_fin))
                result = cur.fetchall()
                return {row[0]: Decimal(str(row[1] or 0)) for row in result}
        finally:
            conn.close()
