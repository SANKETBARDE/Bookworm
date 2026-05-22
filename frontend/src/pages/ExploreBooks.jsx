import { useEffect, useState } from "react";
import api from "../services/api";
import AppDropdown from "../components/AppDropdown";
import BookCard from "../components/BookCard";

const languageOptions = [
  { value: "", label: "All Languages" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Kannada", label: "Kannada" },
  { value: "Marathi", label: "Marathi" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "most_read", label: "Most Read" },
  { value: "most_downloaded", label: "Most Downloaded" },
  { value: "top_rated", label: "Top Rated" },
];

function ExploreBooks() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    language: "",
    sort: "newest",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBooks = async (activeFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/books", {
        params: activeFilters,
      });

      setBooks(response.data.data || []);
    } catch (error) {
      console.log(error);
      setBooks([]);
      setError(error.response?.data?.message || "Failed to filter books.");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks(filters);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters]);

  const updateFilter = (name, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const handleChange = (e) => {
    updateFilter(e.target.name, e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(filters);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Explore Books</h1>
        <p>Search and discover books uploaded by the community.</p>
      </div>

      <form className="filter-bar explore-books-filter" onSubmit={handleSearch}>
        <input
          type="text"
          name="search"
          placeholder="Search by title, author, or description"
          value={filters.search}
          onChange={handleChange}
        />

        <AppDropdown
          label="All Categories"
          value={filters.category_id}
          options={[
            { value: "", label: "All Categories" },
            ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
          ]}
          onChange={(value) => updateFilter("category_id", value)}
        />

        <AppDropdown
          label="All Languages"
          value={filters.language}
          options={languageOptions}
          onChange={(value) => updateFilter("language", value)}
        />

        <AppDropdown
          label="Sort Books"
          value={filters.sort}
          options={sortOptions}
          onChange={(value) => updateFilter("sort", value)}
        />

        <button className="btn primary">Search</button>
      </form>

      {error && <p className="alert">{error}</p>}

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div className="book-grid">
          {books.length > 0 ? (
            books.map((book) => <BookCard key={book.id} book={book} />)
          ) : (
            <p>No books found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ExploreBooks;
