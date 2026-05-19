from flask import Flask, jsonify
from flask_cors import CORS
from config import Config

from routes.auth_routes import auth_bp
from routes.book_routes import book_bp
from routes.reading_routes import reading_bp
from routes.bookmark_routes import bookmark_bp
from routes.reading_list_routes import reading_list_bp
from routes.review_routes import review_bp
from routes.comment_routes import comment_bp
from routes.request_routes import request_bp
from routes.user_routes import user_bp
from routes.admin_routes import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True
    )

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(book_bp, url_prefix="/api/books")
    app.register_blueprint(reading_bp, url_prefix="/api/reading-progress")
    app.register_blueprint(bookmark_bp, url_prefix="/api/bookmarks")
    app.register_blueprint(reading_list_bp, url_prefix="/api/reading-list")
    app.register_blueprint(review_bp, url_prefix="/api/reviews")
    app.register_blueprint(comment_bp, url_prefix="/api/comments")
    app.register_blueprint(request_bp, url_prefix="/api/book-requests")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    @app.route("/")
    def home():
        return jsonify({
            "message": "Bookworm Flask Backend is running"
        })

    @app.errorhandler(413)
    def file_too_large(error):
        return jsonify({
            "success": False,
            "message": "File too large. Maximum file size is 50 MB."
        }), 413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "message": "Route not found"
        }), 404

    @app.errorhandler(500)
    def server_error(error):
        return jsonify({
            "success": False,
            "message": "Internal server error"
        }), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
