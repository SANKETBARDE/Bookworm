from functools import wraps
from flask import request, g
from services.supabase_client import supabase
from utils.helpers import error_response, get_user_id_from_auth_user, get_user_email_from_auth_user


def get_token_from_header():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.split(" ")[1]


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return error_response("Authorization token missing", 401)

        try:
            auth_user = supabase.auth.get_user(token)

            user_id = get_user_id_from_auth_user(auth_user)
            email = get_user_email_from_auth_user(auth_user)

            if not user_id:
                return error_response("Invalid token", 401)

            profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

            g.user = {
                "id": user_id,
                "email": email,
                "profile": profile_response.data
            }

        except Exception:
            return error_response("Invalid or expired token", 401)

        return f(*args, **kwargs)

    return decorated_function


def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return error_response("Authorization token missing", 401)

        try:
            auth_user = supabase.auth.get_user(token)

            user_id = get_user_id_from_auth_user(auth_user)
            email = get_user_email_from_auth_user(auth_user)

            if not user_id:
                return error_response("Invalid token", 401)

            profile_response = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
            profile = profile_response.data

            if not profile or profile.get("role") != "admin":
                return error_response("Admin access required", 403)

            g.user = {
                "id": user_id,
                "email": email,
                "profile": profile
            }

        except Exception:
            return error_response("Invalid or expired token", 401)

        return f(*args, **kwargs)

    return decorated_function