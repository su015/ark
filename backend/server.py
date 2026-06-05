from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from fastapi.openapi.docs import get_swagger_ui_html

# ------------- Setup -------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("arketype")

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[db_name]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

app = FastAPI(
    title="ARKETYPE API",
    docs_url=None,
    redoc_url=None,
    openapi_url="/api/openapi.json"
)
@app.get("/api/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title="ARKETYPE API Docs",
    )
api = APIRouter(prefix="/api")

# ------------- Auth helpers -------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    # secure=True + samesite="none" required so cookies are sent on cross-site
    # (the preview frontend & backend share the same emergentagent.com domain
    # but routes through ingress; using samesite=none for safety in browsers)
    response.set_cookie(
        key="access_token", value=access, httponly=True, secure=True,
        samesite="none", max_age=3600, path="/",
    )
    response.set_cookie(
        key="refresh_token", value=refresh, httponly=True, secure=True,
        samesite="none", max_age=604800, path="/",
    )


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        try:
            user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ------------- Models -------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    company: Optional[str] = Field(default=None, max_length=120)
    budget: Optional[str] = Field(default=None, max_length=80)
    message: str = Field(min_length=1, max_length=4000)


class NewsletterIn(BaseModel):
    email: EmailStr


class ProjectIn(BaseModel):
    title: str
    client: Optional[str] = None
    year: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    accent_color: Optional[str] = "#FF3D00"
    services: Optional[List[str]] = []
    published: bool = True
    order: int = 0


# ------------- Brute force -------------
async def check_brute_force(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    if record and record.get("count", 0) >= 5:
        locked_until = record.get("locked_until")
        if locked_until and datetime.fromisoformat(locked_until) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")


async def record_failed_login(identifier: str):
    record = await db.login_attempts.find_one({"identifier": identifier})
    count = (record.get("count", 0) if record else 0) + 1
    locked_until = None
    if count >= 5:
        locked_until = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$set": {"count": count, "locked_until": locked_until}},
        upsert=True,
    )


async def clear_failed_logins(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ------------- Auth routes -------------
@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    # Behind ingress, request.client.host is the upstream pod IP and rotates
    # across pods. Use X-Forwarded-For first hop (or email-only fallback) so
    # rate-limiting can't be bypassed by load balancing.
    xff = request.headers.get("x-forwarded-for", "")
    client_ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    identifier = f"{client_ip}:{email}"
    await check_brute_force(identifier)

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_login(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_failed_logins(identifier)
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)

    return {
        "id": user_id,
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role"),
        "access_token": access,  # also return token so frontend can fallback to Bearer
    }


@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(
            key="access_token", value=access, httponly=True, secure=True,
            samesite="none", max_age=3600, path="/",
        )
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ------------- Public routes -------------
@api.get("/")
async def root():
    return {"app": "ARKETYPE", "status": "alive"}


@api.post("/contact")
async def submit_contact(payload: ContactIn):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["read"] = False
    await db.contacts.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api.post("/newsletter")
async def submit_newsletter(payload: NewsletterIn):
    email = payload.email.lower()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"ok": True, "already_subscribed": True}
    await db.newsletter.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api.get("/projects")
async def list_projects():
    cursor = db.projects.find({"published": True}, {"_id": 0}).sort("order", 1)
    items = await cursor.to_list(200)
    return items


# ------------- Admin routes -------------
@api.get("/admin/contacts")
async def admin_list_contacts(user: dict = Depends(require_admin)):
    cursor = db.contacts.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(1000)


@api.patch("/admin/contacts/{contact_id}/read")
async def admin_mark_contact_read(contact_id: str, user: dict = Depends(require_admin)):
    await db.contacts.update_one({"id": contact_id}, {"$set": {"read": True}})
    return {"ok": True}


@api.delete("/admin/contacts/{contact_id}")
async def admin_delete_contact(contact_id: str, user: dict = Depends(require_admin)):
    await db.contacts.delete_one({"id": contact_id})
    return {"ok": True}


@api.get("/admin/newsletter")
async def admin_list_newsletter(user: dict = Depends(require_admin)):
    cursor = db.newsletter.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(5000)


