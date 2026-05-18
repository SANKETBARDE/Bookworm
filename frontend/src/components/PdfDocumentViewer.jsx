import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value) => value.replace(/\s+/g, " ").trim();

const buildTextLines = (textContent, viewport) => {
  const rows = [];

  textContent.items.forEach((item) => {
    const text = normalizeText(item.str || "");

    if (!text) return;

    const transformed = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const x = transformed[4];
    const baseline = transformed[5];
    const height = Math.max(
      10,
      Math.abs(transformed[3]) || item.height * viewport.scale || 12
    );
    const top = clamp(baseline - height, 0, viewport.height - height);
    const tolerance = Math.max(5, height * 0.45);

    let row = rows.find((candidate) => Math.abs(candidate.baseline - baseline) <= tolerance);

    if (!row) {
      row = {
        baseline,
        top,
        height,
        pieces: [],
      };
      rows.push(row);
    }

    row.top = Math.min(row.top, top);
    row.height = Math.max(row.height, height);
    row.pieces.push({ x, text });
  });

  return rows
    .sort((a, b) => a.top - b.top)
    .map((row, index) => {
      const text = normalizeText(
        row.pieces
          .sort((a, b) => a.x - b.x)
          .map((piece) => piece.text)
          .join(" ")
      );

      return {
        id: `${index + 1}-${Math.round(row.top)}`,
        lineNumber: index + 1,
        text,
        top: clamp(row.top - 4, 0, viewport.height - 12),
        height: Math.max(18, row.height + 8),
      };
    })
    .filter((line) => line.text);
};

