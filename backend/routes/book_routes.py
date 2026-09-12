import re
from fastapi import APIRouter, Request, Depends, Form, UploadFile, File, Query
from typing import Optional
from services.supabase_client import supabase
from services.storage_service import upload_file_to_supabase
from utils.dependencies import get_current_user
from utils.helpers import success_response, error_response
from utils.validators import is_pdf, is_image

router = APIRouter()


def normalize_author_key(author):
    return re.sub(r"[^a-z0-9]", "", (author or "").lower())


def get_author_names():
    response = supabase.table("books").select("author").execute()
    authors_by_key = {}

    for book in response.data or []:
        author = (book.get("author") or "").strip()
        key = normalize_author_key(author)

        if author and key and key not in authors_by_key:
            authors_by_key[key] = author

    return sorted(authors_by_key.values(), key=str.casefold)


def canonical_author_name(author):
    author = (author or "").strip()
    key = normalize_author_key(author)

    if not key:
        return author

    for existing_author in get_author_names():
        if normalize_author_key(existing_author) == key:
            return existing_author

    return author


def get_category_name(category_id):
    response = supabase.table("categories").select("name").eq("id", category_id).limit(1).execute()
    category = response.data[0] if response.data else None

    return category.get("name") if category else None


@router.get("")
def get_books(
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    language: Optional[str] = None,
    sort: str = "newest"
):
    try:
        query = supabase.table("approved_books_view").select("*")

        if search:
            query = query.or_(
                f"title.ilike.%{search}%,author.ilike.%{search}%,description.ilike.%{search}%"
            )

        if category_id:
            category_name = get_category_name(category_id)

            if not category_name:
                return success_response("Books fetched successfully", [])

            query = query.eq("category_name", category_name)

        if language:
            query = query.eq("language", language)

        if sort == "most_read":
            query = query.order("read_count", desc=True)
        elif sort == "most_downloaded":
            query = query.order("download_count", desc=True)
        elif sort == "top_rated":
            query = query.order("average_rating", desc=True)
        else:
            query = query.order("created_at", desc=True)

        response = query.execute()

        return success_response("Books fetched successfully", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/categories")
def get_categories():
    try:
        response = supabase.table("categories").select("*").order("name").execute()
        return success_response("Categories fetched successfully", response.data)
    except Exception as e:
        return error_response(str(e), 400)


@router.get("/authors")
def get_authors():
    try:
        return success_response("Authors fetched successfully", get_author_names())
    except Exception as e:
        return error_response(str(e), 400)


@router.get("/{book_id}")
def get_book(book_id: str):
    try:
        response = supabase.table("books").select(
            "*, categories(name), profiles!books_uploaded_by_fkey(full_name, username, profile_image_url)"
        ).eq("id", book_id).single().execute()

        if not response.data:
            return error_response("Book not found", 404)

        book = response.data

        if book.get("status") != "approved":
            return error_response("Book is not approved yet", 403)

        return success_response("Book fetched successfully", book)

    except Exception as e:
        return error_response(str(e), 404)


@router.post("/upload")
async def upload_book(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    try:
        form_data = await request.form()
        
        title = (form_data.get("title") or "").strip()
        author = canonical_author_name(form_data.get("author"))
        category_id = form_data.get("category_id")
        language = form_data.get("language", "English")
        description = form_data.get("description")
        tags_raw = form_data.get("tags", "")

        pdf_file = form_data.get("pdf")
        cover_file = form_data.get("cover")

        if not title:
            return error_response("Book title is required", 400)

        if not pdf_file or not hasattr(pdf_file, "filename") or not pdf_file.filename:
            return error_response("PDF file is required", 400)

        if not is_pdf(pdf_file.filename):
            return error_response("Only PDF files are allowed", 400)

        pdf_upload = upload_file_to_supabase(
            pdf_file,
            "book-pdfs",
            "books"
        )

        if not pdf_upload["success"]:
            return error_response(pdf_upload["message"], 400)

        cover_url = None

        if cover_file and hasattr(cover_file, "filename") and cover_file.filename:
            if not is_image(cover_file.filename):
                return error_response("Cover must be png, jpg, jpeg, or webp", 400)

            cover_upload = upload_file_to_supabase(
                cover_file,
                "book-covers",
                "covers"
            )

            if not cover_upload["success"]:
                return error_response(cover_upload["message"], 400)

            cover_url = cover_upload["url"]

        tags = [tag.strip() for tag in tags_raw.split(",") if tag.strip()]

        book_data = {
            "title": title,
            "author": author,
            "category_id": category_id if category_id else None,
            "language": language,
            "description": description,
            "tags": tags,
            "pdf_url": pdf_upload["url"],
            "cover_image_url": cover_url,
            "uploaded_by": current_user["id"],
            "status": "pending"
        }

        response = supabase.table("books").insert(book_data).execute()

        return success_response(
            "Book uploaded successfully. Waiting for admin approval.",
            response.data,
            201
        )

    except Exception as e:
        return error_response(str(e), 400)


@router.get("/my-uploads")
def my_uploads(current_user: dict = Depends(get_current_user)):
    try:
        response = supabase.table("books").select("*").eq("uploaded_by", current_user["id"]).order("created_at", desc=True).execute()

        return success_response("My uploads fetched successfully", response.data)

    except Exception as e:
        return error_response(str(e), 400)


@router.post("/{book_id}/read-count")
def increase_read_count(book_id: str):
    try:
        book_response = supabase.table("books").select("read_count").eq("id", book_id).single().execute()

        current_count = book_response.data.get("read_count", 0)

        supabase.table("books").update({
            "read_count": current_count + 1
        }).eq("id", book_id).execute()

        return success_response("Read count updated")

    except Exception as e:
        return error_response(str(e), 400)


@router.post("/{book_id}/download-count")
def increase_download_count(book_id: str):
    try:
        book_response = supabase.table("books").select("download_count").eq("id", book_id).single().execute()

        current_count = book_response.data.get("download_count", 0)

        supabase.table("books").update({
            "download_count": current_count + 1
        }).eq("id", book_id).execute()

        return success_response("Download count updated")

    except Exception as e:
        return error_response(str(e), 400)
