from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from enum import Enum
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")

# Sichere JWT-Konfiguration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Verstärktes Passwort-Hashing (bcrypt mit 12 Runden)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Standard ist 12, erhöht die Sicherheit
)
security = HTTPBearer()

# Brute-Force-Schutz Konfiguration
MAX_LOGIN_ATTEMPTS = 5  # Maximale Fehlversuche
LOCKOUT_DURATION_MINUTES = 15  # Sperrzeit in Minuten
LOGIN_ATTEMPT_WINDOW_MINUTES = 30  # Zeitfenster für Fehlversuche

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Fiscal year configuration
FISCAL_YEAR_START_MONTH = 8  # August
FISCAL_YEAR_START_DAY = 1

def get_fiscal_year(date: datetime) -> str:
    """
    Berechnet das Geschäftsjahr für ein gegebenes Datum.
    Geschäftsjahr läuft vom 01.08.YYYY bis 31.07.(YYYY+1)
    
    Beispiel: 15.09.2025 -> "2025/2026"
              15.06.2026 -> "2025/2026"
              15.08.2026 -> "2026/2027"
    """
    year = date.year
    month = date.month
    day = date.day
    
    # Wenn vor dem Start des Geschäftsjahrs (vor 1. August)
    if month < FISCAL_YEAR_START_MONTH or (month == FISCAL_YEAR_START_MONTH and day < FISCAL_YEAR_START_DAY):
        # Gehört zum vorherigen Geschäftsjahr
        return f"{year-1}/{year}"
    else:
        # Gehört zum aktuellen Geschäftsjahr
        return f"{year}/{year+1}"

def get_current_fiscal_year() -> str:
    """Gibt das aktuelle Geschäftsjahr zurück"""
    return get_fiscal_year(datetime.now(timezone.utc))

# Enums
class UserRole(str, Enum):
    admin = "admin"
    spiess = "spiess"
    vorstand = "vorstand"

class MemberStatus(str, Enum):
    aktiv = "aktiv"
    passiv = "passiv"
    archiviert = "archiviert"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    message: str
    role: str
    username: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# Audit Log Model
class AuditAction(str, Enum):
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: Optional[str] = None
    username: Optional[str] = None
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None

