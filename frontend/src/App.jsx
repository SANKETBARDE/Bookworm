import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import ExploreBooks from "./pages/ExploreBooks";
import BookDetails from "./pages/BookDetails";
import PDFReader from "./pages/PDFReader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UploadBook from "./pages/UploadBook";
import MyLibrary from "./pages/MyLibrary";
import MyBookmarks from "./pages/MyBookmarks";
import MyUploads from "./pages/MyUploads";
import BookRequests from "./pages/BookRequests";
import PublicProfile from "./pages/PublicProfile";

import AdminDashboard from "./admin/AdminDashboard";
import PendingBooks from "./admin/PendingBooks";
import ManageBooks from "./admin/ManageBooks";
import ManageUsers from "./admin/ManageUsers";
import ManageRequests from "./admin/ManageRequests";

function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />

      <main className="main-content page-transition" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<ExploreBooks />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/profile/:id" element={<PublicProfile />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadBook />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reader/:id"
            element={
              <ProtectedRoute>
                <PDFReader />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-library"
            element={
              <ProtectedRoute>
                <MyLibrary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-bookmarks"
            element={
              <ProtectedRoute>
                <MyBookmarks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-uploads"
            element={
              <ProtectedRoute>
                <MyUploads />
              </ProtectedRoute>
            }
          />

          <Route
            path="/book-requests"
            element={
              <ProtectedRoute>
                <BookRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/pending-books"
            element={
              <ProtectedRoute adminOnly>
                <PendingBooks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/books"
            element={
              <ProtectedRoute adminOnly>
                <ManageBooks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute adminOnly>
                <ManageRequests />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

export default App;
