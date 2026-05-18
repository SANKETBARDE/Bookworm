import { Link } from "react-router-dom";
import { Star, Download, Eye } from "lucide-react";

function BookCard({ book }) {
  return (
    <div className="book-card">
      <div className="book-cover">
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title} />
        ) : (
          <div className="cover-placeholder">{book.title?.charAt(0)}</div>
        )}
      </div>

      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="muted">{book.author || "Unknown Author"}</p>

        <div className="book-meta">
          <span>
            <Star size={14} /> {book.average_rating || 0}
          </span>
          <span>
            <Eye size={14} /> {book.read_count || 0}
          </span>
          <span>
            <Download size={14} /> {book.download_count || 0}
          </span>
        </div>

        <Link to={`/books/${book.id}`} className="btn-full">
          View Book
        </Link>
      </div>
    </div>
  );
}

export default BookCard;