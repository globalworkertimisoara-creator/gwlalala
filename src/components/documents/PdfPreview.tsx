import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from 'lucide-react';
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

interface PdfPreviewProps {
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
}

const PDF_SCALE = 1.3;

export function PdfPreview({ fileUrl, fileName, onDownload }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadingTask = getDocument(fileUrl);

    setIsLoadingDoc(true);
    setError(null);

    (async () => {
      try {
        const loadedDoc = await loadingTask.promise;
        if (cancelled) {
          await loadedDoc.destroy();
          return;
        }

        setPdfDoc((previousDoc) => {
          if (previousDoc) void previousDoc.destroy();
          return loadedDoc;
        });
        setPageNumber(1);
      } catch (err) {
        console.error('PDF load error:', err);
        if (!cancelled) {
          setPdfDoc(null);
          setError('This PDF cannot be rendered inline in your browser.');
        }
      } finally {
        if (!cancelled) setIsLoadingDoc(false);
      }
    })();

    return () => {
      cancelled = true;
      void loadingTask.destroy();
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;
    setIsRenderingPage(true);
    setError(null);

    (async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: PDF_SCALE });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!canvas || !context) {
          throw new Error('Canvas unavailable');
        }

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: pixelRatio > 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
        });

        await renderTask.promise;
      } catch (err) {
        console.error('PDF render error:', err);
        if (!cancelled) {
          setError('This PDF cannot be rendered inline in your browser.');
        }
      } finally {
        if (!cancelled) setIsRenderingPage(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    return () => {
      if (pdfDoc) void pdfDoc.destroy();
    };
  }, [pdfDoc]);

  const totalPages = pdfDoc?.numPages ?? 0;
  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;
  const isBusy = isLoadingDoc || isRenderingPage;

  const fileLabel = useMemo(() => {
    return fileName.length > 40 ? `${fileName.slice(0, 37)}...` : fileName;
  }, [fileName]);

  const handleOpenInNewTab = useCallback(() => {
    const popup = window.open(fileUrl, '_blank');
    if (popup) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-muted/20">
      <div className="flex items-center justify-between border-b bg-background/90 px-3 py-2">
        <div className="min-w-0 text-xs text-muted-foreground">
          <span className="truncate">{fileLabel}</span>
          {totalPages > 0 && <span className="ml-2">• Page {pageNumber} / {totalPages}</span>}
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoPrev || isBusy}
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            title="Previous page"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoNext || isBusy}
            onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
            title="Next page"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4" /> Open
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onDownload}>
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto">
        {error ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={onDownload}>
                <Download className="h-4 w-4" /> Download file
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-4">
            <canvas ref={canvasRef} className="h-auto max-w-full rounded bg-background shadow-sm" />
          </div>
        )}

        {!error && isBusy && (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-2 bg-background/70 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Rendering PDF preview…</p>
          </div>
        )}
      </div>
    </div>
  );
}
