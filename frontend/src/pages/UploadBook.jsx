import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Upload } from "lucide-react";
import api from "../services/api";

const normalizeAuthorKey = (author) => author.toLowerCase().replace(/[^a-z0-9]/g, "");

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

  const authorMap = useMemo(() => {
    return authors.reduce((map, author) => {
      map.set(normalizeAuthorKey(author), author);
      return map;
    }, new Map());
  }, [authors]);

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

  const handleAuthorBlur = () => {
    setForm({
      ...form,
      author: getCanonicalAuthor(form.author),
    });
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

            <label className="field">
              <span>Author</span>
              <input
                type="text"
                name="author"
                placeholder="Author Name"
                list="author-suggestions"
                value={form.author}
                onChange={handleChange}
                onBlur={handleAuthorBlur}
              />
            </label>
            <datalist id="author-suggestions">
              {authors.map((author) => (
                <option key={author} value={author} />
              ))}
            </datalist>

            <div className="upload-grid">
              <label className="field">
                <span>Category</span>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option value={cat.id} key={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Language</span>
                <select name="language" value={form.language} onChange={handleChange}>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Kannada">Kannada</option>
                  <option value="Marathi">Marathi</option>
                </select>
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
