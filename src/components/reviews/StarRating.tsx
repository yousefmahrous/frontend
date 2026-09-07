import { Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
};

export function StarRating({ value, onChange, readOnly = false, size = "md" }: StarRatingProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;

  return (
    <div
      className={cn("flex items-center gap-0.5", !readOnly && "cursor-pointer")}
      onMouseLeave={() => setHovered(null)}
      role={readOnly ? undefined : "radiogroup"}
      aria-label={readOnly ? undefined : t("starRating.ariaLabel")}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onClick={() => !readOnly && onChange?.(star)}
          aria-label={t("starRating.starAriaLabel", { count: star })}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-110 disabled:cursor-default",
            readOnly && "cursor-default",
          )}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}