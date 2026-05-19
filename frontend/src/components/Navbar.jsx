import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, Shield } from "lucide-react";
import { getProfile, isLoggedIn, isAdmin, logout } from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const profile = getProfile();
  const navMainRef = useRef(null);
  const navPressTimerRef = useRef(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    visible: false,
    width: 0,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  const navClass = ({ isActive }) => `nav-item${isActive ? " active" : ""}`;

  const positionIndicator = useCallback((element, visible = true) => {
    const navMain = navMainRef.current;

    if (!navMain || !element) return;

    const navRect = navMain.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();

    setIndicator({
      left: itemRect.left - navRect.left + navMain.scrollLeft,
      visible,
      width: itemRect.width,
    });
  }, []);

  const syncActiveIndicator = useCallback(() => {
    const activeItem = navMainRef.current?.querySelector(".nav-item.active");

    if (activeItem) {
      positionIndicator(activeItem);
    } else {
      setIndicator((current) => ({
        ...current,
        visible: false,
      }));
    }
  }, [positionIndicator]);

  const releaseNavPress = useCallback(() => {
    window.clearTimeout(navPressTimerRef.current);
    navPressTimerRef.current = window.setTimeout(() => {
      navMainRef.current?.classList.remove("is-pressing");
    }, 180);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncActiveIndicator);
    window.addEventListener("resize", syncActiveIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncActiveIndicator);
      window.clearTimeout(navPressTimerRef.current);
    };
  }, [location.pathname, loggedIn, syncActiveIndicator]);

  const handleNavPointerDown = (event) => {
    const navMain = navMainRef.current;
    const item = event.target.closest(".nav-item");

    if (!navMain || !item || !navMain.contains(item)) return;

    window.clearTimeout(navPressTimerRef.current);
    navMain.classList.add("is-pressing");
    positionIndicator(item);
  };

  const handleNavPointerOver = (event) => {
    const item = event.target.closest(".nav-item");

    if (item && navMainRef.current?.contains(item)) {
      positionIndicator(item);
    }
  };

  const handleNavPointerLeave = () => {
    releaseNavPress();
    syncActiveIndicator();
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <img src="/longlogo.png" alt="Bookworm" />
      </Link>

      <div className="nav-links" aria-label="Primary navigation">
        <div
          className="nav-main"
          onPointerCancel={releaseNavPress}
          onPointerDown={handleNavPointerDown}
          onPointerLeave={handleNavPointerLeave}
          onPointerOver={handleNavPointerOver}
          onPointerUp={releaseNavPress}
          ref={navMainRef}
          style={{
            "--nav-indicator-left": `${indicator.left}px`,
            "--nav-indicator-opacity": indicator.visible ? 1 : 0,
            "--nav-indicator-width": `${indicator.width}px`,
          }}
        >
          <span aria-hidden="true" className="nav-indicator" />

          <NavLink to="/books" className={navClass}>
            Explore
          </NavLink>

          {loggedIn && (
            <>
              <NavLink to="/upload" className={navClass}>
                Add Book
              </NavLink>
              <NavLink to="/my-library" className={navClass}>
                Library
              </NavLink>
              <NavLink to="/my-bookmarks" className={navClass}>
                Bookmarks
              </NavLink>
              <NavLink to="/my-uploads" className={navClass}>
                My Submissions
              </NavLink>
              <NavLink to="/book-requests" className={navClass}>
                Requests
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-actions">
          {loggedIn && isAdmin() && (
            <NavLink to="/admin" className={({ isActive }) => `admin-link nav-item${isActive ? " active" : ""}`}>
              <Shield size={16} />
              Admin
            </NavLink>
          )}

          {!loggedIn ? (
            <>
              <NavLink to="/login" className="btn-small nav-auth-link">
                Login
              </NavLink>
              <NavLink to="/register" className="btn-small primary">
                Register
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to={`/profile/${profile?.id}`} className={({ isActive }) => `profile-link nav-item${isActive ? " active" : ""}`}>
                <User size={16} />
                {profile?.full_name || "Profile"}
              </NavLink>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
