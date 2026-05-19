import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Heart, Trash2 } from "lucide-react";
import AppDropdown from "../components/AppDropdown";
import api from "../services/api";

const statusOptions = [
  { label: "All", value: "" },
  { label: "To Be Read", tone: "to_be_read", value: "to_be_read" },
  { label: "Reading", tone: "reading", value: "reading" },
  { label: "Completed", tone: "completed", value: "completed" },
  { label: "Paused", tone: "paused", value: "paused" },
  { label: "Dropped", tone: "dropped", value: "dropped" },
];

const getStatusLabel = (value) =>
  statusOptions.find((option) => option.value === value)?.label || value;

function MyLibrary() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const tabsRef = useRef(null);
  const tabsPressTimerRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({
    left: 0,
    visible: false,
    width: 0,
  });

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await api.get("/reading-list", {
        params: {
          status,
          favorite: favoriteOnly ? "true" : undefined,
        },
      });

      setItems(response.data.data || []);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to load library");
    } finally {
      setLoading(false);
    }
  }, [favoriteOnly, status]);

  useEffect(() => {
    window.queueMicrotask(() => {
      fetchLibrary();
    });
  }, [fetchLibrary]);

  const positionTabIndicator = useCallback((element, visible = true) => {
    const tabs = tabsRef.current;

    if (!tabs || !element) return;

    const tabsRect = tabs.getBoundingClientRect();
    const itemRect = element.getBoundingClientRect();

    setTabIndicator({
      left: itemRect.left - tabsRect.left + tabs.scrollLeft,
      visible,
      width: itemRect.width,
    });
  }, []);

  const syncTabIndicator = useCallback(() => {
    const activeTab = favoriteOnly
      ? tabsRef.current?.querySelector(".favorite-tab.active-tab")
      : tabsRef.current?.querySelector(".status-tab.active-tab");

    if (activeTab) {
      positionTabIndicator(activeTab);
    } else {
      setTabIndicator((current) => ({
        ...current,
        visible: false,
      }));
    }
  }, [favoriteOnly, positionTabIndicator]);

  const releaseTabsPress = useCallback(() => {
    window.clearTimeout(tabsPressTimerRef.current);
    tabsPressTimerRef.current = window.setTimeout(() => {
      tabsRef.current?.classList.remove("is-pressing");
    }, 180);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncTabIndicator);
    window.addEventListener("resize", syncTabIndicator);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncTabIndicator);
      window.clearTimeout(tabsPressTimerRef.current);
    };
  }, [status, favoriteOnly, syncTabIndicator]);

  const handleTabPointerDown = (event) => {
    const tabs = tabsRef.current;
    const button = event.target.closest("button");

    if (!tabs || !button || !tabs.contains(button)) return;

    window.clearTimeout(tabsPressTimerRef.current);
    tabs.classList.add("is-pressing");
    positionTabIndicator(button);
  };

  const handleTabPointerOver = (event) => {
    const button = event.target.closest("button");

    if (button && tabsRef.current?.contains(button)) {
      positionTabIndicator(button);
    }
  };

  const handleTabPointerLeave = () => {
    releaseTabsPress();
    syncTabIndicator();
  };

  const updateItem = async (item, updates) => {
    try {
      await api.put(`/reading-list/${item.id}`, updates);
      fetchLibrary();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update library item");
    }
  };

  const removeItem = async (item) => {
    try {
      await api.delete(`/reading-list/${item.id}`);
      fetchLibrary();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove book");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Library</h1>
        <p>Books you saved to read, track, and revisit.</p>
      </div>

      <div
        className="tabs library-tabs"
        onPointerCancel={releaseTabsPress}
        onPointerDown={handleTabPointerDown}
        onPointerLeave={handleTabPointerLeave}
        onPointerOver={handleTabPointerOver}
        onPointerUp={releaseTabsPress}
        ref={tabsRef}
        style={{
          "--tab-indicator-left": `${tabIndicator.left}px`,
          "--tab-indicator-opacity": tabIndicator.visible ? 1 : 0,
          "--tab-indicator-width": `${tabIndicator.width}px`,
        }}
      >
        <span aria-hidden="true" className="library-tab-indicator" />

        {statusOptions.map((option) => (
          <button
            className={`status-tab ${status === option.value ? "active-tab" : ""}`}
            key={option.value}
            onClick={() => setStatus(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}

        <button
          className={`favorite-tab ${favoriteOnly ? "active-tab" : ""}`}
          onClick={() => setFavoriteOnly((value) => !value)}
          type="button"
        >
          Favorites
        </button>
      </div>

      {message && <p className="alert">{message}</p>}

      {loading ? (
        <p>Loading library...</p>
      ) : (
        <div className="list">
          {items.length > 0 ? (
            items.map((item) => (
              <div className="library-card" key={item.id}>
                {item.books?.cover_image_url ? (
                  <img src={item.books.cover_image_url} alt={item.books?.title} />
                ) : (
                  <div className="cover-placeholder">{item.books?.title?.charAt(0)}</div>
                )}

                <div className="library-card-body">
                  <h3>{item.books?.title || "Untitled Book"}</h3>
                  <p className="muted">{item.books?.author || "Unknown Author"}</p>

                  <div className="library-card-meta">
                    <span>Status</span>
                    <span className={`status ${item.status}`}>{getStatusLabel(item.status)}</span>
                  </div>

                  <div className="card-actions">
                    <Link to={`/reader/${item.book_id}`} className="btn-small primary">
                      <BookOpen size={15} />
                      Read
                    </Link>

                    <AppDropdown
                      label="Update Status"
                      value={item.status}
                      options={statusOptions.filter((option) => option.value)}
                      onChange={(value) => updateItem(item, { status: value })}
                    />

                    <button
                      className={`btn-small ${item.is_favorite ? "primary" : ""}`}
                      onClick={() => updateItem(item, { is_favorite: !item.is_favorite })}
                      type="button"
                    >
                      <Heart size={15} />
                      {item.is_favorite ? "Favorite" : "Mark Favorite"}
                    </button>

                    <button className="btn-small" onClick={() => removeItem(item)} type="button">
                      <Trash2 size={15} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No books in your library yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyLibrary;
