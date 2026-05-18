from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

reading_list_bp = Blueprint("reading_list", __name__)


@reading_list_bp.route("", methods=["POST"])
@login_required
def add_to_reading_list():
    try:
        data = request.get_json()

        book_id = data.get("book_id")
        status = data.get("status", "to_be_read")
        is_favorite = data.get("is_favorite", False)

        if not book_id:
            return error_response("book_id is required", 400)

        reading_data = {
            "user_id": g.user["id"],
            "book_id": book_id,
            "status": status,
            "is_favorite": is_favorite
        }

        response = supabase.table("reading_list").upsert(
            reading_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Book added to reading list", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@reading_list_bp.route("", methods=["GET"])
@login_required
def get_reading_list():
    try:
        status = request.args.get("status")
        favorite = request.args.get("favorite")

        query = supabase.table("reading_list").select(
            "*, books(title, author, cover_image_url, average_rating, pdf_url)"
        ).eq("user_id", g.user["id"])

        if status:
            query = query.eq("status", status)

        if favorite == "true":
            query = query.eq("is_favorite", True)

        response = query.order("updated_at", desc=True).execute()

        return success_response("Reading list fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@reading_list_bp.route("/<item_id>", methods=["PUT"])
@login_required
def update_reading_list_item(item_id):
    try:
        data = request.get_json()

        update_data = {}

        if "status" in data:
            update_data["status"] = data["status"]

        if "is_favorite" in data:
            update_data["is_favorite"] = data["is_favorite"]

        if not update_data:
            return error_response("No valid fields to update", 400)

        response = supabase.table("reading_list").update(update_data).eq("id", item_id).eq("user_id", g.user["id"]).execute()

        return success_response("Reading list updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@reading_list_bp.route("/<item_id>", methods=["DELETE"])
@login_required
def remove_from_reading_list(item_id):
    try:
        response = supabase.table("reading_list").delete().eq("id", item_id).eq("user_id", g.user["id"]).execute()

        return success_response("Removed from reading list", response.data)

    except Exception as e:
        return error_response(str(e), 400)