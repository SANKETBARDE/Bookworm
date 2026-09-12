from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from services.storage_service import upload_file_to_supabase
from utils.helpers import success_response, error_response, get_nested_value, get_user_id_from_auth_user, get_user_email_from_auth_user
from utils.validators import is_image, required_fields
from utils.dependencies import get_current_user

router = APIRouter()


def is_email_confirmed(user):
    return bool(
        get_nested_value(user, "email_confirmed_at")
        or get_nested_value(user, "confirmed_at")
    )


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    username: Optional[str] = None


@router.post("/register")
def register(data: RegisterRequest):
    try:
        full_name = data.full_name.strip()
        username = data.username.strip() if data.username else None
        email = data.email.strip().lower()
        password = data.password

        if len(password) < 6:
            return error_response("Password must be at least 6 characters.", 400)

        auth_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "username": username
            }
        })

        user_id = get_user_id_from_auth_user(auth_response)

        if not user_id:
            return error_response("Registration failed.", 400)

        profile_data = {
            "id": user_id,
            "full_name": full_name,
            "username": username,
            "email": email,
            "role": "user"
        }

        try:
            supabase.table("profiles").upsert(profile_data, on_conflict="id").execute()
        except Exception:
            try:
                supabase.auth.admin.delete_user(user_id)
            except Exception:
                pass
            raise

        return success_response("Registration successful. You can now log in.", {
            "user_id": user_id,
            "email": email,
            "email_confirmed": True
        }, 201)

    except Exception as e:
        return error_response(str(e), 400)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password
        })

        session = getattr(response, "session", None)
        user = getattr(response, "user", None)

        if not session:
            return error_response("Invalid login credentials", 401)

        if not is_email_confirmed(user):
            return error_response("Please confirm your email before logging in.", 403)

        profile_response = supabase.table("profiles").select("*").eq("id", user.id).single().execute()

        return success_response("Login successful", {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email
            },
            "profile": profile_response.data
        })

    except Exception as e:
        message = str(e)
        if "email not confirmed" in message.lower():
            return error_response("Please confirm your email before logging in.", 403)

        return error_response(message, 401)


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
def refresh_session(data: RefreshRequest):
    try:
        refresh_token = data.refresh_token

        if not refresh_token:
            return error_response("Refresh token missing", 400)

        response = supabase.auth.refresh_session(refresh_token)
        session = getattr(response, "session", None)
        user = getattr(response, "user", None)

        if not session:
            return error_response("Session refresh failed", 401)

        access_token = get_nested_value(session, "access_token")
        next_refresh_token = get_nested_value(session, "refresh_token") or refresh_token

        if not access_token:
            return error_response("Session refresh failed", 401)

        user_id = get_user_id_from_auth_user(user)
        email = get_user_email_from_auth_user(user)

        if not user_id:
            auth_user = supabase.auth.get_user(access_token)
            user_id = get_user_id_from_auth_user(auth_user)
            email = get_user_email_from_auth_user(auth_user)

        if not user_id:
            return error_response("Session refresh failed", 401)

        profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

        return success_response("Session refreshed", {
            "access_token": access_token,
            "refresh_token": next_refresh_token,
            "user": {
                "id": user_id,
                "email": email
            },
            "profile": profile_response.data
        })

    except Exception:
        return error_response("Invalid or expired refresh token", 401)


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return success_response("Current user fetched", current_user)


@router.put("/profile")
async def update_profile(request: Request, current_user: dict = Depends(get_current_user)):
    try:
        content_type = request.headers.get("content-type", "")
        if "multipart/form-data" in content_type:
            form_data = await request.form()
            data = dict(form_data)
            profile_image = form_data.get("profile_image")
        else:
            try:
                data = await request.json()
            except:
                data = {}
            profile_image = None

        allowed_fields = ["full_name", "username", "bio", "profile_image_url"]
        update_data = {}

        for field in allowed_fields:
            if field in data:
                value = data.get(field)
                if value is not None:
                    update_data[field] = value.strip() if isinstance(value, str) else value

        if profile_image and hasattr(profile_image, "filename") and profile_image.filename:
            if not is_image(profile_image.filename):
                return error_response("Profile photo must be png, jpg, jpeg, or webp", 400)

            image_upload = upload_file_to_supabase(
                profile_image,
                "profile-images",
                "profiles"
            )

            if not image_upload["success"]:
                return error_response(image_upload["message"], 400)

            update_data["profile_image_url"] = image_upload["url"]

        if not update_data:
            return error_response("No valid fields to update", 400)

        supabase.table("profiles").update(update_data).eq("id", current_user["id"]).execute()
        response = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()

        return success_response("Profile updated successfully", response.data)

    except Exception as e:
        return error_response(str(e), 400)
