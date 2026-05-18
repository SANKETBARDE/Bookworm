from flask import Blueprint, request, g
from services.supabase_client import supabase
from utils.decorators import login_required
from utils.helpers import success_response, error_response

comment_bp = Blueprint("comments", __name__)


@comment_bp.route("", methods=["POST"])
@login_required
def create_comment():
    try:
        data = request.get_json()

        book_id = data.get("book_id")
        comment_text = data.get("comment_text")

        if not book_id or not comment_text:
            return error_response("book_id and comment_text are required", 400)

        comment_data = {
            "user_id": g.user["id"],
            "book_id": book_id,
            "comment_text": comment_text
        }

        response = supabase.table("comments").insert(comment_data).execute()

        return success_response("Comment added", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@comment_bp.route("/book/<book_id>", methods=["GET"])
def get_book_comments(book_id):
    try:
        response = supabase.table("comments").select(
            "*, profiles(full_name, username, profile_image_url)"
        ).eq("book_id", book_id).order("created_at", desc=True).execute()

        return success_response("Comments fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@comment_bp.route("/<comment_id>", methods=["PUT"])
@login_required
def update_comment(comment_id):
    try:
        data = request.get_json()

        comment_text = data.get("comment_text")

        if not comment_text:
            return error_response("comment_text is required", 400)

        response = supabase.table("comments").update({
            "comment_text": comment_text
        }).eq("id", comment_id).eq("user_id", g.user["id"]).execute()

        return success_response("Comment updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@comment_bp.route("/<comment_id>", methods=["DELETE"])
@login_required
def delete_comment(comment_id):
    try:
        response = supabase.table("comments").delete().eq("id", comment_id).eq("user_id", g.user["id"]).execute()

        return success_response("Comment deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)