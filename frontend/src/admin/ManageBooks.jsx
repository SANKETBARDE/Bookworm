import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, ChevronDown, Download, Edit3, Eye, Save, Tag, Trash2, UserRound, X } from "lucide-react";
import AdminSubnav from "./AdminSubnav";
import api from "../services/api";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "approved", label: "Approved", tone: "approved" },
  { value: "pending", label: "Pending", tone: "pending" },
  { value: "rejected", label: "Rejected", tone: "rejected" },
  { value: "removed", label: "Removed", tone: "removed" },
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Marathi", label: "Marathi" },
];

function AdminDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div
      className="admin-dropdown"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        className="admin-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span>{selectedOption?.label || label}</span>
        <ChevronDown size={18} />
      </button>

      {isOpen && (
        <div className="admin-dropdown-menu">
          {options.map((option) => (
            <button
              className={`admin-dropdown-option ${option.value === value ? "selected" : ""} ${option.tone ? `option-${option.tone}` : ""}`}
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BookCover({ book }) {
  const [hasImageError, setHasImageError] = useState(false);
  const initial = (book.title || "B").charAt(0).toUpperCase();

  if (book.cover_image_url && !hasImageError) {
    return (
      <img
        className="admin-book-cover"
        src={book.cover_image_url}
        alt={book.title || "Book cover"}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <div className="admin-book-cover book-cover-fallback">{initial}</div>;
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ManageBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    category_id: "",
    language: "English",
    description: "",
    tags: "",
    cover: null,
  });
  const [coverPreview, setCoverPreview] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchBooks = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/books", {
        params: status ? { status } : {},
      });

      setBooks(response.data.data || []);
    } catch (error) {
      setBooks([]);
      setError(error.response?.data?.message || "Failed to load books.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [status]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/books/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openEditBook = (book) => {
    setEditingBook(book);
    setEditMessage("");
    setEditForm({
      title: book.title || "",
      author: book.author || "",
      category_id: book.category_id || "",
      language: book.language || "English",
      description: book.description || "",
      tags: Array.isArray(book.tags) ? book.tags.join(", ") : book.tags || "",
      cover: null,
    });
    setCoverPreview(book.cover_image_url || "");
  };

  const closeEditBook = () => {
    setEditingBook(null);
    setCoverPreview("");
    setEditMessage("");
  };

  const handleEditChange = (e) => {
    const { files, name, value } = e.target;

    if (files) {
      const cover = files[0] || null;

      setEditForm((currentForm) => ({
        ...currentForm,
        [name]: cover,
      }));

      setCoverPreview(cover ? URL.createObjectURL(cover) : editingBook?.cover_image_url || "");
      return;
    }

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const submitEditBook = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setEditMessage("");

    try {
      const formData = new FormData();

      formData.append("title", editForm.title);
      formData.append("author", editForm.author);
      formData.append("category_id", editForm.category_id);
      formData.append("language", editForm.language);
      formData.append("description", editForm.description);
      formData.append("tags", editForm.tags);

      if (editForm.cover) {
        formData.append("cover", editForm.cover);
      }

      await api.put(`/admin/books/${editingBook.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchBooks();
      closeEditBook();
    } catch (error) {
      setEditMessage(error.response?.data?.message || "Failed to update book details.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeBook = async (id) => {
    try {
      await api.put(`/admin/books/${id}/remove`);
      fetchBooks();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove");
    }
  };

  return (
    <div className="page">
      <AdminSubnav />

      <div className="page-header">
        <h1>Manage Books</h1>
        <p className="muted">{books.length} books in view</p>
      </div>

      <div className="filter-bar admin-books-filter">
        <AdminDropdown
          label="Filter by status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
        />
      </div>

      {isLoading && <p>Loading books...</p>}
      {error && <p className="alert">{error}</p>}

      <div className="list book-admin-list">
        {!isLoading && !error && books.length === 0 && <p>No books found.</p>}

        {books.map((book) => (
          <article className="list-card admin-book-card" key={book.id}>
            <BookCover book={book} />

            <div className="admin-book-main">
              <div>
                <h3>{book.title || "Untitled book"}</h3>
                <div className="admin-book-author">
                  <BookOpen size={15} />
                  <span>{book.author || "Unknown author"}</span>
                </div>
              </div>

              <div className="admin-book-meta">
                <span>
                  <Tag size={15} />
                  {book.categories?.name || "Uncategorized"}
                </span>
                <span>
                  <UserRound size={15} />
                  {book.profiles?.full_name || book.profiles?.email || "Unknown uploader"}
                </span>
                <span>
                  <Eye size={15} />
                  {book.read_count || 0} reads
                </span>
                <span>
                  <Download size={15} />
                  {book.download_count || 0} downloads
                </span>
                <span>
                  <CalendarDays size={15} />
                  Added {formatDate(book.created_at)}
                </span>
              </div>
            </div>

            <div className="admin-book-actions">
              <div className="admin-book-badges">
                <span className={`status ${book.status}`}>{book.status || "unknown"}</span>
              </div>

              <div className="admin-book-action-buttons">
                <button className="btn-small" onClick={() => openEditBook(book)}>
                  <Edit3 size={16} />
                  Edit
                </button>

                {book.status !== "removed" ? (
                  <button className="btn-small danger" onClick={() => removeBook(book.id)}>
                    <Trash2 size={16} />
                    Remove
                  </button>
                ) : (
                  <span className="admin-book-note">Removed</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {editingBook && (
        <div className="modal-backdrop" role="presentation">
          <form className="form-card admin-edit-book-modal" onSubmit={submitEditBook}>
            <div className="admin-edit-book-header">
              <div>
                <h2>Edit Book Details</h2>
                <p className="muted">{editingBook.title}</p>
              </div>

              <button className="icon-btn" type="button" onClick={closeEditBook} aria-label="Close editor">
                <X size={18} />
              </button>
            </div>

            {editMessage && <p className="alert">{editMessage}</p>}

            <div className="admin-edit-cover-row">
              <div className="admin-edit-cover-preview">
                {coverPreview ? (
                  <img src={coverPreview} alt={editForm.title || "Book cover preview"} />
                ) : (
                  <div>{editForm.title?.charAt(0) || "B"}</div>
                )}
              </div>

              <label className="file-picker admin-cover-picker">
                <Edit3 size={20} />
                <span>
                  <strong>Cover Image</strong>
                  <small>{editForm.cover?.name || "Choose a new cover"}</small>
                </span>
                <input type="file" name="cover" accept="image/*" onChange={handleEditChange} />
              </label>
            </div>

            <label className="field">
              <span>Title</span>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                required
              />
            </label>

            <label className="field">
              <span>Author</span>
              <input
                type="text"
                name="author"
                value={editForm.author}
                onChange={handleEditChange}
              />
            </label>

            <div className="admin-edit-book-grid">
              <label className="field">
                <span>Category</span>
                <AdminDropdown
                  label="Select Category"
                  value={editForm.category_id}
                  options={[
                    { value: "", label: "Select Category" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                  onChange={(value) => setEditForm((currentForm) => ({
                    ...currentForm,
                    category_id: value,
                  }))}
                />
              </label>

              <label className="field">
                <span>Language</span>
                <AdminDropdown
                  label="Select Language"
                  value={editForm.language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(value) => setEditForm((currentForm) => ({
                    ...currentForm,
                    language: value,
                  }))}
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
              />
            </label>

            <label className="field">
              <span>Tags</span>
              <input
                type="text"
                name="tags"
                value={editForm.tags}
                onChange={handleEditChange}
                placeholder="python, programming, beginner"
              />
            </label>

            <div className="admin-edit-book-actions">
              <button className="btn" type="button" onClick={closeEditBook}>
                Cancel
              </button>
              <button className="btn primary" disabled={isSaving}>
                <Save size={16} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ManageBooks;
