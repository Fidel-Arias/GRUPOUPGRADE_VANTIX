from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship
from app.core.database import Base

# 1. Tabla de Auditoría de Llamadas
class RegistroLlamada(Base):
    __tablename__ = "registro_auditoria_llamadas"

    id_llamada = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    numero_destino = Column(String(20), nullable=False)
    nombre_destinatario = Column(String(150))
    duracion_segundos = Column(Integer, default=0)
    resultado = Column(String(50)) # 'Contestó', 'Buzón', etc.
    fecha_hora = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    notas_llamada = Column(Text)

    # --- RELACIÓN AGREGADA ---
    # Esto permite hacer: mi_llamada.plan.fecha_inicio_semana
    plan = relationship("PlanTrabajoSemanal", back_populates="llamadas")

# 2. Tabla de Auditoría de Emails
class RegistroEmail(Base):
    __tablename__ = "registro_auditoria_emails"

    id_email = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    email_destino = Column(String(100), nullable=False)
    asunto = Column(String(200))
    estado_envio = Column(String(50), default='Enviado')
    fecha_hora = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # --- RELACIÓN AGREGADA ---
    # Esto permite hacer: mi_email.plan.empleado.nombre_completo
    plan = relationship("PlanTrabajoSemanal", back_populates="emails")