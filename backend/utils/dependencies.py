from fastapi import Depends, HTTPException, Header
from typing import Optional
from services.supabase_client import supabase

def get_token(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization token missing or invalid")
    return authorization.split(" ")[1]


def get_current_user(token: str = Depends(get_token)):
    try:
        auth_response = supabase.auth.get_user(token)
        auth_user = auth_response.user
        if not auth_user or not auth_user.id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user_id = auth_user.id
        email = auth_user.email

        profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        return {
            "id": user_id,
            "email": email,
            "profile": profile_response.data
        }
    except Exception as e:
        # Fallback to catch Supabase client errors or other exceptions
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_admin_user(current_user: dict = Depends(get_current_user)):
    profile = current_user.get("profile")
    if not profile or profile.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
