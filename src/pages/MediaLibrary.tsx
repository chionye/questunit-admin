/** @format */

import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { uploadsApi } from '@/api/endpoints';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Download, ExternalLink } from 'lucide-react';

interface MediaFile {
  name: string;
  category: string;
  size: number;
  createdAt: string;
  url: string;
}

function GallerySkeletonLoader() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const categoryColors: Record<string, string> = {
  profiles: 'bg-blue-100 text-blue-700',
  documents: 'bg-green-100 text-green-700',
  icons: 'bg-purple-100 text-purple-700',
  tools: 'bg-orange-100 text-orange-700',
};

const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);

const isPdf = (name: string) => /\.pdf$/i.test(name);

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setZoom((prev) => Math.max(1, Math.min(10, prev + delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position.x, position.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      reset();
    } else {
      setZoom(2.5);
    }
  }, [zoom, reset]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-gray-50 rounded-lg"
      style={{ height: '60vh' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
            maxWidth: zoom > 1 ? 'none' : '100%',
            maxHeight: zoom > 1 ? 'none' : '100%',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
          className="object-contain select-none"
          onDoubleClick={handleDoubleClick}
        />
      </div>
      {zoom > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}

export function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['uploads'],
    queryFn: () => uploadsApi.getAll(),
  });

  const allFiles: MediaFile[] = Array.isArray((response as any)?.data?.data) ? (response as any).data.data : [];
  const files = allFiles.filter((f) => {
    const matchesSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(allFiles.map((f) => f.category))];

  return (
    <div>
      <Header title="Media Library" subtitle="Browse all uploaded files" />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={categoryFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('')}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <GallerySkeletonLoader />
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">Failed to load uploads</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No files found</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-3 px-1">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 px-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  {isImage(file.name) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-xs text-gray-400 text-center px-2 break-all">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-[10px] px-1 py-0 ${categoryColors[file.category] || 'bg-gray-100 text-gray-700'}`}>
                        {file.category}
                      </Badge>
                      <span className="text-white/70 text-[10px]">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => { if (!open) setPreviewFile(null); }}>
        <DialogContent className={isPdf(previewFile?.name || '') ? 'sm:max-w-[900px]' : 'sm:max-w-[700px]'}>
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {isImage(previewFile.name) ? (
                  <ZoomableImage src={previewFile.url} alt={previewFile.name} />
                ) : isPdf(previewFile.name) ? (
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="w-full rounded-lg"
                    style={{ height: '60vh' }}
                  />
                ) : (
                  <div className="w-full h-48 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-500">
                        {previewFile.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Preview not available</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category</span>
                  <Badge className={`ml-2 ${categoryColors[previewFile.category] || ''}`}>
                    {previewFile.category}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Size</span>
                  <p className="mt-0.5">{formatFileSize(previewFile.size)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="mt-0.5">{new Date(previewFile.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Path</span>
                  <p className="mt-0.5 font-mono text-xs break-all">{previewFile.url}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(previewFile.url, '_blank')}
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = previewFile.url;
                    a.download = previewFile.name;
                    a.click();
                  }}
                >
                  <Download size={16} className="mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
