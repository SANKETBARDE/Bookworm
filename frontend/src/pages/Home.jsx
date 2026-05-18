import { Link } from "react-router-dom";
import { BookOpen, Search, Upload, Bookmark } from "lucide-react";

function Home() {
  return (
    <div>
      <section className="hero">
        <div>
          <h1>Read, Upload & Discover Books Online</h1>
          <p>
            Bookworm is a smart digital library where users can upload PDFs,
            read books online, save bookmarks, track progress, and discover books
            shared by others.
          </p>

          <div className="hero-buttons">
            <Link to="/books" className="btn primary">Explore Books</Link>
            <Link to="/upload" className="btn">Upload Book</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <BookOpen />
          <h3>Read Online</h3>
          <p>Open PDFs inside the website and continue from your last page.</p>
        </div>

        <div className="feature-card">
          <Upload />
          <h3>Upload Books</h3>
          <p>Share book PDFs with title, author, category, and cover image.</p>
        </div>

        <div className="feature-card">
          <Bookmark />
          <h3>Bookmarks</h3>
          <p>Save important pages, lines, and personal notes.</p>
        </div>

        <div className="feature-card">
          <Search />
          <h3>Search & Discover</h3>
          <p>Find books by title, author, category, language, and rating.</p>
        </div>
      </section>
    </div>
  );
}

export default Home;
