from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

bookmark_bp = Blueprint("bookmarks", __name__)


@bookmark_bp.route("", methods=["POST"])
@login_required
def create_bookmark():
    try:
        data = request.get_json()

        book_id = data.get("book_id")
        page_number = data.get("page_number")
        line_text = data.get("line_text")
        note = data.get("note")

        if not book_id or not page_number:
            return error_response("book_id and page_number are required", 400)

        bookmark_data = {
            "user_id": g.user["id"],
            "book_id": book_id,
            "page_number": page_number,
            "line_text": line_text,
            "note": note
        }

        response = supabase.table("bookmarks").insert(bookmark_data).execute()

        return success_response("Bookmark added", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@bookmark_bp.route("", methods=["GET"])
@login_required
def get_my_bookmarks():
    try:
        response = supabase.table("bookmarks").select(
            "*, books(title, author, cover_image_url)"
        ).eq("user_id", g.user["id"]).order("created_at", desc=True).execute()

        return success_response("Bookmarks fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@bookmark_bp.route("/book/<book_id>", methods=["GET"])
@login_required
def get_book_bookmarks(book_id):
    try:
        response = supabase.table("bookmarks").select("*").eq("user_id", g.user["id"]).eq("book_id", book_id).order("page_number").execute()

        return success_response("Book bookmarks fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@bookmark_bp.route("/<bookmark_id>", methods=["DELETE"])
@login_required
def delete_bookmark(bookmark_id):
    try:
        response = supabase.table("bookmarks").delete().eq("id", bookmark_id).eq("user_id", g.user["id"]).execute()

        return success_response("Bookmark deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)