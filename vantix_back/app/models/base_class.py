from typing import Any
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.declarative import declared_attr

class Base(DeclarativeBase):
    id: Any

    # Se genera el nombre de la tabla automáticamente desde el nombre de la clase
    # Ejemplo: Class User -> table user
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
    