# Audit Log Helper
async def log_audit(
    action: AuditAction,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    username: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    audit_entry = AuditLog(
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        user_id=user_id,
        username=username,
        details=details,
        ip_address=ip_address
    )
    await db.audit_logs.insert_one(audit_entry.model_dump())
    logger.info(f"AUDIT: {action.value} - {resource_type} - User: {username} - IP: {ip_address}")

class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: MemberStatus = MemberStatus.aktiv
    archived_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberCreate(BaseModel):
    name: str
    status: MemberStatus = MemberStatus.aktiv

class FineType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    amount: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FineTypeCreate(BaseModel):
    label: str
    amount: Optional[float] = None

class Fine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    fine_type_id: str
    fine_type_label: str
    amount: float
    fiscal_year: str  # z.B. "2025/2026"
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

class FineCreate(BaseModel):
    member_id: str
    fine_type_id: str
    amount: float
    date: Optional[str] = None  # ISO date string, optional
    notes: Optional[str] = None

class FineUpdate(BaseModel):
    amount: Optional[float] = None
    notes: Optional[str] = None

class RankingEntry(BaseModel):
    member_id: str
    member_name: str
    total: float
    rank: int

class Statistics(BaseModel):
    fiscal_year: str
    total_fines: int
    total_amount: float
    sau: Optional[RankingEntry] = None
    laemmchen: Optional[RankingEntry] = None
    ranking: List[RankingEntry]

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

def require_admin(payload: dict = Depends(verify_token)):
    if payload.get('role') != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin-Berechtigung erforderlich")
    return payload

def require_admin_or_spiess(payload: dict = Depends(verify_token)):
    """Erlaubt Zugriff für Admin und Spiess"""
    if payload.get('role') not in ['admin', 'spiess']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin- oder Spiess-Berechtigung erforderlich")
    return payload

def require_any_role(payload: dict = Depends(verify_token)):
    """Erlaubt Zugriff für Admin, Spiess und Vorstand"""
    if payload.get('role') not in ['admin', 'spiess', 'vorstand']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Keine Berechtigung")
    return payload

@api_router.post("/auth/login", response_model=LoginResponse)
@limiter.limit("5/minute")
async def login(request: Request, login_data: LoginRequest):
    ip_address = get_remote_address(request)
    
    # Find user by username
    user_doc = await db.users.find_one({"username": login_data.username}, {"_id": 0})
    
    if not user_doc:
        # Log failed login attempt
        await log_audit(
            action=AuditAction.LOGIN_FAILED,
            resource_type="auth",
            username=login_data.username,
            details="Benutzer nicht gefunden",
            ip_address=ip_address
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Benutzername oder Passwort falsch")
    
    # Verify password
    if not pwd_context.verify(login_data.password, user_doc['password_hash']):
        # Log failed login attempt
        await log_audit(
            action=AuditAction.LOGIN_FAILED,
            resource_type="auth",
            user_id=user_doc.get('id'),
            username=login_data.username,
            details="Falsches Passwort",
            ip_address=ip_address
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Benutzername oder Passwort falsch")
    
    token = jwt.encode(
        {
            'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.now(timezone.utc),
            'sub': user_doc['id'],
            'username': user_doc['username'],
            'role': user_doc['role']
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # Log successful login
    await log_audit(
        action=AuditAction.LOGIN_SUCCESS,
        resource_type="auth",
        user_id=user_doc['id'],
        username=user_doc['username'],
        ip_address=ip_address
    )
    
    return LoginResponse(
        token=token, 
        message="Login erfolgreich",
        role=user_doc['role'],
        username=user_doc['username']
    )

@api_router.put("/auth/change-password")
async def change_password(request: Request, data: ChangePasswordRequest, auth=Depends(verify_token)):
    ip_address = get_remote_address(request)
    user_id = auth.get('sub')
    username = auth.get('username')
    
    # Benutzer aus DB holen
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Aktuelles Passwort prüfen
    if not pwd_context.verify(data.current_password, user_doc['password_hash']):
        await log_audit(
            action=AuditAction.UPDATE,
            resource_type="password",
            user_id=user_id,
            username=username,
            details="Passwortänderung fehlgeschlagen - falsches aktuelles Passwort",
            ip_address=ip_address
        )
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")
    
    # Neues Passwort validieren
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 6 Zeichen lang sein")
    
    # Neues Passwort hashen und speichern
    new_password_hash = pwd_context.hash(data.new_password)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Audit Log
    await log_audit(
        action=AuditAction.UPDATE,
        resource_type="password",
        user_id=user_id,
        username=username,
        details="Passwort erfolgreich geändert",
        ip_address=ip_address
    )
    
    return {"message": "Passwort erfolgreich geändert"}

# ============== Benutzerverwaltung (nur Admin) ==============

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    created_at: Optional[str] = None

class UserCreateRequest(BaseModel):
    username: str
    password: str
    role: UserRole

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(auth=Depends(require_admin)):
    """Alle Benutzer abrufen (nur Admin)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    # Konvertiere datetime zu string falls nötig
    for user in users:
        if user.get('created_at') and not isinstance(user['created_at'], str):
            user['created_at'] = user['created_at'].isoformat()
    return users

@api_router.post("/users", response_model=UserResponse)
async def create_user(request: Request, data: UserCreateRequest, auth=Depends(require_admin)):
    """Neuen Benutzer erstellen (nur Admin)"""
    ip_address = get_remote_address(request)
    
    # Prüfen ob Benutzername bereits existiert
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Benutzername existiert bereits")
    
    # Passwort validieren
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen lang sein")
    
    # Benutzer erstellen
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": data.username,
        "password_hash": pwd_context.hash(data.password),
        "role": data.role.value,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Audit Log
    await log_audit(
        action=AuditAction.CREATE,
        resource_type="user",
        resource_id=user_id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Benutzer erstellt: {data.username} (Rolle: {data.role.value})",
        ip_address=ip_address
    )
    
    return UserResponse(
        id=user_id,
        username=data.username,
        role=data.role.value,
        created_at=user_doc["created_at"]
    )

@api_router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: str, auth=Depends(require_admin)):
    """Benutzer löschen (nur Admin)"""
    ip_address = get_remote_address(request)
    
    # Benutzer finden
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Admin kann sich nicht selbst löschen
    if user_id == auth.get('sub'):
        raise HTTPException(status_code=400, detail="Sie können sich nicht selbst löschen")
    
    # Letzten Admin nicht löschen
    if user.get('role') == 'admin':
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Der letzte Admin kann nicht gelöscht werden")
    
    await db.users.delete_one({"id": user_id})
    
    # Audit Log
    await log_audit(
        action=AuditAction.DELETE,
        resource_type="user",
        resource_id=user_id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Benutzer gelöscht: {user.get('username')}",
        ip_address=ip_address
    )
    
    return {"message": "Benutzer gelöscht"}

class ResetPasswordRequest(BaseModel):
    new_password: str

@api_router.put("/users/{user_id}/reset-password")
async def reset_user_password(request: Request, user_id: str, data: ResetPasswordRequest, auth=Depends(require_admin)):
    """Passwort eines Benutzers zurücksetzen (nur Admin)"""
    ip_address = get_remote_address(request)
    
    # Benutzer finden
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    
    # Passwort validieren
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 6 Zeichen lang sein")
    
    # Neues Passwort setzen
    new_password_hash = pwd_context.hash(data.new_password)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Audit Log
    await log_audit(
        action=AuditAction.UPDATE,
        resource_type="user",
        resource_id=user_id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Passwort zurückgesetzt für: {user.get('username')}",
        ip_address=ip_address
    )
    
    return {"message": "Passwort erfolgreich zurückgesetzt"}

# ============== Mitglieder ==============

@api_router.get("/members", response_model=List[Member])
async def get_members(auth=Depends(verify_token)):
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        if isinstance(member.get('created_at'), str):
            member['created_at'] = datetime.fromisoformat(member['created_at'])
    return members

@api_router.post("/members", response_model=Member)
async def create_member(request: Request, input: MemberCreate, auth=Depends(require_any_role)):
    member = Member(**input.model_dump())
    doc = member.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.members.insert_one(doc)
    
    # Audit Log
    await log_audit(
        action=AuditAction.CREATE,
        resource_type="member",
        resource_id=member.id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Mitglied erstellt: {member.name}",
        ip_address=get_remote_address(request)
    )
    
    return member

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(request: Request, member_id: str, input: MemberCreate, auth=Depends(require_any_role)):
    result = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    
    update_data = {"name": input.name, "status": input.status}
    
    # Wenn Status auf archiviert wechselt, archived_at setzen
    old_status = result.get('status', 'aktiv')
    if input.status == 'archiviert' and old_status != 'archiviert':
        update_data['archived_at'] = datetime.now(timezone.utc).isoformat()
    # Wenn Status von archiviert auf aktiv/passiv wechselt, archived_at löschen
    elif input.status != 'archiviert' and old_status == 'archiviert':
        update_data['archived_at'] = None
    
    await db.members.update_one({"id": member_id}, {"$set": update_data})
    updated = await db.members.find_one({"id": member_id}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('archived_at'), str):
        updated['archived_at'] = datetime.fromisoformat(updated['archived_at'])
    
    # Audit Log
    await log_audit(
        action=AuditAction.UPDATE,
        resource_type="member",
        resource_id=member_id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Mitglied aktualisiert: {input.name}",
        ip_address=get_remote_address(request)
    )
    
    return Member(**updated)

@api_router.delete("/members/{member_id}")
async def delete_member(request: Request, member_id: str, auth=Depends(require_any_role)):
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    
    # Nur archivierte Mitglieder können gelöscht werden
    if member.get('status') != 'archiviert':
        raise HTTPException(status_code=400, detail="Nur archivierte Mitglieder können gelöscht werden")
    
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    await db.fines.delete_many({"member_id": member_id})
    
    # Audit Log
    await log_audit(
        action=AuditAction.DELETE,
        resource_type="member",
        resource_id=member_id,
        user_id=auth.get('sub'),
        username=auth.get('username'),
        details=f"Mitglied gelöscht: {member.get('name') if member else 'unbekannt'}",
        ip_address=get_remote_address(request)
    )
    
    return {"message": "Mitglied gelöscht"}

@api_router.get("/fine-types", response_model=List[FineType])
async def get_fine_types(auth=Depends(verify_token)):
    fine_types = await db.fine_types.find({}, {"_id": 0}).to_list(1000)
    for ft in fine_types:
        if isinstance(ft.get('created_at'), str):
            ft['created_at'] = datetime.fromisoformat(ft['created_at'])
    return fine_types

@api_router.post("/fine-types", response_model=FineType)
async def create_fine_type(input: FineTypeCreate, auth=Depends(require_any_role)):
    fine_type = FineType(**input.model_dump())
    doc = fine_type.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.fine_types.insert_one(doc)
    return fine_type

@api_router.put("/fine-types/{fine_type_id}", response_model=FineType)
async def update_fine_type(fine_type_id: str, input: FineTypeCreate, auth=Depends(require_any_role)):
    result = await db.fine_types.find_one({" id": fine_type_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    
    await db.fine_types.update_one({"id": fine_type_id}, {"$set": input.model_dump()})
    updated = await db.fine_types.find_one({"id": fine_type_id}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return FineType(**updated)

@api_router.delete("/fine-types/{fine_type_id}")
async def delete_fine_type(fine_type_id: str, auth=Depends(require_any_role)):
    result = await db.fine_types.delete_one({"id": fine_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    return {"message": "Strafenart gelöscht"}

@api_router.get("/fines", response_model=List[Fine])
async def get_fines(fiscal_year: Optional[str] = None, auth=Depends(verify_token)):
    query = {}
    if fiscal_year:
        query["fiscal_year"] = fiscal_year
    
    fines = await db.fines.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for fine in fines:
        if isinstance(fine.get('date'), str):
            fine['date'] = datetime.fromisoformat(fine['date'])
    return fines

@api_router.post("/fines", response_model=Fine)
async def create_fine(input: FineCreate, auth=Depends(require_admin_or_spiess)):
    fine_type = await db.fine_types.find_one({"id": input.fine_type_id}, {"_id": 0})
    if not fine_type:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    
    member = await db.members.find_one({"id": input.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    
    # Keine Strafen für archivierte Mitglieder
    if member.get('status') == 'archiviert':
        raise HTTPException(status_code=400, detail="Keine Strafen für archivierte Mitglieder möglich")
    
    fine_data = input.model_dump()
    fine_data['fine_type_label'] = fine_type['label']
    
    # Datum verarbeiten - wenn angegeben, parsen, sonst jetzt
    if input.date:
        try:
            fine_date = datetime.fromisoformat(input.date.replace('Z', '+00:00'))
        except:
            fine_date = datetime.now(timezone.utc)
    else:
        fine_date = datetime.now(timezone.utc)
    
    fine_data['date'] = fine_date
    fine_data['fiscal_year'] = get_fiscal_year(fine_date)
    
    fine = Fine(**fine_data)
    doc = fine.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.fines.insert_one(doc)
    return fine

@api_router.put("/fines/{fine_id}", response_model=Fine)
async def update_fine(fine_id: str, input: FineUpdate, auth=Depends(require_admin_or_spiess)):
    result = await db.fines.find_one({"id": fine_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Strafe nicht gefunden")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.fines.update_one({"id": fine_id}, {"$set": update_data})
    
    updated = await db.fines.find_one({"id": fine_id}, {"_id": 0})
    if isinstance(updated.get('date'), str):
        updated['date'] = datetime.fromisoformat(updated['date'])
    
    return Fine(**updated)

@api_router.delete("/fines/{fine_id}")
async def delete_fine(fine_id: str, auth=Depends(require_admin_or_spiess)):
    result = await db.fines.delete_one({"id": fine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strafe nicht gefunden")
    return {"message": "Strafe gelöscht"}

@api_router.get("/statistics", response_model=Statistics)
async def get_statistics(fiscal_year: str, auth=Depends(verify_token)):
    fines = await db.fines.find({"fiscal_year": fiscal_year}, {"_id": 0}).to_list(10000)
    # Nur aktive und passive Mitglieder (keine archivierten)
    members = await db.members.find({"status": {"$ne": "archiviert"}}, {"_id": 0}).to_list(1000)
    
    member_map = {m['id']: m['name'] for m in members}
    member_status = {m['id']: m.get('status', 'aktiv') for m in members}
    totals = {}
    
    for fine in fines:
        member_id = fine['member_id']
        # Nur Strafen von nicht-archivierten Mitgliedern zählen
        if member_id not in member_map:
            continue
        if member_id not in totals:
            totals[member_id] = 0
        totals[member_id] += fine['amount']
    
    ranking = []
    for member_id, total in totals.items():
        ranking.append(RankingEntry(
            member_id=member_id,
            member_name=member_map.get(member_id, "Unbekannt"),
            total=total,
            rank=0
        ))
    
    ranking.sort(key=lambda x: x.total, reverse=True)
    for idx, entry in enumerate(ranking):
        entry.rank = idx + 1
    
    sau = ranking[0] if len(ranking) > 0 else None
    laemmchen = ranking[-1] if len(ranking) > 0 else None
    
    return Statistics(
        fiscal_year=fiscal_year,
        total_fines=len(fines),
        total_amount=sum(f['amount'] for f in fines),
        sau=sau,
        laemmchen=laemmchen,
        ranking=ranking
    )

@api_router.get("/fiscal-years")
async def get_fiscal_years(auth=Depends(verify_token)):
    pipeline = [
        {"$group": {"_id": "$fiscal_year"}},
        {"$sort": {"_id": -1}}
    ]
    result = await db.fines.aggregate(pipeline).to_list(100)
    fiscal_years = [r['_id'] for r in result if r['_id']]
    
    # Wenn keine Geschäftsjahre in DB, füge aktuelles hinzu
    if not fiscal_years:
        fiscal_years = [get_current_fiscal_year()]
    
    return {"fiscal_years": fiscal_years}

# Audit Log Endpoint (nur Admin)
@api_router.get("/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    auth=Depends(require_admin)
):
    query = {}
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"logs": logs, "total": len(logs)}

# Health Check Endpoint (für Docker und Monitoring)
@app.get("/health")
async def health_check():
    """Health check endpoint für Docker und Load Balancer"""
    try:
        # Prüfe MongoDB Verbindung
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    """Erstellt den Admin-Benutzer beim Start, falls nicht vorhanden"""
    try:
        existing_admin = await db.users.find_one({"username": "admin"})
        if not existing_admin:
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            admin_user = {
                "id": str(uuid.uuid4()),
                "username": "admin",
                "password_hash": pwd_context.hash(admin_password),
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(admin_user)
            logger.info(f"Admin-Benutzer erstellt mit Passwort aus Umgebungsvariable")
        else:
            logger.info("Admin-Benutzer existiert bereits")
    except Exception as e:
        logger.error(f"Fehler beim Erstellen des Admin-Benutzers: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()