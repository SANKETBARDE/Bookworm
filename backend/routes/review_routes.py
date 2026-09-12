from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response

router = APIRouter()


class ReviewData(BaseModel):
    book_id: str
    rating: int
    review_text: Optional[str] = None


class UpdateReviewData(BaseModel):
    rating: Optional[int] = None
    review_text: Optional[str] = None


@router.post("")
def create_review(data: ReviewData, current_user: dict = Depends(get_current_user)):
    try:
        if not data.book_id or data.rating is None:
            return error_response("book_id and rating are required", 400)

        if data.rating < 1 or data.rating > 5:
            return error_response("Rating must be between 1 and 5", 400)

        review_data = {
            "user_id": current_user["id"],
            "book_id": data.book_id,
            "rating": data.rating,
            "review_text": data.review_text
        }

        response = supabase.table("reviews").upsert(
            review_data,
            on_conflict="user_id,book_id"
        ).execute()

        return success_response("Review saved", response.data, 201)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/book/{book_id}")
def get_book_reviews(book_id: str):
    try:
        response = supabase.table("reviews").select(
            "*, profiles(full_name, username, profile_image_url)"
        ).eq("book_id", book_id).order("created_at", desc=True).execute()

        return success_response("Reviews fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/my")
def my_reviews(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("reviews").select(
            "*, books(title, author, cover_image_url)"
        ).eq("user_id", current_user["id"]).order("created_at", desc=True).execute()

        return success_response("My reviews fetched", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.put("/{review_id}")
def update_review(review_id: str, data: UpdateReviewData, current_user: dict = Depends(get_current_user)):
    try:
        update_data = {}

        if data.rating is not None:
            if data.rating < 1 or data.rating > 5:
                return error_response("Rating must be between 1 and 5", 400)
            update_data["rating"] = data.rating

        if data.review_text is not None:
            update_data["review_text"] = data.review_text

        response = supabase.table("reviews").update(update_data).eq("id", review_id).eq("user_id", current_user["id"]).execute()

        return success_response("Review updated", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.delete("/{review_id}")
def delete_review(review_id: str, current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("reviews").delete().eq("id", review_id).eq("user_id", current_user["id"]).execute()

        return success_response("Review deleted", response.data)

    except Exception as e:
        return error_response(str(e), 400)