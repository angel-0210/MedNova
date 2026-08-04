from typing import Generic, TypeVar, Type, List, Optional, Any, Dict
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.database.models import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: uuid.UUID, hospital_id: Optional[uuid.UUID] = None) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.__table__.c[self.model.__mapper__.primary_key[0].name] == id)
        if hospital_id is not None and "hospital_id" in self.model.__table__.columns:
            stmt = stmt.where(self.model.__table__.c.hospital_id == hospital_id)
        
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_all(
        self, 
        hospital_id: Optional[uuid.UUID] = None, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        if hospital_id is not None and "hospital_id" in self.model.__table__.columns:
            stmt = stmt.where(self.model.__table__.c.hospital_id == hospital_id)
            
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, obj_in: ModelType) -> ModelType:
        self.db.add(obj_in)
        await self.db.flush()
        return obj_in

    async def update(self, db_obj: ModelType, obj_in: Any) -> ModelType:
        # Standard update logic
        for field in obj_in.__dict__:
            if hasattr(db_obj, field) and getattr(obj_in, field) is not None:
                setattr(db_obj, field, getattr(obj_in, field))
        self.db.add(db_obj)
        await self.db.flush()
        return db_obj

    async def delete(self, id: uuid.UUID, hospital_id: Optional[uuid.UUID] = None) -> bool:
        stmt = delete(self.model).where(self.model.__table__.c[self.model.__mapper__.primary_key[0].name] == id)
        if hospital_id is not None and "hospital_id" in self.model.__table__.columns:
            stmt = stmt.where(self.model.__table__.c.hospital_id == hospital_id)
            
        result = await self.db.execute(stmt)
        return result.rowcount > 0
