import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, get_current_user
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.models import User, AuditLog
from backend.app.schemas.schemas import Token, LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        audit = AuditLog(
            actor=request.username,
            action="LOGIN_FAILED",
            resource_type="auth",
            outcome="failure",
            details="Invalid username or password supplied"
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    user.last_login = datetime.datetime.utcnow()
    db.commit()

    token = create_access_token(subject=user.username, role=user.role)

    audit = AuditLog(
        actor=user.username,
        action="LOGIN_SUCCESS",
        resource_type="auth",
        outcome="success",
        details=f"User {user.username} logged in with role {user.role}"
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user:
        audit = AuditLog(
            actor=current_user.username,
            action="LOGOUT",
            resource_type="auth",
            outcome="success",
            details="User logged out"
        )
        db.add(audit)
        db.commit()
    return {"message": "Successfully logged out"}
