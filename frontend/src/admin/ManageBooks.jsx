import { useEffect, useState } from "react";
import api from "../services/api";

function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("");

  const fetchBooks = async () => {
    try {
      const response = await api.get("/admin/books", {
        params: status ? { status } : {},
      });

      setBooks(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [status]);

  const removeBook = async (id) => {
    try {
      await api.put(`/admin/books/${id}/remove`);
      fetchBooks();
    } catch (error) {
      alert("Failed to remove");
    }
  };

  return (
    <div className="page">
      <h1>Manage Books</h1>

      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      <div className="list">
        {books.map((book) => (
          <div className="list-card" key={book.id}>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
            <p>Status: <span className={`status ${book.status}`}>{book.status}</span></p>

            <button className="btn-small danger" onClick={() => removeBook(book.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageBooks;