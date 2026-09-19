import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions } from "@/lib/store";
import type { Book, BookStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BookDetailDialog({
  book,
  onOpenChange,
}: {
  book: Book | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [review, setReview] = useState(book?.review ?? "");

  return (
    <Dialog open={!!book} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        {book && (
          <>
            <DialogHeader>
              <DialogTitle className="text-left">{book.title}</DialogTitle>
            </DialogHeader>
            <div className="flex gap-4">
              <div
                className="h-32 w-22 shrink-0 rounded-xl"
                style={{ backgroundColor: book.coverColor, width: "5.5rem" }}
              />
              <div className="space-y-1 text-sm">
                <p className="font-medium">{book.author}</p>
                <p className="text-muted-foreground">
                  {book.totalPages} {t("common.pages")}
                </p>
                <p className="text-muted-foreground">
                  {book.language === "mr" ? "मराठी" : "English"}
                </p>
                <Progress
                  value={(book.currentPage / book.totalPages) * 100}
                  className="mt-2 w-40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">{t("reading.status")}</p>
              <Select
                value={book.status}
                onValueChange={(v) => {
                  const ok = actions.setBookStatus(book.id, v as BookStatus);
                  if (!ok) toast.error(t("reading.readingLimit"));
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="want_to_read">{t("reading.wantToRead")}</SelectItem>
                  <SelectItem value="reading">{t("reading.readingNow")}</SelectItem>
                  <SelectItem value="finished">{t("reading.finished")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {book.status === "finished" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("reading.rateReview")}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      aria-label={`${n} star`}
                      onClick={() => actions.rateBook(book.id, n, review)}
                      className="touch-target"
                    >
                      <Star
                        className={cn(
                          "size-7",
                          (book.rating ?? 0) >= n
                            ? "fill-streak text-streak"
                            : "text-muted-foreground",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  placeholder={t("reading.reviewPlaceholder")}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
                <Button
                  className="h-12 w-full"
                  onClick={() => {
                    actions.rateBook(book.id, book.rating ?? 5, review);
                    toast.success(t("common.save"));
                  }}
                >
                  {t("common.save")}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
