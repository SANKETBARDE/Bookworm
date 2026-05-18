from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

reading_bp = Blueprint("reading_progress", __name__)


@reading_bp.route("", methods=["POST"])
@login_required
def save_progress():
    try:
        data = request.get_json()

        book_id = data.get("book_id")
        last_page = data.get("last_page", 1)
        last_line_text = data.get("last_line_text")
        progress_percentage = data.get("progress_percentage", 0)

        if not book_id:
            return error_response("book_id is required", 400)

        progress_data = {
            "user_id": g.user["id"],
            "book_id": book_id,
            "last_page": last_page,
            "last_line_text": last_line_text,
            "progress_percentage": progress_percentage
        }

        response = supabase.table("reading_progress").upsert(
            progress_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Reading progress saved", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@reading_bp.route("/<book_id>", methods=["GET"])
@login_required
def get_progress(book_id):
    try:
        response = supabase.table("reading_progress").select("*").eq("user_id", g.user["id"]).eq("book_id", book_id).execute()

        if not response.data:
            return success_response("No reading progress found", None)

        return success_response("Reading progress fetched", response.data[0])

    except Exception as e:
        return error_response(str(e), 400)


@reading_bp.route("", methods=["GET"])
@login_required
def get_all_progress():
    try:
        response = supabase.table("reading_progress").select(
            "*, books(title, author, cover_image_url, pdf_url)"
        ).eq("user_id", g.user["id"]).execute()

        return success_response("All reading progress fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)