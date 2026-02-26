from sqlalchemy import Column, Integer, String, Boolean, Date, text
from sqlalchemy.orm import relationship
from app.core.database import Base # Importamos la clase Base

class Empleado(Base):
    __tablename__ = "empleados" # Debe coincidir con el nombre de la tabla en la base de datos

    id_empleado = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    dni = Column(String(20), nullable=False)
    cargo = Column(String(100), default="Asesor de Ventas")
    email_corporativo = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255))
    is_admin = Column(Boolean, default=False)
    fecha_ingreso = Column(Date, server_default=text("CURRENT_DATE"))
    activo = Column(Boolean, default=True)
    id_vendedor_externo = Column(Integer, nullable=True) # ID vinculado a UpgradeDB (tcros.personas)

    # Relación: Un empleado tiene MUCHOS planes de trabajo
    planes = relationship("PlanTrabajoSemanal", back_populates="empleado")
    
    # Relación: Un empleado tiene MUCHOS incentivos ganados
    incentivos = relationship("IncentivoPago", back_populates="empleado")

    # Relación: Un empleado tiene MUCHOS clientes asignados
    clientes_asignados = relationship("CarteraClientes", back_populates="empleado")

    # Relación: Un empleado tiene MUCHAS entidades maestro asignadas
    entidades_maestro = relationship("MaestroEntidades", back_populates="empleado")