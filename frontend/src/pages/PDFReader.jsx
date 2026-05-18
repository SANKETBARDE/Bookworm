import { useCallback, useEffect, useRef, useState } from "react";
import { BookmarkPlus, Save, ZoomIn, ZoomOut } from "lucide-react";
import { useParams } from "react-router-dom";
import PdfDocumentViewer from "../components/PdfDocumentViewer";
import api, { logout } from "../services/api";

const DEFAULT_PROGRESS = {
  last_page: 1,
  last_line_text: "",
  progress_percentage: 0,
};

const progressKey = (progress) =>
  `${progress.last_page}|${progress.progress_percentage}|${progress.last_line_text || ""}`;

function PDFReader() {
  const { id } = useParams();

  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1.15);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [bookmark, setBookmark] = useState({
    page_number: 1,
    line_text: "",
    note: "",
  });

  const autoSaveTimerRef = useRef(null);
  const hasLoadedProgressRef = useRef(false);
  const lastSavedKeyRef = useRef(progressKey(DEFAULT_PROGRESS));

  useEffect(() => {
    document.body.classList.add("reader-active");

    return () => {
      document.body.classList.remove("reader-active");
    };
  }, []);

  const fetchBook = useCallback(async () => {
    try {
      setError("");
      const response = await api.get(`/books/${id}`);
      setBook(response.data.data);
    } catch (error) {
      console.log(error);
      setError(error.response?.data?.message || "Failed to load reader.");
    }
  }, [id]);

  const handleAuthFailure = useCallback(() => {
    window.clearTimeout(autoSaveTimerRef.current);
    setSaveBlocked(true);
    setAutoSaveStatus("Login expired. Sign in again to save progress.");
    logout();
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await api.get(`/reading-progress/${id}`);
      const savedProgress = response.data.data
        ? { ...DEFAULT_PROGRESS, ...response.data.data }
        : DEFAULT_PROGRESS;

      setProgress(savedProgress);
      setBookmark((prev) => ({
        ...prev,
        line_text: prev.line_text || savedProgress.last_line_text || "",
        page_number: savedProgress.last_page || 1,
      }));

      lastSavedKeyRef.current = progressKey(savedProgress);
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) {
        handleAuthFailure();
      }
    } finally {
      hasLoadedProgressRef.current = true;
    }
  }, [handleAuthFailure, id]);

  useEffect(() => {
    hasLoadedProgressRef.current = false;

    window.queueMicrotask(() => {
      setBook(null);
      setSaveBlocked(false);
      setProgress(DEFAULT_PROGRESS);
      setBookmark({
        page_number: 1,
        line_text: "",
        note: "",
      });
      fetchBook();
      fetchProgress();
    });
  }, [fetchBook, fetchProgress]);

  const saveProgress = useCallback(
    async (silent = false, nextProgress = progress, statusText = "Saving...") => {
      if (saveBlocked) {
        setAutoSaveStatus("Login expired. Sign in again to save progress.");
        return;
      }

      try {
        if (silent) {
          setAutoSaveStatus(statusText);
        }

        await api.post("/reading-progress", {
          book_id: id,
          last_page: nextProgress.last_page,
          last_line_text: nextProgress.last_line_text,
          progress_percentage: nextProgress.progress_percentage,
        });

        window.clearTimeout(autoSaveTimerRef.current);
        lastSavedKeyRef.current = progressKey(nextProgress);
        setAutoSaveStatus("Saved");

        if (!silent) {
          alert("Progress saved");
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleAuthFailure();
          return;
        }

        if (silent) {
          setAutoSaveStatus("Autosave failed");
        } else {
          alert(error.response?.data?.message || "Failed to save progress");
        }
      }
    },
    [handleAuthFailure, id, progress, saveBlocked]
  );

  useEffect(() => {
    if (!book || saveBlocked || !hasLoadedProgressRef.current) return;

    const key = progressKey(progress);

    if (key === lastSavedKeyRef.current) return;

    setAutoSaveStatus("Autosave pending");
    window.clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = window.setTimeout(() => {
      saveProgress(true, progress);
    }, 1800);

    return () => window.clearTimeout(autoSaveTimerRef.current);
  }, [book, progress, saveBlocked, saveProgress]);

  const handleReaderPositionChange = useCallback(({ pageNumber, progressPercentage }) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        last_page: pageNumber,
        progress_percentage: progressPercentage,
      };

      return progressKey(prev) === progressKey(next) ? prev : next;
    });

    setBookmark((prev) => ({
      ...prev,
      page_number: pageNumber,
    }));
  }, []);

  const handleLineSelect = useCallback(
    ({ lineCount, lineNumber, pageNumber, text }) => {
      const lineRatio = lineCount > 1 ? (lineNumber - 1) / (lineCount - 1) : 0;
      const progressPercentage = pageCount
        ? Math.min(
            100,
            Math.max(0, Math.round(((pageNumber - 1 + lineRatio) / pageCount) * 100))
          )
        : progress.progress_percentage;
      const nextProgress = {
        ...progress,
        last_line_text: text,
        last_page: pageNumber,
        progress_percentage: progressPercentage,
      };

      window.clearTimeout(autoSaveTimerRef.current);
      setProgress(nextProgress);

      setBookmark((prev) => ({
        ...prev,
        line_text: text,
        page_number: pageNumber,
      }));

      saveProgress(true, nextProgress, "Saving selected line...");
    },
    [pageCount, progress, saveProgress]
  );

  const addBookmark = async () => {
    try {
      await api.post("/bookmarks", {
        book_id: id,
        page_number: bookmark.page_number,
        line_text: bookmark.line_text,
        note: bookmark.note,
      });

      setBookmark({
        page_number: progress.last_page || 1,
        line_text: progress.last_line_text || "",
        note: "",
      });

      alert("Bookmark saved");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save bookmark");
    }
  };

  const useCurrentLineForBookmark = () => {
    setBookmark((prev) => ({
      ...prev,
      line_text: progress.last_line_text || prev.line_text,
      page_number: progress.last_page || prev.page_number,
    }));
  };

  if (error && !book) {
    return (
      <div className="page">
        <p className="alert">{error}</p>
      </div>
    );
  }

  if (!book) {
    return <div className="page">Loading reader...</div>;
  }

  if (!book.pdf_url) {
    return (
      <div className="page">
        <p className="alert">This book does not have a PDF file attached.</p>
      </div>
    );
  }

  return (
    <div className="reader-page">
      <aside className="reader-sidebar">
        <h2>{book.title}</h2>
        <p className="muted">{book.author}</p>

        <div className="reader-box">
          <div className="reader-progress-topline">
            <strong>
              Page {progress.last_page}
              {pageCount ? ` of ${pageCount}` : ""}
            </strong>
            <span>{progress.progress_percentage}%</span>
          </div>

          <div className="reader-progress-track">
            <span style={{ width: `${progress.progress_percentage}%` }} />
          </div>

          <label>Saved Line</label>
          <textarea readOnly value={progress.last_line_text || ""} />

          <div className="reader-compact-fields">
            <label>
              Last Page
              <input
                max={pageCount || undefined}
                min="1"
                onChange={(e) =>
                  setProgress({
                    ...progress,
                    last_page: Number(e.target.value),
                  })
                }
                type="number"
                value={progress.last_page}
              />
            </label>

            <label>
              Progress
              <input
                max="100"
                min="0"
                onChange={(e) =>
                  setProgress({
                    ...progress,
                    progress_percentage: Number(e.target.value),
                  })
                }
                type="number"
                value={progress.progress_percentage}
              />
            </label>
          </div>

          <div className="reader-actions">
            <button className="icon-btn" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))} title="Zoom out" type="button">
              <ZoomOut size={17} />
            </button>
            <button className="icon-btn" onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))} title="Zoom in" type="button">
              <ZoomIn size={17} />
            </button>
            <button className="btn primary" onClick={() => saveProgress(false)} type="button">
              <Save size={16} />
              Save
            </button>
          </div>

          {autoSaveStatus && <p className="reader-status">{autoSaveStatus}</p>}
        </div>

        <div className="reader-box">
          <h3>Add Bookmark</h3>

          <button className="btn" onClick={useCurrentLineForBookmark} type="button">
            <BookmarkPlus size={16} />
            Use Current Line
          </button>

          <label>Page Number</label>
          <input
            min="1"
            onChange={(e) =>
              setBookmark({
                ...bookmark,
                page_number: Number(e.target.value),
              })
            }
            type="number"
            value={bookmark.page_number}
          />

          <label>Line / Selected Text</label>
          <textarea
            onChange={(e) =>
              setBookmark({
                ...bookmark,
                line_text: e.target.value,
              })
            }
            value={bookmark.line_text}
          />

          <label>Note</label>
          <textarea
            onChange={(e) =>
              setBookmark({
                ...bookmark,
                note: e.target.value,
              })
            }
            value={bookmark.note}
          />

          <button className="btn" onClick={addBookmark} type="button">
            Save Bookmark
          </button>
        </div>
      </aside>

      <section className="pdf-viewer">
        <PdfDocumentViewer
          activeLineText={progress.last_line_text}
          activePage={progress.last_page}
          initialPage={progress.last_page}
          onDocumentLoad={setPageCount}
          onLineSelect={handleLineSelect}
          onPositionChange={handleReaderPositionChange}
          scale={zoom}
          title={book.title}
          url={book.pdf_url}
        />
      </section>
    </div>
  );
}

export default PDFReader;
