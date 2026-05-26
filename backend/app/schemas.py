from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class VehicleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    make: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=100)
    year: int | None = Field(default=None, ge=1900, le=2100)
    odometer_km: int = Field(default=0, ge=0)


class VehicleRead(VehicleCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExpenseCreate(BaseModel):
    vehicle_id: int
    date: date
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=240)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    odometer_km: int | None = Field(default=None, ge=0)


class ExpenseRead(ExpenseCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartChangeCreate(BaseModel):
    vehicle_id: int
    date: date
    name: str = Field(min_length=1, max_length=120)
    brand: str | None = Field(default=None, max_length=100)
    reference: str | None = Field(default=None, max_length=100)
    cost: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)


class PartChangeRead(PartChangeCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReminderCreate(BaseModel):
    vehicle_id: int
    title: str = Field(min_length=1, max_length=140)
    due_date: date | None = None
    due_odometer_km: int | None = Field(default=None, ge=0)
    status: str = Field(default="open", pattern="^(open|done)$")


class ReminderRead(ReminderCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VehicleSummary(BaseModel):
    id: int
    name: str
    make: str
    model: str
    odometer_km: int
    expense_total: Decimal
    open_reminders: int


class GarageSummary(BaseModel):
    vehicle_count: int
    total_expenses: Decimal
    open_reminder_count: int
    vehicles: list[VehicleSummary]


class CurrentUser(BaseModel):
    email: str
    name: str | None
    avatar_url: str | None


class UserPreferences(BaseModel):
    language: str = Field(pattern="^(en|fr-CA|pt|es)$")
    country: str = Field(pattern="^(CA|US|FR|BR|PT|ES|MX)$")
    currency: str = Field(pattern="^(CAD|USD|EUR|BRL|MXN)$")
