from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class BookmarkData(BaseModel):
    book_id: str
    page_number: int
    line_text: Optional[str] = None
    note: Optional[str] = None


@router.post("")
def create_bookmark(data: BookmarkData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.book_id or data.page_number is None:
            return error_response("book_id and page_number are required", 400)

        bookmark_data = {
            "user_id": current_user["id"],
            "book_id": data.book_id,
            "page_number": data.page_number,
            "line_text": data.line_text,
            "note": data.note
        }

        response = supabase.table("bookmarks").insert(bookmark_data).execute()

        return success_response("Bookmark added", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("")
def get_my_bookmarks(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("bookmarks").select(
            "*, books(title, author, cover_image_url)"
        ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()

        return success_response("Bookmarks fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/book/{book_id}")
def get_book_bookmarks(book_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("bookmarks").select("*").eq("user_id", current_user["id"]).eq("book_id", book_id).order("page_number").execute()

        return success_response("Book bookmarks fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.delete("/{bookmark_id}")
def delete_bookmark(bookmark_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("bookmarks").delete().eq("id", bookmark_id).eq("user_id", current_user["id"]).execute()

        return success_response("Bookmark deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)