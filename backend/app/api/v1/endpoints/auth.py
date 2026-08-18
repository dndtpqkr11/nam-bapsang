from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.core.database import get_db
from app.models.user import User as UserModel
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter()

MASTER_SECRET_KEY = "MASTER2026"
MASTER_CLAIMED: bool = False

class SignupRequest(BaseModel):
    email: str
    password: str
    nickname: str
    master_key: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    """
    신규 회원가입 및 PostgreSQL DB 저장 (단 1개의 마스터 계정만 허용)
    """
    global MASTER_CLAIMED

    stmt = select(UserModel).where(UserModel.email == req.email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="이미 가입된 이메일 주소입니다.")

    user_role = "user"
    if req.master_key and req.master_key.strip():
        if req.master_key.strip() != MASTER_SECRET_KEY:
            raise HTTPException(status_code=400, detail="입력하신 마스터 인증키가 올바르지 않습니다.")

        # 시스템 내 이미 마스터 계정이 존재하는지 검증 (단 1개만 생성 허용)
        if MASTER_CLAIMED:
            raise HTTPException(
                status_code=400, 
                detail="이미 시스템 마스터(관리자) 계정이 이미 선점되어 생성되었습니다. 마스터 계정은 유일하게 1개만 소유 가능합니다."
            )

        if db is not None:
            stmt_master = select(UserModel).where(UserModel.role == "master")
            res_master = await db.execute(stmt_master)
            if res_master.scalars().first():
                MASTER_CLAIMED = True
                raise HTTPException(
                    status_code=400, 
                    detail="이미 시스템 마스터(관리자) 계정이 선점되어 생성되었습니다. 마스터 계정은 유일하게 1개만 소유 가능합니다."
                )

        user_role = "master"
        MASTER_CLAIMED = True

    new_user = UserModel(
        email=req.email,
        hashed_password=hash_password(req.password),
        nickname=req.nickname,
        role=user_role,
        total_fork_earned=0
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email, "role": new_user.role})

    return {
        "success": True,
        "message": f"{'👑 마스터(관리자)' if user_role == 'master' else '🍚 일반 유저'} 회원가입이 완료되었습니다!",
        "access_token": token,
        "user": {
            "id": f"u-{new_user.id}",
            "email": new_user.email,
            "nickname": new_user.nickname,
            "role": new_user.role,
            "total_fork_earned": new_user.total_fork_earned
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    로그인 및 JWT Access Token 발급 (기본 마스터 계정: master@bapsang.com / master123)
    """
    # 1. Default Master Account Fallback Check
    if req.email == "master@bapsang.com" and req.password == "master123":
        token = create_access_token({"sub": "1", "email": "master@bapsang.com", "role": "master"})
        return {
            "success": True,
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": "u-1",
                "email": "master@bapsang.com",
                "nickname": "혼밥마스터",
                "role": "master",
                "total_fork_earned": 142
            }
        }

    # 2. DB User Query Check
    if db is not None:
        try:
            stmt = select(UserModel).where(UserModel.email == req.email)
            res = await db.execute(stmt)
            user = res.scalars().first()

            if user and verify_password(req.password, user.hashed_password):
                user_role = getattr(user, "role", "user") or "user"
                token = create_access_token({"sub": str(user.id), "email": user.email, "role": user_role})

                return {
                    "success": True,
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {
                        "id": f"u-{user.id}",
                        "email": user.email,
                        "nickname": user.nickname,
                        "role": user_role,
                        "total_fork_earned": user.total_fork_earned
                    }
                }
        except Exception as e:
            print(f"Login DB error fallback: {e}")

    raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

@router.get("/me")
async def get_my_profile(authorization: Optional[str] = Header(default=None), db: AsyncSession = Depends(get_db)):
    """
    내 프로필 정보 조회
    """
    if not authorization or not authorization.startswith("Bearer "):
        # Demo fallback profile
        return {
            "success": True,
            "user": {
                "id": "u-1",
                "email": "master@bapsang.com",
                "nickname": "혼밥마스터",
                "role": "master",
                "total_fork_earned": 142
            }
        }

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="유효하지 않거나 만료된 토큰입니다.")

    user_id = int(payload["sub"])
    stmt = select(UserModel).where(UserModel.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다.")

    user_role = getattr(user, "role", "user") or "user"

    return {
        "success": True,
        "user": {
            "id": f"u-{user.id}",
            "email": user.email,
            "nickname": user.nickname,
            "role": user_role,
            "total_fork_earned": user.total_fork_earned
        }
    }
