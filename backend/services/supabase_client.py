from supabase import create_client
from config import Config

if not Config.SUPABASE_URL:
    raise ValueError("SUPABASE_URL is missing in .env")

if not Config.SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY is missing in .env")

supabase = create_client(
    Config.SUPABASE_URL,
    Config.SUPABASE_SERVICE_ROLE_KEY
)