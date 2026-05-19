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

  const fetchBooks = async () => {
    setLoading(true);

    try {
      const response = await api.get("/books", {
        params: filters,
      });

      setBooks(response.data.data || []);
    } catch (error) {
      console.log(error);
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
    fetchBooks();
  }, []);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Explore Books</h1>
        <p>Search and discover books uploaded by the community.</p>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
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
          onChange={(value) => setFilters({ ...filters, category_id: value })}
        />

        <AppDropdown
          label="All Languages"
          value={filters.language}
          options={languageOptions}
          onChange={(value) => setFilters({ ...filters, language: value })}
        />

        <AppDropdown
          label="Sort Books"
          value={filters.sort}
          options={sortOptions}
          onChange={(value) => setFilters({ ...filters, sort: value })}
        />

        <button className="btn primary">Search</button>
      </form>

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
