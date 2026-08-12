import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { errorMessage } from "@/api/client";
import { uploadCoverImage } from "@/api/upload.api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CoverUploadProps {
  value: string | null;
  onChange: (key: string | null) => void;
  previewUrl?: string | null;
}

export function CoverUpload({ value, onChange, previewUrl }: CoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة صالح");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("حجم الصورة أكبر من 5 ميجابايت");
      return;
    }

    setError(null);
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    setProgress(0);

    try {
      const key = await uploadCoverImage(file, setProgress);
      onChange(key || null);
    } catch (uploadError) {
      setError(errorMessage(uploadError));
      setLocalPreview(null);
      onChange(null);
    } finally {
      setUploading(false);
    }
  }

  const preview = localPreview ?? previewUrl ?? null;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary/60"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt="معاينة غلاف الكتاب"
            className="h-40 w-28 rounded-md object-cover shadow-book"
          />
        ) : (
          <>
            <ImagePlus className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">اسحب صورة الغلاف هنا أو اضغط للاختيار</p>
            <p className="text-xs text-muted-foreground">JPG أو PNG حتى 5 ميجابايت</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} />
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            جاري رفع الصورة… {progress}%
          </p>
        </div>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {value && !uploading && (
        <div className="flex items-center justify-between gap-2 rounded-md bg-secondary px-3 py-2 text-xs">
          <span className="truncate">تم الرفع: {value}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange(null);
              setLocalPreview(null);
              setProgress(0);
            }}
            aria-label="إزالة الصورة"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}