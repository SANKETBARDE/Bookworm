import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText } from "lucide-react";
import api from "../services/api";

const getStatusLabel = (status) =>
  ({
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    removed: "Removed",
  })[status] || status || "Unknown";

function MyUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/books/my-uploads");
      setUploads(response.data.data || []);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to load uploads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.queueMicrotask(() => {
      fetchUploads();
    });
  }, [fetchUploads]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Uploads</h1>
        <p>Track your uploaded books and approval status.</p>
      </div>

      {message && <p className="alert">{message}</p>}

      {loading ? (
        <p>Loading uploads...</p>
      ) : (
        <div className="list">
          {uploads.length > 0 ? (
            uploads.map((book) => (
              <div className="library-card upload-card" key={book.id}>
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} />
                ) : (
                  <div className="cover-placeholder">{book.title?.charAt(0)}</div>
                )}

                <div className="library-card-body">
                  <h3>{book.title || "Untitled Book"}</h3>
                  <p className="muted">{book.author || "Unknown Author"}</p>

                  <div className="library-card-meta">
                    <span>Status</span>
                    <span className={`status ${book.status}`}>{getStatusLabel(book.status)}</span>
                  </div>

                  {book.rejection_reason && (
                    <p className="upload-reason">
                      <strong>Reason:</strong> {book.rejection_reason}
                    </p>
                  )}

                  <div className="card-actions">
                    {book.status === "approved" && (
                      <Link to={`/books/${book.id}`} className="btn-small primary">
                        <BookOpen size={15} />
                        View Book
                      </Link>
                    )}

                    {book.pdf_url && (
                      <a className="btn-small" href={book.pdf_url} rel="noreferrer" target="_blank">
                        <FileText size={15} />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No uploads yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyUploads;
