from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class BookRequestData(BaseModel):
    title: str
    author: Optional[str] = None
    category_id: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None
    external_link: Optional[str] = None


class UpdateBookRequestData(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category_id: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None
    external_link: Optional[str] = None


@router.post("")
def create_book_request(data: BookRequestData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.title:
            return error_response("Book title is required", 400)

        request_data = {
            "user_id": current_user["id"],
            "title": data.title,
            "author": data.author,
            "category_id": data.category_id,
            "language": data.language,
            "description": data.description,
            "external_link": data.external_link,
            "status": "pending"
        }

        response = supabase.table("book_requests").insert(request_data).execute()

        return success_response("Book request submitted", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/my")
def my_book_requests(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("book_requests").select(
            "*, categories(name)"
        ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()

        return success_response("My book requests fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.put("/{request_id}")
def update_my_request(request_id: str, data: UpdateBookRequestData, current_user: dict = Depends(get_current_user)):
    try:
        update_data = {}
        data_dict = data.dict(exclude_unset=True)

        for field in ["title", "author", "category_id", "language", "description", "external_link"]:
            if field in data_dict:
                update_data[field] = data_dict[field]

        response = supabase.table("book_requests").update(update_data).eq("id", request_id).eq("user_id", current_user["id"]).eq("status", "pending").execute()

        return success_response("Book request updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.delete("/{request_id}")
def delete_my_request(request_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("book_requests").delete().eq("id", request_id).eq("user_id", current_user["id"]).eq("status", "pending").execute()

        return success_response("Book request deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)