from dataclasses import dataclass
from hashlib import sha256
from secrets import token_urlsafe
from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import Cookie, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.config import Settings, get_settings
from backend.app.database import get_db
from backend.app.models import SessionToken, User

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
OAUTH_STATE_COOKIE = "garage_oauth_state"


@dataclass(frozen=True)
class CreatedSession:
    token: str
    record: SessionToken


def hash_token(token: str, settings: Settings | None = None) -> str:
    active_settings = settings or get_settings()
    return sha256(f"{active_settings.session_secret}:{token}".encode("utf-8")).hexdigest()


def create_session(db: Session, user: User) -> CreatedSession:
    token = token_urlsafe(48)
    record = SessionToken(user_id=user.id, token_hash=hash_token(token))
    db.add(record)
    db.commit()
    db.refresh(record)
    return CreatedSession(token=token, record=record)


def set_session_cookie(response: Response, token: str, settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()
    response.set_cookie(
        active_settings.session_cookie_name,
        token,
        httponly=True,
        secure=active_settings.session_cookie_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings | None = None) -> None:
    active_settings = settings or get_settings()
    response.delete_cookie(active_settings.session_cookie_name, path="/")


def get_google_auth_url(state: str, settings: Settings) -> str:
    redirect_uri = f"{settings.api_public_origin.rstrip('/')}/api/auth/google/callback"
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    )
    return f"{GOOGLE_AUTH_URL}?{query}"


async def fetch_google_profile(code: str, settings: Settings) -> dict[str, str]:
    redirect_uri = f"{settings.api_public_origin.rstrip('/')}/api/auth/google/callback"
    async with httpx.AsyncClient(timeout=10) as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]
        profile_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        profile_response.raise_for_status()
        return profile_response.json()


def upsert_google_user(db: Session, profile: dict[str, str]) -> User:
    google_sub = profile["sub"]
    user = db.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = User(google_sub=google_sub, email=profile["email"])
        db.add(user)

    user.email = profile["email"]
    user.name = profile.get("name")
    user.avatar_url = profile.get("picture")
    db.commit()
    db.refresh(user)
    return user


def require_user(
    db: Annotated[Session, Depends(get_db)],
    garage_session: Annotated[str | None, Cookie(alias="garage_session")] = None,
) -> User:
    if not garage_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    session = db.scalar(select(SessionToken).where(SessionToken.token_hash == hash_token(garage_session)))
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    user = db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user
