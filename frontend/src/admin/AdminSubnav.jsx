import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BookCheck, BookOpenCheck, ClipboardList, LayoutDashboard, UsersRound } from "lucide-react";

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/pending-books", label: "Pending Books", icon: BookCheck },
  { to: "/admin/books", label: "Manage Books", icon: BookOpenCheck },
  { to: "/admin/users", label: "Users", icon: UsersRound },
  { to: "/admin/requests", label: "Book Requests", icon: ClipboardList },
];

function AdminSubnav() {
  const location = useLocation();
  const navRef = useRef(null);
  const navPressTimerRef = useRef(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    visible: false,
    width: 0,
  });

  const positionIndicator = useCallback((element, visible = true) => {
    const nav = navRef.current;

    if (!nav || !element) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();

    setIndicator({
      left: itemRect.left - navRect.left + nav.scrollLeft,
      visible,
      width: itemRect.width,
    });
  }, []);

  const syncActiveIndicator = useCallback(() => {
    const activeItem = navRef.current?.querySelector(".admin-subnav-item.active");

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
      navRef.current?.classList.remove("is-pressing");
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
  }, [location.pathname, syncActiveIndicator]);

  const handlePointerDown = (event) => {
    const nav = navRef.current;
    const item = event.target.closest(".admin-subnav-item");

    if (!nav || !item || !nav.contains(item)) return;

    window.clearTimeout(navPressTimerRef.current);
    nav.classList.add("is-pressing");
    positionIndicator(item);
  };

  const handlePointerOver = (event) => {
    const item = event.target.closest(".admin-subnav-item");

    if (item && navRef.current?.contains(item)) {
      positionIndicator(item);
    }
  };

  const handlePointerLeave = () => {
    releaseNavPress();
    syncActiveIndicator();
  };

  return (
    <nav
      className="admin-subnav"
      onPointerCancel={releaseNavPress}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerOver={handlePointerOver}
      onPointerUp={releaseNavPress}
      ref={navRef}
      style={{
        "--admin-subnav-indicator-left": `${indicator.left}px`,
        "--admin-subnav-indicator-opacity": indicator.visible ? 1 : 0,
        "--admin-subnav-indicator-width": `${indicator.width}px`,
      }}
    >
      <span aria-hidden="true" className="admin-subnav-indicator" />

      {adminLinks.map(({ end, icon: Icon, label, to }) => (
        <NavLink
          className={({ isActive }) => `admin-subnav-item${isActive ? " active" : ""}`}
          end={end}
          key={to}
          to={to}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AdminSubnav;
