from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class AddToReadingListData(BaseModel):
    book_id: str
    status: str = "to_be_read"
    is_favorite: bool = False


class UpdateReadingListData(BaseModel):
    status: Optional[str] = None
    is_favorite: Optional[bool] = None


@router.post("")
def add_to_reading_list(data: AddToReadingListData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.book_id:
            return error_response("book_id is required", 400)

        reading_data = {
            "user_id": current_user["id"],
            "book_id": data.book_id,
            "status": data.status,
            "is_favorite": data.is_favorite
        }

        response = supabase.table("reading_list").upsert(
            reading_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Book added to reading list", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("")
def get_reading_list(
    status: Optional[str] = Query(None),
    favorite: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = supabase.table("reading_list").select(
            "*, books(title, author, cover_image_url, average_rating, pdf_url)"
        ).eq("user_id", current_user["id"])

        if status:
            query = query.eq("status", status)

        if favorite == "true":
            query = query.eq("is_favorite", True)

        response = query.order("updated_at", desc=True).execute()

        return success_response("Reading list fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.put("/{item_id}")
def update_reading_list_item(item_id: str, data: UpdateReadingListData, current_user: dict = Depends(get_current_user)):
    try:
        update_data = {}

        if data.status is not None:
            update_data["status"] = data.status

        if data.is_favorite is not None:
            update_data["is_favorite"] = data.is_favorite

        if not update_data:
            return error_response("No valid fields to update", 400)

        response = supabase.table("reading_list").update(update_data).eq("id", item_id).eq("user_id", current_user["id"]).execute()

        return success_response("Reading list updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.delete("/{item_id}")
def remove_from_reading_list(item_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("reading_list").delete().eq("id", item_id).eq("user_id", current_user["id"]).execute()

        return success_response("Removed from reading list", response.data)

    except Exception as e:
        return error_response(str(e), 400)