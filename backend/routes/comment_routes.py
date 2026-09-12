from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class CommentData(BaseModel):
    book_id: str
    comment_text: str


class UpdateCommentData(BaseModel):
    comment_text: str


@router.post("")
def create_comment(data: CommentData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.book_id or not data.comment_text:
            return error_response("book_id and comment_text are required", 400)

        comment_data = {
            "user_id": current_user["id"],
            "book_id": data.book_id,
            "comment_text": data.comment_text
        }

        response = supabase.table("comments").insert(comment_data).execute()

        return success_response("Comment added", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/book/{book_id}")
def get_book_comments(book_id: str):
    try:
        response = supabase.table("comments").select(
            "*, profiles(full_name, username, profile_image_url)"
        ).eq("book_id", book_id).order("created_at", desc=True).execute()

        return success_response("Comments fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.put("/{comment_id}")
def update_comment(comment_id: str, data: UpdateCommentData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.comment_text:
            return error_response("comment_text is required", 400)

        response = supabase.table("comments").update({
            "comment_text": data.comment_text
        }).eq("id", comment_id).eq("user_id", current_user["id"]).execute()

        return success_response("Comment updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.delete("/{comment_id}")
def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("comments").delete().eq("id", comment_id).eq("user_id", current_user["id"]).execute()

        return success_response("Comment deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)