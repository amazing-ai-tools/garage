from decimal import Decimal
from secrets import token_urlsafe

import httpx
from fastapi import Cookie, Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from backend.app.auth import (
    OAUTH_STATE_COOKIE,
    clear_session_cookie,
    create_session,
    fetch_google_profile,
    get_google_auth_url,
    hash_token,
    require_user,
    set_session_cookie,
    upsert_google_user,
)
from backend.app.config import get_settings
from backend.app.database import get_db
from backend.app.models import Expense, PartChange, Reminder, SessionToken, User, Vehicle
from backend.app.schemas import (
    CurrentUser,
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


def ensure_vehicle_exists(db: Session, vehicle_id: int, user: User) -> Vehicle:
    vehicle = db.scalar(select(Vehicle).where(Vehicle.id == vehicle_id, Vehicle.user_id == user.id))
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@app.get("/api/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("select 1"))
    return {"status": "ok", "database": "ok"}


@app.get("/api/auth/google/login")
def google_login() -> RedirectResponse:
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")

    state = token_urlsafe(32)
    response = RedirectResponse(get_google_auth_url(state, settings), status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        state,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        max_age=600,
        path="/",
    )
    return response


@app.get("/api/auth/google/callback")
async def google_callback(
    code: str,
    state: str,
    oauth_state: str | None = Cookie(default=None, alias=OAUTH_STATE_COOKIE),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    if not oauth_state or oauth_state != state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        profile = await fetch_google_profile(code, settings)
    except (httpx.HTTPError, KeyError) as error:
        raise HTTPException(status_code=502, detail="Google OAuth exchange failed") from error

    user = upsert_google_user(db, profile)
    session = create_session(db, user)
    response = RedirectResponse(settings.app_origin, status_code=status.HTTP_302_FOUND)
    response.delete_cookie(OAUTH_STATE_COOKIE, path="/")
    set_session_cookie(response, session.token, settings)
    return response


@app.get("/api/auth/me", response_model=CurrentUser)
def auth_me(user: User = Depends(require_user)) -> CurrentUser:
    return CurrentUser(email=user.email, name=user.name, avatar_url=user.avatar_url)


@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def auth_logout(
    response: Response,
    db: Session = Depends(get_db),
    garage_session: str | None = Cookie(default=None, alias=settings.session_cookie_name),
) -> None:
    if garage_session:
        session = db.scalar(select(SessionToken).where(SessionToken.token_hash == hash_token(garage_session)))
        if session is not None:
            db.delete(session)
            db.commit()
    clear_session_cookie(response, settings)


@app.post("/api/vehicles", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Vehicle:
    vehicle = Vehicle(**payload.model_dump(), user_id=user.id)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@app.get("/api/vehicles", response_model=list[VehicleRead])
def list_vehicles(db: Session = Depends(get_db), user: User = Depends(require_user)) -> list[Vehicle]:
    return list(db.scalars(select(Vehicle).where(Vehicle.user_id == user.id).order_by(Vehicle.name)))


@app.post("/api/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Expense:
    ensure_vehicle_exists(db, payload.vehicle_id, user)
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.get("/api/expenses", response_model=list[ExpenseRead])
def list_expenses(db: Session = Depends(get_db), user: User = Depends(require_user)) -> list[Expense]:
    return list(
        db.scalars(
            select(Expense)
            .join(Vehicle)
            .where(Vehicle.user_id == user.id)
            .order_by(Expense.date.desc(), Expense.id.desc())
        )
    )


@app.post("/api/parts", response_model=PartChangeRead, status_code=status.HTTP_201_CREATED)
def create_part_change(
    payload: PartChangeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> PartChange:
    ensure_vehicle_exists(db, payload.vehicle_id, user)
    part = PartChange(**payload.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@app.get("/api/parts", response_model=list[PartChangeRead])
def list_part_changes(db: Session = Depends(get_db), user: User = Depends(require_user)) -> list[PartChange]:
    return list(
        db.scalars(
            select(PartChange)
            .join(Vehicle)
            .where(Vehicle.user_id == user.id)
            .order_by(PartChange.date.desc(), PartChange.id.desc())
        )
    )


@app.post("/api/reminders", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(
    payload: ReminderCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_user),
) -> Reminder:
    ensure_vehicle_exists(db, payload.vehicle_id, user)
    reminder = Reminder(**payload.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@app.get("/api/reminders", response_model=list[ReminderRead])
def list_reminders(db: Session = Depends(get_db), user: User = Depends(require_user)) -> list[Reminder]:
    return list(
        db.scalars(
            select(Reminder)
            .join(Vehicle)
            .where(Vehicle.user_id == user.id)
            .order_by(Reminder.due_date.asc().nullslast(), Reminder.id.desc())
        )
    )


@app.get("/api/summary", response_model=GarageSummary)
def get_summary(db: Session = Depends(get_db), user: User = Depends(require_user)) -> GarageSummary:
    vehicles = list(db.scalars(select(Vehicle).where(Vehicle.user_id == user.id).order_by(Vehicle.name)))
    total_expenses = (
        db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).join(Vehicle).where(Vehicle.user_id == user.id))
        or Decimal("0")
    )
    open_reminder_count = (
        db.scalar(
            select(func.count(Reminder.id)).join(Vehicle).where(Vehicle.user_id == user.id, Reminder.status == "open")
        )
        or 0
    )

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
