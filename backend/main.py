from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import Config

from routes.auth_routes import router as auth_router
from routes.book_routes import router as book_router
from routes.reading_routes import router as reading_router
from routes.bookmark_routes import router as bookmark_router
from routes.reading_list_routes import router as reading_list_router
from routes.review_routes import router as review_router
from routes.comment_routes import router as comment_router
from routes.request_routes import router as request_router
from routes.user_routes import router as user_router
from routes.admin_routes import router as admin_router


app = FastAPI(title="Bookworm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(book_router, prefix="/api/books", tags=["books"])
app.include_router(reading_router, prefix="/api/reading-progress", tags=["reading-progress"])
app.include_router(bookmark_router, prefix="/api/bookmarks", tags=["bookmarks"])
app.include_router(reading_list_router, prefix="/api/reading-list", tags=["reading-list"])
app.include_router(review_router, prefix="/api/reviews", tags=["reviews"])
app.include_router(comment_router, prefix="/api/comments", tags=["comments"])
app.include_router(request_router, prefix="/api/book-requests", tags=["book-requests"])
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])


@app.get("/")
def home():
    return {"message": "Bookworm FastAPI Backend is running"}


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"success": False, "message": "Route not found"},
    )
