from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_SECRET = os.environ.get('JWT_SECRET', 'schuetzenzug-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Enums
class UserRole(str, Enum):
    admin = "admin"
    vorstand = "vorstand"

class MemberStatus(str, Enum):
    aktiv = "aktiv"
    passiv = "passiv"

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

class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: MemberStatus = MemberStatus.aktiv
    nfc_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberCreate(BaseModel):
    name: str
    status: MemberStatus = MemberStatus.aktiv
    nfc_id: Optional[str] = None

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
    year: int
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notes: Optional[str] = None

class FineCreate(BaseModel):
    member_id: str
    fine_type_id: str
    amount: float
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
    year: int
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

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Find user by username
    user_doc = await db.users.find_one({"username": request.username}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Benutzername oder Passwort falsch")
    
    # Verify password
    if not pwd_context.verify(request.password, user_doc['password_hash']):
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
    return LoginResponse(
        token=token, 
        message="Login erfolgreich",
        role=user_doc['role'],
        username=user_doc['username']
    )

@api_router.get("/members", response_model=List[Member])
async def get_members(auth=Depends(verify_token)):
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        if isinstance(member.get('created_at'), str):
            member['created_at'] = datetime.fromisoformat(member['created_at'])
    return members

@api_router.post("/members", response_model=Member)
async def create_member(input: MemberCreate, auth=Depends(verify_token)):
    member = Member(**input.model_dump())
    doc = member.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.members.insert_one(doc)
    return member

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(member_id: str, input: MemberCreate, auth=Depends(verify_token)):
    result = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    
    update_data = {"name": input.name}
    if input.nfc_id is not None:
        update_data["nfc_id"] = input.nfc_id
    
    await db.members.update_one({"id": member_id}, {"$set": update_data})
    updated = await db.members.find_one({"id": member_id}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return Member(**updated)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, auth=Depends(verify_token)):
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    await db.fines.delete_many({"member_id": member_id})
    return {"message": "Mitglied gelöscht"}

@api_router.get("/fine-types", response_model=List[FineType])
async def get_fine_types(auth=Depends(verify_token)):
    fine_types = await db.fine_types.find({}, {"_id": 0}).to_list(1000)
    for ft in fine_types:
        if isinstance(ft.get('created_at'), str):
            ft['created_at'] = datetime.fromisoformat(ft['created_at'])
    return fine_types

@api_router.post("/fine-types", response_model=FineType)
async def create_fine_type(input: FineTypeCreate, auth=Depends(verify_token)):
    fine_type = FineType(**input.model_dump())
    doc = fine_type.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.fine_types.insert_one(doc)
    return fine_type

@api_router.put("/fine-types/{fine_type_id}", response_model=FineType)
async def update_fine_type(fine_type_id: str, input: FineTypeCreate, auth=Depends(verify_token)):
    result = await db.fine_types.find_one({"id": fine_type_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    
    await db.fine_types.update_one({"id": fine_type_id}, {"$set": input.model_dump()})
    updated = await db.fine_types.find_one({"id": fine_type_id}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    
    return FineType(**updated)

@api_router.delete("/fine-types/{fine_type_id}")
async def delete_fine_type(fine_type_id: str, auth=Depends(verify_token)):
    result = await db.fine_types.delete_one({"id": fine_type_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    return {"message": "Strafenart gelöscht"}

@api_router.get("/fines", response_model=List[Fine])
async def get_fines(year: Optional[int] = None, auth=Depends(verify_token)):
    query = {}
    if year:
        query["year"] = year
    
    fines = await db.fines.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for fine in fines:
        if isinstance(fine.get('date'), str):
            fine['date'] = datetime.fromisoformat(fine['date'])
    return fines

@api_router.post("/fines", response_model=Fine)
async def create_fine(input: FineCreate, auth=Depends(verify_token)):
    fine_type = await db.fine_types.find_one({"id": input.fine_type_id}, {"_id": 0})
    if not fine_type:
        raise HTTPException(status_code=404, detail="Strafenart nicht gefunden")
    
    member = await db.members.find_one({"id": input.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Mitglied nicht gefunden")
    
    fine_data = input.model_dump()
    fine_data['fine_type_label'] = fine_type['label']
    fine_data['year'] = datetime.now(timezone.utc).year
    
    fine = Fine(**fine_data)
    doc = fine.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.fines.insert_one(doc)
    return fine

@api_router.put("/fines/{fine_id}", response_model=Fine)
async def update_fine(fine_id: str, input: FineUpdate, auth=Depends(verify_token)):
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
async def delete_fine(fine_id: str, auth=Depends(verify_token)):
    result = await db.fines.delete_one({"id": fine_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Strafe nicht gefunden")
    return {"message": "Strafe gelöscht"}

@api_router.get("/statistics/{year}", response_model=Statistics)
async def get_statistics(year: int, auth=Depends(verify_token)):
    fines = await db.fines.find({"year": year}, {"_id": 0}).to_list(10000)
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    
    member_map = {m['id']: m['name'] for m in members}
    totals = {}
    
    for fine in fines:
        member_id = fine['member_id']
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
    laemmchen = ranking[1] if len(ranking) > 1 else None
    
    return Statistics(
        year=year,
        total_fines=len(fines),
        total_amount=sum(f['amount'] for f in fines),
        sau=sau,
        laemmchen=laemmchen,
        ranking=ranking
    )

@api_router.get("/years")
async def get_years(auth=Depends(verify_token)):
    pipeline = [
        {"$group": {"_id": "$year"}},
        {"$sort": {"_id": -1}}
    ]
    result = await db.fines.aggregate(pipeline).to_list(100)
    years = [r['_id'] for r in result if r['_id']]
    
    if not years:
        years = [datetime.now(timezone.utc).year]
    
    return {"years": years}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()