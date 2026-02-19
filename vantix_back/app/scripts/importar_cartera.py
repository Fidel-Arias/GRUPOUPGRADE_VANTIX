import pandas as pd
import os
import sys

# Esto permite que el script encuentre la carpeta "app" de tu proyecto
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.clientes import CarteraClientes
from app.models.enums import CategoriaClienteEnum

def limpiar_dato(valor):
    """Convierte los valores vacíos (NaN) de pandas en None para la Base de Datos"""
    if pd.isna(valor) or str(valor).strip() == '':
        return None
    return str(valor).strip()

def mapear_categoria(valor):
    """Convierte el texto del Excel al Enum de la Base de Datos"""
    valor = limpiar_dato(valor)
    if not valor: return None
    
    val_upper = valor.upper()
    if 'GOBIERNO' in val_upper: return CategoriaClienteEnum.GOBIERNO
    if 'CORPORATIVO' in val_upper: return CategoriaClienteEnum.CORPORATIVO
    if 'RETAIL' in val_upper: return CategoriaClienteEnum.RETAIL
    return None

def importar_excel_a_bd(ruta_archivo: str):
    db: Session = SessionLocal()
    
    print(f"Leyendo archivo: {ruta_archivo}...")
    # Leemos el CSV (o puedes usar pd.read_excel si es .xlsx)
    df = pd.read_csv(ruta_archivo)
    
    clientes_nuevos = []
    
    for index, row in df.iterrows():
        nombre = limpiar_dato(row.get('Nombre del cliente'))
        if not nombre:
            continue # Si la fila no tiene nombre, la saltamos
            
        ruc_dni = limpiar_dato(row.get('RUC / DNI'))
        
        # Corrección: Pandas a veces lee los RUCs como decimales (Ej: 20123.0)
        if ruc_dni and ruc_dni.endswith('.0'):
            ruc_dni = ruc_dni[:-2]
            
        # EVITAR DUPLICADOS: Si el RUC ya está en la BD, lo saltamos
        if ruc_dni:
            existe = db.query(CarteraClientes).filter(CarteraClientes.ruc_dni == ruc_dni).first()
            if existe:
                print(f"-> Omitiendo RUC {ruc_dni} (Ya existe en la Base de Datos)")
                continue

        # Unir Observaciones e Interacciones en un solo campo
        obs = limpiar_dato(row.get('Observaciones'))
        interaccion = limpiar_dato(row.get('Detalle de interacción'))
        obs_final = " | ".join(filter(None, [obs, interaccion]))

        # Crear el objeto SQLAlchemy
        nuevo_cliente = CarteraClientes(
            nombre_cliente=nombre,
            ruc_dni=ruc_dni,
            categoria=mapear_categoria(row.get('Categoría del cliente')),
            direccion=limpiar_dato(row.get('Dirección')),
            
            # Contacto Principal
            nombre_contacto=limpiar_dato(row.get('Nombre del contacto')),
            celular_contacto=limpiar_dato(row.get('Celular')),
            email_contacto=limpiar_dato(row.get('Correo electrónico')),
            
            # Gerencia
            nombre_gerente=limpiar_dato(row.get('Gerente General')),
            celular_gerente=limpiar_dato(row.get('Celular 2')),
            email_gerente=limpiar_dato(row.get('Correo electrónico 2')),
            
            # Logística/TI
            nombre_logistico=limpiar_dato(row.get('Logístico/TI')),
            celular_logistico=limpiar_dato(row.get('Celular 3')),
            email_logistico=limpiar_dato(row.get('Correo Electrónico')),
            
            observaciones=obs_final if obs_final else None
        )
        
        clientes_nuevos.append(nuevo_cliente)
        
    # Inserción Masiva (Bulk Insert)
    if clientes_nuevos:
        print(f"Insertando {len(clientes_nuevos)} clientes en la Base de Datos...")
        db.add_all(clientes_nuevos)
        db.commit()
        print("¡Proceso completado con ÉXITO! ✅")
    else:
        print("No se encontraron clientes nuevos para insertar. ⚠️")
        
    db.close()

if __name__ == "__main__":
    # Cambia esto por el nombre de tu archivo exacto
    archivo_csv = "Cartera activa por cada ejecutivo comercial 2026.xlsx - 4. Jose Leonardo.csv"
    importar_excel_a_bd(archivo_csv)