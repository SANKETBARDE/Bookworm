import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api, { isLoggedIn } from "../services/api";
import { Star, Download, Eye, BookmarkPlus } from "lucide-react";
import AppDropdown from "../components/AppDropdown";

const readingStatusOptions = [
  { value: "to_be_read", label: "To Be Read", tone: "to_be_read" },
  { value: "reading", label: "Reading", tone: "reading" },
  { value: "completed", label: "Completed", tone: "completed" },
  { value: "paused", label: "Paused", tone: "paused" },
  { value: "dropped", label: "Dropped", tone: "dropped" },
];

function StarRating({ value, onChange, size = 22 }) {
  return (
    <div className="star-rating" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = Number(value) >= rating;
        const StarIcon = (
          <Star
            fill={filled ? "currentColor" : "none"}
            size={size}
            strokeWidth={2.2}
          />
        );

        if (!onChange) {
          return (
            <span className={filled ? "star filled" : "star"} key={rating}>
              {StarIcon}
            </span>
          );
        }

        return (
          <button
            aria-checked={Number(value) === rating}
            aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
            className={filled ? "star filled" : "star"}
            key={rating}
            onClick={() => onChange(rating)}
            role="radio"
            type="button"
          >
            {StarIcon}
          </button>
        );
      })}
    </div>
  );
}

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    review_text: "",
  });

  const [commentText, setCommentText] = useState("");
  const [readingStatus, setReadingStatus] = useState("to_be_read");

  const fetchBook = useCallback(async () => {
    try {
      setError("");
      const response = await api.get(`/books/${id}`);
      setBook(response.data.data);
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to load book.");
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/reviews/book/${id}`);
      setReviews(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/book/${id}`);
      setComments(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  }, [id]);

  useEffect(() => {
    window.queueMicrotask(() => {
      fetchBook();
      fetchReviews();
      fetchComments();
    });
  }, [fetchBook, fetchComments, fetchReviews]);

  const startReading = async () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    try {
      await api.post(`/books/${id}/read-count`);
    } catch (error) {
      console.log(error);
    }

    navigate(`/reader/${id}`);
  };

  const downloadBook = async () => {
    try {
      await api.post(`/books/${id}/download-count`);
    } catch (error) {
      console.log(error);
    }

    window.open(book.pdf_url, "_blank");
  };

  const addToReadingList = async () => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/reading-list", {
        book_id: id,
        status: readingStatus,
      });

      alert("Book added to reading list");
    } catch (error) {
      alert(error.response?.data?.message || "Failed");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/reviews", {
        book_id: id,
        ...reviewForm,
      });

      setReviewForm({ rating: 5, review_text: "" });
      fetchReviews();
      fetchBook();
    } catch (error) {
      alert(error.response?.data?.message || "Review failed");
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();

    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/comments", {
        book_id: id,
        comment_text: commentText,
      });

      setCommentText("");
      fetchComments();
    } catch (error) {
      alert(error.response?.data?.message || "Comment failed");
    }
  };

  if (error && !book) {
    return (
      <div className="page">
        <p className="alert">{error}</p>
      </div>
    );
  }

  if (!book) {
    return <div className="page">Loading book...</div>;
  }

  return (
    <div className="page">
      <div className="book-details">
        <div className="details-cover">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} />
          ) : (
            <div className="cover-placeholder large">{book.title?.charAt(0)}</div>
          )}
        </div>

        <div className="details-info">
          <h1>{book.title}</h1>
          <p className="muted">by {book.author || "Unknown Author"}</p>

          <div className="book-meta big">
            <span><Star size={18} /> {book.average_rating || 0}</span>
            <span><Eye size={18} /> {book.read_count || 0} reads</span>
            <span><Download size={18} /> {book.download_count || 0} downloads</span>
          </div>

          {book.description && (
            <p className="book-description">{book.description}</p>
          )}

          <div className="book-detail-grid">
            <div className="book-detail-item">
              <span>Language</span>
              <strong>{book.language || "Not specified"}</strong>
            </div>

            {book.categories?.name && (
              <div className="book-detail-item">
                <span>Category</span>
                <strong>{book.categories.name}</strong>
              </div>
            )}

            {book.profiles && (
              <div className="book-detail-item">
                <span>Uploaded by</span>
                <Link to={`/profile/${book.uploaded_by}`}>
                  {book.profiles.full_name}
                </Link>
              </div>
            )}
          </div>

          <div className="details-actions">
            <button className="btn primary" onClick={startReading}>
              Read Online
            </button>

            <button className="btn" onClick={downloadBook}>
              Download PDF
            </button>
          </div>

          <div className="reading-list-box">
            <AppDropdown
              label="Reading Status"
              value={readingStatus}
              options={readingStatusOptions}
              onChange={setReadingStatus}
            />

            <button className="btn" onClick={addToReadingList}>
              <BookmarkPlus size={16} />
              Add to Library
            </button>
          </div>
        </div>
      </div>

      <section className="section">
        <h2>Reviews</h2>

        <form className="review-form" onSubmit={submitReview}>
          <div className="review-rating-row">
            <span>Your rating</span>
            <StarRating
              value={reviewForm.rating}
              onChange={(rating) => setReviewForm({ ...reviewForm, rating })}
              size={28}
            />
          </div>

          <textarea
            placeholder="Write your review"
            value={reviewForm.review_text}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, review_text: e.target.value })
            }
          />

          <button className="btn primary">Submit Review</button>
        </form>

        <div className="list">
          {reviews.map((review) => (
            <div className="list-card" key={review.id}>
              <div className="review-card-head">
                <strong>{review.profiles?.full_name || "User"}</strong>
                <StarRating value={review.rating} size={18} />
              </div>
              <p>{review.review_text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Comments</h2>

        <form className="review-form" onSubmit={submitComment}>
          <textarea
            placeholder="Write a comment"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />

          <button className="btn primary">Post Comment</button>
        </form>

        <div className="list">
          {comments.map((comment) => (
            <div className="list-card" key={comment.id}>
              <strong>{comment.profiles?.full_name || "User"}</strong>
              <p>{comment.comment_text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BookDetails;
