from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class ReadingProgressData(BaseModel):
    book_id: str
    last_page: int = 1
    last_line_text: Optional[str] = None
    progress_percentage: float = 0


@router.post("")
def save_progress(data: ReadingProgressData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.book_id:
            return error_response("book_id is required", 400)

        progress_data = {
            "user_id": current_user["id"],
            "book_id": data.book_id,
            "last_page": data.last_page,
            "last_line_text": data.last_line_text,
            "progress_percentage": data.progress_percentage
        }

        response = supabase.table("reading_progress").upsert(
            progress_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Reading progress saved", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/{book_id}")
def get_progress(book_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("reading_progress").select("*").eq("user_id", current_user["id"]).eq("book_id", book_id).execute()

        if not response.data:
            return success_response("No reading progress found", None)

        return success_response("Reading progress fetched", response.data[0])

    except Exception as e:
        return error_response(str(e), 400)


@router.get("")
def get_all_progress(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("reading_progress").select(
            "*, books(title, author, cover_image_url, pdf_url)"
        ).eq("user_id", current_user["id"]).execute()

        return success_response("All reading progress fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)