@api.delete("/admin/newsletter/{nid}")
async def admin_delete_newsletter(nid: str, user: dict = Depends(require_admin)):
    await db.newsletter.delete_one({"id": nid})
    return {"ok": True}


@api.get("/admin/projects")
async def admin_list_projects(user: dict = Depends(require_admin)):
    cursor = db.projects.find({}, {"_id": 0}).sort("order", 1)
    return await cursor.to_list(500)


@api.post("/admin/projects")
async def admin_create_project(payload: ProjectIn, user: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/projects/{pid}")
async def admin_update_project(pid: str, payload: ProjectIn, user: dict = Depends(require_admin)):
    res = await db.projects.update_one({"id": pid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one({"id": pid}, {"_id": 0})
    return doc


@api.delete("/admin/projects/{pid}")
async def admin_delete_project(pid: str, user: dict = Depends(require_admin)):
    await db.projects.delete_one({"id": pid})
    return {"ok": True}


# ------------- Startup -------------
async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "ARKETYPE Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info("Admin password updated for: %s", admin_email)


async def seed_projects():
    count = await db.projects.count_documents({})
    if count > 0:
        return
    samples = [
        {
            "title": "ECHO/FORM",
            "client": "Nordic Sound Co.",
            "year": "2025",
            "category": "Brand Identity / Web",
            "description": "A generative identity system that mutates with every customer interaction.",
            "image_url": "https://images.unsplash.com/photo-1620207418302-439b387441b0?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#FF3D00",
            "services": ["Identity", "Web", "Motion"],
            "published": True, "order": 1,
        },
        {
            "title": "VOID/RITUAL",
            "client": "Atelier Noir",
            "year": "2025",
            "category": "Editorial / 3D",
            "description": "A scrollable editorial experience for a Parisian fashion house's archive.",
            "image_url": "https://images.unsplash.com/photo-1558865869-c93f6f8482af?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#00E5FF",
            "services": ["Art Direction", "3D", "Web"],
            "published": True, "order": 2,
        },
        {
            "title": "PULSE/CODEX",
            "client": "Helix Health",
            "year": "2024",
            "category": "Product / Strategy",
            "description": "Reinventing the patient onboarding flow as a tactile, playable interface.",
            "image_url": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#B6FF3D",
            "services": ["Strategy", "Product", "Design System"],
            "published": True, "order": 3,
        },
        {
            "title": "MIRROR/ENGINE",
            "client": "Kabuto Motors",
            "year": "2024",
            "category": "Campaign / WebGL",
            "description": "An interactive launch site that drove 4.2M unique visits in 11 days.",
            "image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#FFD400",
            "services": ["WebGL", "Campaign", "Motion"],
            "published": True, "order": 4,
        },
        {
            "title": "GHOST/CIRCUIT",
            "client": "Subliminal Records",
            "year": "2023",
            "category": "Identity / Album",
            "description": "A record label identity built from glitched anatomies and broken grids.",
            "image_url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#FF00C8",
            "services": ["Identity", "Print", "Web"],
            "published": True, "order": 5,
        },
        {
            "title": "CINDER/PROOF",
            "client": "Forge Distilling",
            "year": "2023",
            "category": "Packaging / Web",
            "description": "Heritage whiskey packaging paired with an immersive tasting microsite.",
            "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1600&auto=format&fit=crop",
            "accent_color": "#FF6A00",
            "services": ["Packaging", "Web", "Copy"],
            "published": True, "order": 6,
        },
    ]
    for s in samples:
        s["id"] = str(uuid.uuid4())
        s["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.insert_many(samples)
    logger.info("Seeded %d sample projects", len(samples))


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.contacts.create_index("created_at")
    await db.newsletter.create_index("email", unique=True)
    await db.projects.create_index("order")
    await seed_admin()
    await seed_projects()


@app.on_event("shutdown")
async def on_shutdown():
    mongo_client.close()


# CORS
cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
frontend_url = os.environ.get("FRONTEND_URL", "")
origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

# When using credentials, browsers reject wildcard. Use regex to permit both
# the preview URL and localhost during development.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api)
