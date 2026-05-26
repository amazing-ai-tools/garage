from decimal import Decimal

from fastapi.testclient import TestClient

from backend.app.auth import create_session
from backend.app.database import Base, engine
from backend.app.main import app
from backend.app.models import User


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def authenticated_client() -> TestClient:
    reset_database()
    client = TestClient(app)
    with client:
        from backend.app.database import SessionLocal

        with SessionLocal() as db:
            user = User(
                google_sub="google-user-1",
                email="owner@example.com",
                name="Garage Owner",
                avatar_url="https://example.com/avatar.png",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            session = create_session(db, user)
            client.cookies.set("garage_session", session.token, domain="testserver.local")
    return client


def test_health_check_reports_database_status():
    reset_database()

    response = TestClient(app).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


def test_garage_endpoints_require_authenticated_session():
    reset_database()

    response = TestClient(app).get("/api/vehicles")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required"


def test_auth_me_returns_current_google_user():
    client = authenticated_client()

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json() == {
        "email": "owner@example.com",
        "name": "Garage Owner",
        "avatar_url": "https://example.com/avatar.png",
    }


def test_create_vehicle_and_list_it_with_summary_totals():
    client = authenticated_client()

    vehicle_response = client.post(
        "/api/vehicles",
        json={
            "name": "Clio daily",
            "make": "Renault",
            "model": "Clio IV",
            "year": 2018,
            "odometer_km": 84200,
        },
    )

    assert vehicle_response.status_code == 201
    vehicle = vehicle_response.json()
    assert vehicle["name"] == "Clio daily"
    assert vehicle["odometer_km"] == 84200

    expense_response = client.post(
        "/api/expenses",
        json={
            "vehicle_id": vehicle["id"],
            "date": "2026-05-25",
            "category": "Entretien",
            "description": "Vidange + filtre",
            "amount": "129.90",
            "odometer_km": 84200,
        },
    )
    assert expense_response.status_code == 201

    part_response = client.post(
        "/api/parts",
        json={
            "vehicle_id": vehicle["id"],
            "date": "2026-05-25",
            "name": "Filtre a huile",
            "brand": "Purflux",
            "reference": "LS932",
            "cost": "14.50",
        },
    )
    assert part_response.status_code == 201

    reminder_response = client.post(
        "/api/reminders",
        json={
            "vehicle_id": vehicle["id"],
            "title": "Controle technique",
            "due_date": "2026-09-15",
            "due_odometer_km": 90000,
            "status": "open",
        },
    )
    assert reminder_response.status_code == 201

    summary_response = client.get("/api/summary")

    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert summary["vehicle_count"] == 1
    assert Decimal(summary["total_expenses"]) == Decimal("129.90")
    assert summary["open_reminder_count"] == 1
    assert summary["vehicles"][0]["name"] == "Clio daily"
