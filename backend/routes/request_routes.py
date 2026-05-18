from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

request_bp = Blueprint("book_requests", __name__)


@request_bp.route("", methods=["POST"])
@login_required
def create_book_request():
    try:
        data = request.get_json()

        title = data.get("title")
        author = data.get("author")
        category_id = data.get("category_id")
        language = data.get("language")
        description = data.get("description")
        external_link = data.get("external_link")

        if not title:
            return error_response("Book title is required", 400)

        request_data = {
            "user_id": g.user["id"],
            "title": title,
            "author": author,
            "category_id": category_id,
            "language": language,
            "description": description,
            "external_link": external_link,
            "status": "pending"
        }

        response = supabase.table("book_requests").insert(request_data).execute()

        return success_response("Book request submitted", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@request_bp.route("/my", methods=["GET"])
@login_required
def my_book_requests():
    try:
        response = supabase.table("book_requests").select(
            "*, categories(name)"
        ).eq("user_id", g.user["id"]).order("created_at", desc=True).execute()

        return success_response("My book requests fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@request_bp.route("/<request_id>", methods=["PUT"])
@login_required
def update_my_request(request_id):
    try:
        data = request.get_json()

        update_data = {}

        for field in ["title", "author", "category_id", "language", "description", "external_link"]:
            if field in data:
                update_data[field] = data[field]

        response = supabase.table("book_requests").update(update_data).eq("id", request_id).eq("user_id", g.user["id"]).eq("status", "pending").execute()

        return success_response("Book request updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@request_bp.route("/<request_id>", methods=["DELETE"])
@login_required
def delete_my_request(request_id):
    try:
        response = supabase.table("book_requests").delete().eq("id", request_id).eq("user_id", g.user["id"]).eq("status", "pending").execute()

        return success_response("Book request deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)