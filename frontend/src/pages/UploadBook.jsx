import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Upload } from "lucide-react";
import AppDropdown from "../components/AppDropdown";
import api from "../services/api";

const normalizeAuthorKey = (author) => author.toLowerCase().replace(/[^a-z0-9]/g, "");

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Marathi", label: "Marathi" },
];

function UploadBook() {
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);

  const [form, setForm] = useState({
    title: "",
    author: "",
    category_id: "",
    language: "English",
    description: "",
    tags: "",
    pdf: null,
    cover: null,
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorSuggestionOpen, setAuthorSuggestionOpen] = useState(false);
  const [highlightedAuthorIndex, setHighlightedAuthorIndex] = useState(0);

  const authorMap = useMemo(() => {
    return authors.reduce((map, author) => {
      map.set(normalizeAuthorKey(author), author);
      return map;
    }, new Map());
  }, [authors]);

  const authorSuggestions = useMemo(() => {
    const query = form.author.trim();
    const normalizedQuery = normalizeAuthorKey(query);

    if (!normalizedQuery) return [];

    return authors
      .filter((author) => normalizeAuthorKey(author).includes(normalizedQuery))
      .sort((first, second) => {
        const firstKey = normalizeAuthorKey(first);
        const secondKey = normalizeAuthorKey(second);
        const firstStarts = firstKey.startsWith(normalizedQuery);
        const secondStarts = secondKey.startsWith(normalizedQuery);

        if (firstStarts !== secondStarts) {
          return firstStarts ? -1 : 1;
        }

        return first.localeCompare(second);
      })
      .slice(0, 7);
  }, [authors, form.author]);

  const showAuthorSuggestions = authorSuggestionOpen && authorSuggestions.length > 0;

  const getCanonicalAuthor = useCallback(
    (author) => {
      const trimmedAuthor = author.trim();
      return authorMap.get(normalizeAuthorKey(trimmedAuthor)) || trimmedAuthor;
    },
    [authorMap]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/books/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const fetchAuthors = useCallback(async () => {
    try {
      const response = await api.get("/books/authors");
      setAuthors(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    window.queueMicrotask(() => {
      fetchCategories();
      fetchAuthors();
    });
  }, [fetchAuthors, fetchCategories]);

  useEffect(() => {
    if (highlightedAuthorIndex >= authorSuggestions.length) {
      setHighlightedAuthorIndex(0);
    }
  }, [authorSuggestions.length, highlightedAuthorIndex]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setForm({
        ...form,
        [name]: files[0],
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  };

  const handleAuthorChange = (e) => {
    setForm({
      ...form,
      author: e.target.value,
    });
    setAuthorSuggestionOpen(Boolean(e.target.value.trim()));
    setHighlightedAuthorIndex(0);
  };

  const handleAuthorBlur = () => {
    setForm({
      ...form,
      author: getCanonicalAuthor(form.author),
    });
    setAuthorSuggestionOpen(false);
  };

  const selectAuthor = (author) => {
    setForm({
      ...form,
      author,
    });
    setAuthorSuggestionOpen(false);
    setHighlightedAuthorIndex(0);
  };

  const handleAuthorKeyDown = (e) => {
    if (!showAuthorSuggestions) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedAuthorIndex((current) => (current + 1) % authorSuggestions.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedAuthorIndex((current) =>
        current === 0 ? authorSuggestions.length - 1 : current - 1
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();
      selectAuthor(authorSuggestions[highlightedAuthorIndex]);
    }

    if (e.key === "Escape") {
      setAuthorSuggestionOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("author", getCanonicalAuthor(form.author));
    formData.append("category_id", form.category_id);
    formData.append("language", form.language);
    formData.append("description", form.description);
    formData.append("tags", form.tags);

    if (form.pdf) {
      formData.append("pdf", form.pdf);
    }

    if (form.cover) {
      formData.append("cover", form.cover);
    }

    try {
      const response = await api.post("/books/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(response.data.message);

      setForm({
        title: "",
        author: "",
        category_id: "",
        language: "English",
        description: "",
        tags: "",
        pdf: null,
        cover: null,
      });
      setAuthorSuggestionOpen(false);
      fetchAuthors();
    } catch (error) {
      setMessage(error.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page upload-page">
      <div className="form-page upload-form-page">
        <h1>Upload Book</h1>
        <p>Upload a PDF book. It will be visible after admin approval.</p>

        {message && <p className="alert">{message}</p>}

        <form className="form-card upload-form-card" onSubmit={handleSubmit}>
          <section className="upload-section">
            <div className="upload-section-title">
              <h2>Book Details</h2>
              <p>Keep the metadata clean so readers can find it later.</p>
            </div>

            <label className="field">
              <span>Title</span>
              <input
                type="text"
                name="title"
                placeholder="Book Title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field author-field">
              <span>Author</span>
              <div className="author-autocomplete">
                <input
                  aria-autocomplete="list"
                  aria-controls="author-suggestion-list"
                  aria-expanded={showAuthorSuggestions}
                  autoComplete="off"
                  name="author"
                  onBlur={handleAuthorBlur}
                  onChange={handleAuthorChange}
                  onFocus={() => setAuthorSuggestionOpen(Boolean(form.author.trim()))}
                  onKeyDown={handleAuthorKeyDown}
                  placeholder="Author Name"
                  role="combobox"
                  type="text"
                  value={form.author}
                />

                {showAuthorSuggestions && (
                  <div className="author-suggestion-menu" id="author-suggestion-list" role="listbox">
                    {authorSuggestions.map((author, index) => (
                      <button
                        aria-selected={index === highlightedAuthorIndex}
                        className={`author-suggestion-option${index === highlightedAuthorIndex ? " highlighted" : ""}`}
                        key={author}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectAuthor(author);
                        }}
                        role="option"
                        type="button"
                      >
                        <span className="author-suggestion-name">{author}</span>
                        {normalizeAuthorKey(author) === normalizeAuthorKey(form.author) && (
                          <span className="author-suggestion-meta">Match</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <div className="upload-grid">
              <label className="field">
                <span>Category</span>
                <AppDropdown
                  label="Select Category"
                  value={form.category_id}
                  options={[
                    { value: "", label: "Select Category" },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                  onChange={(value) => setForm({ ...form, category_id: value })}
                />
              </label>

              <label className="field">
                <span>Language</span>
                <AppDropdown
                  label="Select Language"
                  value={form.language}
                  options={languageOptions}
                  onChange={(value) => setForm({ ...form, language: value })}
                />
              </label>
            </div>

            <label className="field">
              <span>Description</span>
              <textarea
                name="description"
                placeholder="A short summary for readers"
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Tags</span>
              <input
                type="text"
                name="tags"
                placeholder="python, programming, beginner"
                value={form.tags}
                onChange={handleChange}
              />
            </label>
          </section>

          <section className="upload-section">
            <div className="upload-section-title">
              <h2>Files</h2>
              <p>The PDF is required. A cover image is optional.</p>
            </div>

            <div className="upload-file-grid">
              <label className="file-picker">
                <FileText size={20} />
                <span>
                  <strong>PDF File</strong>
                  <small>{form.pdf?.name || "Choose a PDF"}</small>
                </span>
                <input type="file" name="pdf" accept="application/pdf" onChange={handleChange} required />
              </label>

              <label className="file-picker">
                <ImagePlus size={20} />
                <span>
                  <strong>Cover Image</strong>
                  <small>{form.cover?.name || "Optional image"}</small>
                </span>
                <input type="file" name="cover" accept="image/*" onChange={handleChange} />
              </label>
            </div>
          </section>

          <div className="upload-submit-row">
            <button className="btn primary" disabled={loading}>
              <Upload size={16} />
              {loading ? "Uploading..." : "Upload Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadBook;
