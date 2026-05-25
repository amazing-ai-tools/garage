from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Vehicle(TimestampMixin, Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    make: Mapped[str] = mapped_column(String(80), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer)
    odometer_km: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    expenses: Mapped[list["Expense"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    parts: Mapped[list["PartChange"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="vehicle", cascade="all, delete-orphan")


class Expense(TimestampMixin, Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    odometer_km: Mapped[int | None] = mapped_column(Integer)

    vehicle: Mapped[Vehicle] = relationship(back_populates="expenses")


class PartChange(TimestampMixin, Base):
    __tablename__ = "part_changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(100))
    reference: Mapped[str | None] = mapped_column(String(100))
    cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))

    vehicle: Mapped[Vehicle] = relationship(back_populates="parts")


class Reminder(TimestampMixin, Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vehicle_id: Mapped[int] = mapped_column(ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(140), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date)
    due_odometer_km: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="open")

    vehicle: Mapped[Vehicle] = relationship(back_populates="reminders")
