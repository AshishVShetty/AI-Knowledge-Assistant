from schemas.login_schema import LoginRequest
from fastapi import HTTPException, APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from services.jwt_service import create_access_token, get_current_user
import bcrypt

from schemas.user_schema import UserCreate
from models.user import User
from config.db_session import get_db

router = APIRouter()

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Validate current session token and return user profile."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email
    }

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()

        if existing_user:
            if existing_user.email == user.email:
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Username already taken"
                )

        hashed_password = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            username=user.username,
            email=user.email,
            password=hashed_password
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User registered successfully",
            "user_id": new_user.id
        }
    except HTTPException:
        raise
    except OperationalError:
        raise HTTPException(
            status_code=503,
            detail="Database connection error. Please ensure the database is available."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(
            User.email == user.email
        ).first()

        if not db_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        if not bcrypt.checkpw(
            user.password.encode("utf-8"),
            db_user.password.encode("utf-8")
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        token = create_access_token(
            {
                "user_id": db_user.id,
                "email": db_user.email
            }
        )

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except OperationalError:
        raise HTTPException(
            status_code=503,
            detail="Database connection error. Please ensure the database is available."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )