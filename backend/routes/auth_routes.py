from flask import Blueprint, request, g
from services.supabase_client import supabase
from services.storage_service import upload_file_to_supabase
from utils.helpers import success_response, error_response, get_nested_value, get_user_id_from_auth_user, get_user_email_from_auth_user
from utils.validators import is_image, required_fields
from utils.decorators import login_required

auth_bp = Blueprint("auth", __name__)


def is_email_confirmed(user):
    return bool(
        get_nested_value(user, "email_confirmed_at")
        or get_nested_value(user, "confirmed_at")
    )


@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json(silent=True) or {}

        missing = required_fields(data, ["full_name", "email", "password"])
        if missing:
            return error_response(f"Missing fields: {', '.join(missing)}", 400)

        full_name = data.get("full_name", "").strip()
        username = data.get("username", "").strip() or None
        email = data.get("email", "").strip().lower()
        password = data.get("password")

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


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        missing = required_fields(data, ["email", "password"])
        if missing:
            return error_response(f"Missing fields: {', '.join(missing)}", 400)

        response = supabase.auth.sign_in_with_password({
            "email": data.get("email"),
            "password": data.get("password")
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


@auth_bp.route("/refresh", methods=["POST"])
def refresh_session():
    try:
        data = request.get_json(silent=True) or {}
        refresh_token = data.get("refresh_token")

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


@auth_bp.route("/me", methods=["GET"])
@login_required
def me():
    return success_response("Current user fetched", g.user)


@auth_bp.route("/profile", methods=["PUT"])
@login_required
def update_profile():
    try:
        data = request.form if request.content_type and request.content_type.startswith("multipart/form-data") else request.get_json(silent=True) or {}

        allowed_fields = ["full_name", "username", "bio", "profile_image_url"]
        update_data = {}

        for field in allowed_fields:
            if field in data:
                value = data.get(field)
                update_data[field] = value.strip() if isinstance(value, str) else value

        profile_image = request.files.get("profile_image")

        if profile_image:
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

        supabase.table("profiles").update(update_data).eq("id", g.user["id"]).execute()
        response = supabase.table("profiles").select("*").eq("id", g.user["id"]).single().execute()

        return success_response("Profile updated successfully", response.data)

    except Exception as e:
        return error_response(str(e), 400)
