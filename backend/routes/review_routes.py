from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

review_bp = Blueprint("reviews", __name__)


@review_bp.route("", methods=["POST"])
@login_required
def create_review():
    try:
        data = request.get_json()

        book_id = data.get("book_id")
        rating = data.get("rating")
        review_text = data.get("review_text")

        if not book_id or not rating:
            return error_response("book_id and rating are required", 400)

        if int(rating) < 1 or int(rating) > 5:
            return error_response("Rating must be between 1 and 5", 400)

        review_data = {
            "user_id": g.user["id"],
            "book_id": book_id,
            "rating": rating,
            "review_text": review_text
        }

        response = supabase.table("reviews").upsert(
            review_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Review saved", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@review_bp.route("/book/<book_id>", methods=["GET"])
def get_book_reviews(book_id):
    try:
        response = supabase.table("reviews").select(
            "*, profiles(full_name, username, profile_image_url)"
        ).eq("book_id", book_id).order("created_at", desc=True).execute()

        return success_response("Reviews fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@review_bp.route("/my", methods=["GET"])
@login_required
def my_reviews():
    try:
        response = supabase.table("reviews").select(
            "*, books(title, author, cover_image_url)"
        ).eq("user_id", g.user["id"]).order("created_at", desc=True).execute()

        return success_response("My reviews fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@review_bp.route("/<review_id>", methods=["PUT"])
@login_required
def update_review(review_id):
    try:
        data = request.get_json()

        update_data = {}

        if "rating" in data:
            rating = int(data["rating"])
            if rating < 1 or rating > 5:
                return error_response("Rating must be between 1 and 5", 400)
            update_data["rating"] = rating

        if "review_text" in data:
            update_data["review_text"] = data["review_text"]

        response = supabase.table("reviews").update(update_data).eq("id", review_id).eq("user_id", g.user["id"]).execute()

        return success_response("Review updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@review_bp.route("/<review_id>", methods=["DELETE"])
@login_required
def delete_review(review_id):
    try:
        response = supabase.table("reviews").delete().eq("id", review_id).eq("user_id", g.user["id"]).execute()

        return success_response("Review deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)