from app.core.database import SessionLocal
from app.models.kpi import MaestroMetas

def seed():
    db = SessionLocal()
    try:
        # Verificar si ya hay metas
        if db.query(MaestroMetas).count() == 0:
            print("Sembrando Maestro de Metas...")
            meta_estandar = MaestroMetas(
                nombre_meta="Metas Estándar Vantix",
                meta_visitas=25,
                meta_llamadas=30,
                meta_emails=100,
                meta_visitas_asistidas=5,
                meta_cotizaciones=0,
                meta_ventas=0.00,
                puntos_visita=10,
                puntos_visita_asistida=5,
                puntos_llamada=1,
                puntos_email=1,
                puntos_venta=0,
                puntaje_objetivo=205
            )
            db.add(meta_estandar)
            db.commit()
            print("Maestro de Metas sembrado con éxito.")
        else:
            print("El Maestro de Metas ya tiene datos.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
