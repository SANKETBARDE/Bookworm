from flask import Blueprint
from services.supabase_client import supabase
from utils.helpers import success_response, error_response

user_bp = Blueprint("users", __name__)


@user_bp.route("/<user_id>/profile", methods=["GET"])
def public_profile(user_id):
    try:
        profile_response = supabase.table("profiles").select(
            "id, full_name, username, bio, profile_image_url, created_at"
        ).eq("id", user_id).single().execute()

        uploads_response = supabase.table("books").select(
            "id, title, author, cover_image_url, average_rating, created_at"
        ).eq("uploaded_by", user_id).eq("status", "approved").execute()

        reviews_response = supabase.table("reviews").select(
            "id, rating, review_text, created_at, books(id, title, author)"
        ).eq("user_id", user_id).execute()

        stats = {
            "total_uploaded_books": len(uploads_response.data or []),
            "total_reviews": len(reviews_response.data or [])
        }

        return success_response("Public profile fetched", {
            "profile": profile_response.data,
            "uploads": uploads_response.data,
            "reviews": reviews_response.data,
            "stats": stats
        })

    except Exception as e:
        return error_response(str(e), 404)