function PdfPage({
  pdfDocument,
  pageNumber,
  scale,
  activePage,
  activeLineText,
  onLineSelect,
  onLinesReady,
  registerPageElement,
}) {
  const canvasRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    let renderTask = null;

    const renderPage = async () => {
      try {
        setStatus("loading");
        const page = await pdfDocument.getPage(pageNumber);

        if (cancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setPageSize({
          width: viewport.width,
          height: viewport.height,
        });

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
        });

        await renderTask.promise;

        if (cancelled) return;

        const textContent = await page.getTextContent();
        const nextLines = buildTextLines(textContent, viewport);

        if (cancelled) return;

        setLines(nextLines);
        onLinesReady(pageNumber, nextLines);
        setStatus("ready");
      } catch (error) {
        if (!cancelled && error?.name !== "RenderingCancelledException") {
          console.error(error);
          setStatus("error");
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [onLinesReady, pageNumber, pdfDocument, scale]);

  return (
    <div className="pdf-page-shell">
      <div className="pdf-page-label">Page {pageNumber}</div>
      <div
        className={`pdf-page ${activePage ? "active" : ""}`}
        ref={registerPageElement}
        style={{
          width: pageSize.width || 720,
          minHeight: pageSize.height || 900,
        }}
      >
        <canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} />

        {status === "loading" && <div className="pdf-page-status">Loading page...</div>}
        {status === "error" && <div className="pdf-page-status">Page failed to load</div>}

        <div className="pdf-line-layer" aria-hidden="false">
          {lines.map((line) => {
            const selected =
              activePage && activeLineText && normalizeText(activeLineText) === line.text;

            return (
              <button
                aria-label={`Use page ${pageNumber}, line ${line.lineNumber}`}
                className={`pdf-line-hit ${selected ? "selected" : ""}`}
                key={line.id}
                onClick={() =>
                  onLineSelect({
                    lineCount: lines.length,
                    pageNumber,
                    lineNumber: line.lineNumber,
                    text: line.text,
                  })
                }
                style={{
                  top: line.top,
                  height: line.height,
                }}
                title={line.text}
                type="button"
              >
                <span className="pdf-line-number">{line.lineNumber}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PdfDocumentViewer({
  activeLineText,
  activePage,
  initialPage,
  onDocumentLoad,
  onLineSelect,
  onPositionChange,
  scale,
  title,
  url,
}) {
  const viewerRef = useRef(null);
  const pageRefs = useRef({});
  const lineDataRef = useRef({});
  const animationFrameRef = useRef(null);
  const restoredKeyRef = useRef("");

  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const updateVisiblePosition = useCallback(() => {
    const viewer = viewerRef.current;

    if (!viewer || pageNumbers.length === 0) return;

    const viewerRect = viewer.getBoundingClientRect();
    const focusY = viewerRect.top + viewerRect.height * 0.42;
    let bestPage = null;

    pageNumbers.forEach((pageNumber) => {
      const element = pageRefs.current[pageNumber];

      if (!element) return;

      const rect = element.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, viewerRect.bottom) - Math.max(rect.top, viewerRect.top);

      if (visibleHeight <= 0) return;

      const distance = Math.abs(rect.top + rect.height / 2 - focusY);

      if (!bestPage || visibleHeight > bestPage.visibleHeight || distance < bestPage.distance) {
        bestPage = {
          distance,
          element,
          pageNumber,
          rect,
          visibleHeight,
        };
      }
    });

    if (!bestPage) return;

    const pageY = clamp(focusY - bestPage.rect.top, 0, bestPage.rect.height);
    const pageRatio = bestPage.rect.height ? clamp(pageY / bestPage.rect.height, 0, 1) : 0;
    const progressPercentage = clamp(
      Math.round(((bestPage.pageNumber - 1 + pageRatio) / pageNumbers.length) * 100),
      0,
      100
    );
    const lines = lineDataRef.current[bestPage.pageNumber] || [];
    const currentLine = lines.reduce((closest, line) => {
      const lineCenter = line.top + line.height / 2;
      const distance = Math.abs(lineCenter - pageY);

      if (!closest || distance < closest.distance) {
        return { distance, line };
      }

      return closest;
    }, null)?.line;

    onPositionChange({
      lineText: currentLine?.text || "",
      pageNumber: bestPage.pageNumber,
      progressPercentage,
    });
  }, [onPositionChange, pageNumbers]);

  const schedulePositionUpdate = useCallback(() => {
    if (animationFrameRef.current) return;

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      updateVisiblePosition();
    });
  }, [updateVisiblePosition]);

  const handleLinesReady = useCallback(
    (pageNumber, lines) => {
      lineDataRef.current[pageNumber] = lines;
      schedulePositionUpdate();
    },
    [schedulePositionUpdate]
  );

  useEffect(() => {
    let cancelled = false;
    let loadedDocument = null;
    const loadingTask = pdfjsLib.getDocument({ url });

    lineDataRef.current = {};
    pageRefs.current = {};
    restoredKeyRef.current = "";

    window.queueMicrotask(() => {
      if (cancelled) return;

      setLoading(true);
      setLoadError("");
      setPdfDocument(null);
      setPageNumbers([]);
    });

    loadingTask.promise
      .then((document) => {
        if (cancelled) return;

        loadedDocument = document;
        setPdfDocument(document);
        setPageNumbers(Array.from({ length: document.numPages }, (_, index) => index + 1));
        onDocumentLoad(document.numPages);
        setLoading(false);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setLoadError("PDF failed to load.");
          setLoading(false);
          onDocumentLoad(0);
        }
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      loadedDocument?.destroy?.();
    };
  }, [onDocumentLoad, url]);

  useEffect(() => {
    const pageToRestore = clamp(Number(initialPage) || 1, 1, pageNumbers.length || 1);
    const restoreKey = `${url}:${pageToRestore}`;

    if (!pageNumbers.length || restoredKeyRef.current === restoreKey) return;

    const timer = window.setTimeout(() => {
      pageRefs.current[pageToRestore]?.scrollIntoView({ block: "start" });
      restoredKeyRef.current = restoreKey;
      schedulePositionUpdate();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [initialPage, pageNumbers.length, schedulePositionUpdate, url]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (loadError) {
    return <div className="pdf-empty-state">{loadError}</div>;
  }

  return (
    <div
      aria-label={`${title} PDF reader`}
      className="pdf-document-viewer"
      onScroll={schedulePositionUpdate}
      ref={viewerRef}
    >
      {loading && <div className="pdf-empty-state">Loading PDF...</div>}

      {pdfDocument &&
        pageNumbers.map((pageNumber) => (
          <PdfPage
            activeLineText={activeLineText}
            activePage={activePage === pageNumber}
            key={`${pageNumber}-${scale}`}
            onLineSelect={onLineSelect}
            onLinesReady={handleLinesReady}
            pageNumber={pageNumber}
            pdfDocument={pdfDocument}
            registerPageElement={(element) => {
              if (element) {
                pageRefs.current[pageNumber] = element;
              } else {
                delete pageRefs.current[pageNumber];
              }
            }}
            scale={scale}
          />
        ))}
    </div>
  );
}

export default PdfDocumentViewer;
