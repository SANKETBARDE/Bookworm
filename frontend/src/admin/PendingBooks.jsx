import { useEffect, useState } from "react";
import AdminSubnav from "./AdminSubnav";
import api from "../services/api";

function PendingBooks() {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    try {
      const response = await api.get("/admin/pending-books");
      setBooks(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const approveBook = async (id) => {
    try {
      await api.put(`/admin/books/${id}/approve`);
      fetchBooks();
    } catch (error) {
      alert("Failed to approve");
    }
  };

  const rejectBook = async (id) => {
    const reason = prompt("Enter rejection reason:");

    if (!reason) return;

    try {
      await api.put(`/admin/books/${id}/reject`, { reason });
      fetchBooks();
    } catch (error) {
      alert("Failed to reject");
    }
  };

  return (
    <div className="page">
      <AdminSubnav />

      <div className="page-header">
        <h1>Pending Books</h1>
      </div>

      <div className="list">
        {books.length > 0 ? (
          books.map((book) => (
            <div className="list-card" key={book.id}>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>Uploaded by: {book.uploaded_by_name}</p>

              <div className="card-actions">
                <a href={book.pdf_url} target="_blank" className="btn-small">
                  View PDF
                </a>

                <button className="btn-small primary" onClick={() => approveBook(book.id)}>
                  Approve
                </button>

                <button className="btn-small danger" onClick={() => rejectBook(book.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No pending books.</p>
        )}
      </div>
    </div>
  );
}

export default PendingBooks;
