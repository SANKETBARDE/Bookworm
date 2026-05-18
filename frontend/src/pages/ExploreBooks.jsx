import { useEffect, useState } from "react";
import api from "../services/api";
import BookCard from "../components/BookCard";

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

        <select
          name="category_id"
          value={filters.category_id}
          onChange={handleChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option value={cat.id} key={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select name="language" value={filters.language} onChange={handleChange}>
          <option value="">All Languages</option>
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Kannada">Kannada</option>
          <option value="Marathi">Marathi</option>
        </select>

        <select name="sort" value={filters.sort} onChange={handleChange}>
          <option value="newest">Newest</option>
          <option value="most_read">Most Read</option>
          <option value="most_downloaded">Most Downloaded</option>
          <option value="top_rated">Top Rated</option>
        </select>

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