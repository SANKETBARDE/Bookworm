import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function MyBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);

  const fetchBookmarks = async () => {
    try {
      const response = await api.get("/bookmarks");
      setBookmarks(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const deleteBookmark = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      fetchBookmarks();
    } catch (error) {
      alert("Failed to delete bookmark");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Bookmarks</h1>
        <p>All your saved pages, lines, and notes.</p>
      </div>

      <div className="list">
        {bookmarks.length > 0 ? (
          bookmarks.map((bm) => (
            <div className="list-card" key={bm.id}>
              <h3>{bm.books?.title}</h3>
              <p>Page: {bm.page_number}</p>
              {bm.line_text && <p><strong>Line:</strong> {bm.line_text}</p>}
              {bm.note && <p><strong>Note:</strong> {bm.note}</p>}

              <div className="card-actions">
                <Link to={`/reader/${bm.book_id}`} className="btn-small primary">
                  Open Book
                </Link>

                <button className="btn-small" onClick={() => deleteBookmark(bm.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No bookmarks found.</p>
        )}
      </div>
    </div>
  );
}

export default MyBookmarks;