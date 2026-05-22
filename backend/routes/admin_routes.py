from flask import Blueprint, request, g
from services.supabase_client import supabase
from services.storage_service import upload_file_to_supabase
from utils.decorators import admin_required
from utils.helpers import success_response, error_response
from utils.validators import is_image

admin_bp = Blueprint("admin", __name__)


def log_admin_action(action_type, target_type=None, target_id=None, description=None):
    try:
        supabase.table("admin_actions").insert({
            "admin_id": g.user["id"],
            "action_type": action_type,
            "target_type": target_type,
            "target_id": target_id,
            "description": description
        }).execute()
    except Exception:
        pass


@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    try:
        users = supabase.table("profiles").select("id").execute()
        books = supabase.table("books").select("id,status").execute()
        reviews = supabase.table("reviews").select("id").execute()
        requests = supabase.table("book_requests").select("id,status").execute()

        all_books = books.data or []
        all_requests = requests.data or []

        data = {
            "total_users": len(users.data or []),
            "total_books": len(all_books),
            "approved_books": len([b for b in all_books if b.get("status") == "approved"]),
            "pending_books": len([b for b in all_books if b.get("status") == "pending"]),
            "rejected_books": len([b for b in all_books if b.get("status") == "rejected"]),
            "total_reviews": len(reviews.data or []),
            "total_requests": len(all_requests),
            "pending_requests": len([r for r in all_requests if r.get("status") == "pending"])
        }

        return success_response("Admin dashboard fetched", data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/pending-books", methods=["GET"])
@admin_required
def pending_books():
    try:
        response = supabase.table("pending_books_view").select("*").order("created_at", desc=True).execute()

        return success_response("Pending books fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books", methods=["GET"])
@admin_required
def all_books():
    try:
        status = request.args.get("status")

        query = supabase.table("books").select(
            "*, profiles!books_uploaded_by_fkey(full_name, email), categories(name)"
        )

        if status:
            query = query.eq("status", status)

        response = query.order("created_at", desc=True).execute()

        return success_response("Books fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books/<book_id>", methods=["PUT"])
@admin_required
def update_book(book_id):
    try:
        data = request.form.to_dict() if request.form else request.get_json(silent=True) or {}
        cover_file = request.files.get("cover")
        update_data = {}

        if "title" in data:
            title = (data.get("title") or "").strip()
            if not title:
                return error_response("Book title is required", 400)
            update_data["title"] = title

        if "author" in data:
            update_data["author"] = (data.get("author") or "").strip()

        if "category_id" in data:
            update_data["category_id"] = data.get("category_id") or None

        if "language" in data:
            update_data["language"] = (data.get("language") or "").strip() or "English"

        if "description" in data:
            update_data["description"] = data.get("description") or None

        if "tags" in data:
            tags = data.get("tags")

            if isinstance(tags, str):
                update_data["tags"] = [tag.strip() for tag in tags.split(",") if tag.strip()]
            elif isinstance(tags, list):
                update_data["tags"] = [str(tag).strip() for tag in tags if str(tag).strip()]
            else:
                update_data["tags"] = []

        if cover_file:
            if not is_image(cover_file.filename):
                return error_response("Cover must be png, jpg, jpeg, or webp", 400)

            cover_upload = upload_file_to_supabase(
                cover_file,
                "book-covers",
                "covers"
            )

            if not cover_upload["success"]:
                return error_response(cover_upload["message"], 400)

            update_data["cover_image_url"] = cover_upload["url"]

        if not update_data:
            return error_response("No book details provided", 400)

        response = supabase.table("books").update(update_data).eq("id", book_id).execute()

        log_admin_action(
            "update_book",
            "book",
            book_id,
            "Admin updated book details"
        )

        return success_response("Book details updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books/<book_id>/approve", methods=["PUT"])
@admin_required
def approve_book(book_id):
    try:
        response = supabase.table("books").update({
            "status": "approved",
            "approved_by": g.user["id"],
            "approved_at": "now()",
            "rejection_reason": None
        }).eq("id", book_id).execute()

        log_admin_action(
            "approve_book",
            "book",
            book_id,
            "Admin approved a book"
        )

        return success_response("Book approved", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books/<book_id>/reject", methods=["PUT"])
@admin_required
def reject_book(book_id):
    try:
        data = request.get_json() or {}
        reason = data.get("reason", "Rejected by admin")

        response = supabase.table("books").update({
            "status": "rejected",
            "rejection_reason": reason
        }).eq("id", book_id).execute()

        log_admin_action(
            "reject_book",
            "book",
            book_id,
            reason
        )

        return success_response("Book rejected", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books/<book_id>/remove", methods=["PUT"])
@admin_required
def remove_book(book_id):
    try:
        response = supabase.table("books").update({
            "status": "removed"
        }).eq("id", book_id).execute()

        log_admin_action(
            "remove_book",
            "book",
            book_id,
            "Admin removed a book"
        )

        return success_response("Book removed", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/books/<book_id>/recover", methods=["PUT"])
@admin_required
def recover_book(book_id):
    try:
        response = supabase.table("books").update({
            "status": "approved",
            "approved_by": g.user["id"],
            "approved_at": "now()",
            "rejection_reason": None
        }).eq("id", book_id).eq("status", "removed").execute()

        if not response.data:
            return error_response("Only removed books can be recovered", 400)

        log_admin_action(
            "recover_book",
            "book",
            book_id,
            "Admin recovered a removed book"
        )

        return success_response("Book recovered", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    try:
        response = supabase.table("profiles").select("*").order("created_at", desc=True).execute()

        return success_response("Users fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/users/<user_id>/deactivate", methods=["PUT"])
@admin_required
def deactivate_user(user_id):
    try:
        response = supabase.table("profiles").update({
            "is_active": False
        }).eq("id", user_id).execute()

        log_admin_action(
            "deactivate_user",
            "user",
            user_id,
            "Admin deactivated a user"
        )

        return success_response("User deactivated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/categories", methods=["POST"])
@admin_required
def create_category():
    try:
        data = request.get_json()

        name = data.get("name")
        description = data.get("description")

        if not name:
            return error_response("Category name is required", 400)

        response = supabase.table("categories").insert({
            "name": name,
            "description": description
        }).execute()

        return success_response("Category created", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/categories/<category_id>", methods=["PUT"])
@admin_required
def update_category(category_id):
    try:
        data = request.get_json()

        update_data = {}

        if "name" in data:
            update_data["name"] = data["name"]

        if "description" in data:
            update_data["description"] = data["description"]

        response = supabase.table("categories").update(update_data).eq("id", category_id).execute()

        return success_response("Category updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/categories/<category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id):
    try:
        response = supabase.table("categories").delete().eq("id", category_id).execute()

        return success_response("Category deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/book-requests", methods=["GET"])
@admin_required
def get_book_requests():
    try:
        response = supabase.table("book_requests").select(
            "*, profiles(full_name, email), categories(name)"
        ).order("created_at", desc=True).execute()

        return success_response("Book requests fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/book-requests/<request_id>/status", methods=["PUT"])
@admin_required
def update_book_request_status(request_id):
    try:
        data = request.get_json()

        status = data.get("status")

        if status not in ["pending", "accepted", "fulfilled", "rejected"]:
            return error_response("Invalid request status", 400)

        response = supabase.table("book_requests").update({
            "status": status,
            "handled_by": g.user["id"],
            "handled_at": "now()"
        }).eq("id", request_id).execute()

        log_admin_action(
            "update_book_request",
            "book_request",
            request_id,
            f"Admin changed request status to {status}"
        )

        return success_response("Book request status updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/reviews", methods=["GET"])
@admin_required
def get_reviews():
    try:
        response = supabase.table("reviews").select(
            "*, profiles(full_name, email), books(title)"
        ).order("created_at", desc=True).execute()

        return success_response("Reviews fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/reviews/<review_id>", methods=["DELETE"])
@admin_required
def admin_delete_review(review_id):
    try:
        response = supabase.table("reviews").delete().eq("id", review_id).execute()

        log_admin_action(
            "delete_review",
            "review",
            review_id,
            "Admin deleted a review"
        )

        return success_response("Review deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/comments", methods=["GET"])
@admin_required
def get_comments():
    try:
        response = supabase.table("comments").select(
            "*, profiles(full_name, email), books(title)"
        ).order("created_at", desc=True).execute()

        return success_response("Comments fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/comments/<comment_id>", methods=["DELETE"])
@admin_required
def admin_delete_comment(comment_id):
    try:
        response = supabase.table("comments").delete().eq("id", comment_id).execute()

        log_admin_action(
            "delete_comment",
            "comment",
            comment_id,
            "Admin deleted a comment"
        )

        return success_response("Comment deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/reports", methods=["GET"])
@admin_required
def get_reports():
    try:
        response = supabase.table("reports").select("*").order("created_at", desc=True).execute()

        return success_response("Reports fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@admin_bp.route("/reports/<report_id>/status", methods=["PUT"])
@admin_required
def update_report_status(report_id):
    try:
        data = request.get_json()

        status = data.get("status")

        if status not in ["pending", "reviewed", "resolved", "rejected"]:
            return error_response("Invalid report status", 400)

        response = supabase.table("reports").update({
            "status": status,
            "handled_by": g.user["id"],
            "handled_at": "now()"
        }).eq("id", report_id).execute()

        return success_response("Report status updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)
