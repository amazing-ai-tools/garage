from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.app.config import get_settings
from backend.app.database import get_db
from backend.app.models import Expense, PartChange, Reminder, Vehicle
from backend.app.schemas import (
    ExpenseCreate,
    ExpenseRead,
    GarageSummary,
    PartChangeCreate,
    PartChangeRead,
    ReminderCreate,
    ReminderRead,
    VehicleCreate,
    VehicleRead,
    VehicleSummary,
)

settings = get_settings()

app = FastAPI(title="Garage API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_vehicle_exists(db: Session, vehicle_id: int) -> None:
    if db.get(Vehicle, vehicle_id) is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("select 1"))
    return {"status": "ok", "database": "ok"}


@app.post("/api/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)) -> Vehicle:
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@app.get("/api/vehicles", response_model=list[VehicleRead])
def list_vehicles(db: Session = Depends(get_db)) -> list[Vehicle]:
    return list(db.scalars(select(Vehicle).order_by(Vehicle.name)))


@app.post("/api/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)) -> Expense:
    ensure_vehicle_exists(db, payload.vehicle_id)
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/api/expenses", response_model=list[ExpenseRead])
def list_expenses(db: Session = Depends(get_db)) -> list[Expense]:
    return list(db.scalars(select(Expense).order_by(Expense.date.desc(), Expense.id.desc())))


@app.post("/api/parts", response_model=PartChangeRead, status_code=status.HTTP_201_CREATED)
def create_part_change(payload: PartChangeCreate, db: Session = Depends(get_db)) -> PartChange:
    ensure_vehicle_exists(db, payload.vehicle_id)
    part = PartChange(**payload.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@app.get("/api/parts", response_model=list[PartChangeRead])
def list_part_changes(db: Session = Depends(get_db)) -> list[PartChange]:
    return list(db.scalars(select(PartChange).order_by(PartChange.date.desc(), PartChange.id.desc())))


@app.post("/api/reminders", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: ReminderCreate, db: Session = Depends(get_db)) -> Reminder:
    ensure_vehicle_exists(db, payload.vehicle_id)
    reminder = Reminder(**payload.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@app.get("/api/reminders", response_model=list[ReminderRead])
def list_reminders(db: Session = Depends(get_db)) -> list[Reminder]:
    return list(db.scalars(select(Reminder).order_by(Reminder.due_date.asc().nullslast(), Reminder.id.desc())))


@app.get("/api/summary", response_model=GarageSummary)
def get_summary(db: Session = Depends(get_db)) -> GarageSummary:
    vehicles = list(db.scalars(select(Vehicle).order_by(Vehicle.name)))
    total_expenses = db.scalar(select(func.coalesce(func.sum(Expense.amount), 0))) or Decimal("0")
    open_reminder_count = db.scalar(select(func.count(Reminder.id)).where(Reminder.status == "open")) or 0

    vehicle_summaries: list[VehicleSummary] = []
    for vehicle in vehicles:
        expense_total = (
            db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.vehicle_id == vehicle.id))
            or Decimal("0")
        )
        open_reminders = (
            db.scalar(
                select(func.count(Reminder.id)).where(
                    Reminder.vehicle_id == vehicle.id,
                    Reminder.status == "open",
                )
            )
            or 0
        )
        vehicle_summaries.append(
            VehicleSummary(
                id=vehicle.id,
                name=vehicle.name,
                make=vehicle.make,
                model=vehicle.model,
                odometer_km=vehicle.odometer_km,
                expense_total=expense_total,
                open_reminders=open_reminders,
            )
        )

    return GarageSummary(
        vehicle_count=len(vehicles),
        total_expenses=total_expenses,
        open_reminder_count=open_reminder_count,
        vehicles=vehicle_summaries,
    )
