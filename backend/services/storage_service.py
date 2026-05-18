import os
import uuid
from werkzeug.utils import secure_filename
from services.supabase_client import supabase


def get_file_extension(filename):
    return filename.rsplit(".", 1)[1].lower() if "." in filename else ""


def generate_unique_filename(filename):
    ext = get_file_extension(filename)
    clean_name = secure_filename(filename.rsplit(".", 1)[0])
    return f"{clean_name}_{uuid.uuid4().hex}.{ext}"


def upload_file_to_supabase(file, bucket_name, folder_name="uploads"):
    try:
        filename = generate_unique_filename(file.filename)
        file_path = f"{folder_name}/{filename}"

        file_bytes = file.read()

        supabase.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": file.content_type,
                "upsert": "false"
            }
        )

        public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)

        return {
            "success": True,
            "path": file_path,
            "url": public_url
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }


def delete_file_from_supabase(bucket_name, file_path):
    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        return {
            "success": True
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }