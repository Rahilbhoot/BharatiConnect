import { useState } from "react";
import { BookPlus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions } from "@/lib/store";
import type { BookStatus, Language } from "@/lib/types";

const catalogue = [
  { title: "व्यक्ती आणि वल्ली", author: "पु. ल. देशपांडे", totalPages: 232, language: "mr" as Language },
  { title: "कोसला", author: "भालचंद्र नेमाडे", totalPages: 280, language: "mr" as Language },
  { title: "ययाति", author: "वि. स. खांडेकर", totalPages: 396, language: "mr" as Language },
  { title: "Deep Work", author: "Cal Newport", totalPages: 304, language: "en" as Language },
  { title: "Factfulness", author: "Hans Rosling", totalPages: 342, language: "en" as Language },
  { title: "Man's Search for Meaning", author: "Viktor Frankl", totalPages: 184, language: "en" as Language },
];

export function AddBookDialog({ defaultStatus = "want_to_read" }: { defaultStatus?: BookStatus }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [manual, setManual] = useState({ title: "", author: "", totalPages: "", language: "mr" });

  const results = catalogue.filter((b) =>
    (b.title + b.author).toLowerCase().includes(q.toLowerCase()),
  );

  const add = (book: { title: string; author: string; totalPages: number; language: Language }) => {
    actions.addBook({ ...book, status: defaultStatus });
    setOpen(false);
    setQ("");
    setManual({ title: "", author: "", totalPages: "", language: "mr" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="touch-target w-full gap-2 rounded-2xl">
          <BookPlus className="size-4" /> {t("reading.addBook")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("reading.addBook")}</DialogTitle>
          <DialogDescription>{t("reading.searchBooks")}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">{t("reading.searchBooks")}</TabsTrigger>
            <TabsTrigger value="manual">{t("reading.manualEntry")}</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3">
            <div className="relative">
              <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" />
              <Input
                className="h-12 pl-9"
                placeholder={t("common.search")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {results.map((b) => (
              <button
                key={b.title}
                onClick={() => add(b)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left"
              >
                <span className="size-12 shrink-0 rounded-lg bg-primary/20" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{b.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {b.author} · {b.totalPages} {t("common.pages")}
                  </span>
                </span>
              </button>
            ))}
            {results.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("common.none")}</p>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("reading.title")}</Label>
              <Input
                className="h-12"
                value={manual.title}
                onChange={(e) => setManual({ ...manual, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("reading.author")}</Label>
              <Input
                className="h-12"
                value={manual.author}
                onChange={(e) => setManual({ ...manual, author: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("reading.totalPages")}</Label>
                <Input
                  className="h-12"
                  type="number"
                  value={manual.totalPages}
                  onChange={(e) => setManual({ ...manual, totalPages: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("reading.language")}</Label>
                <Select
                  value={manual.language}
                  onValueChange={(v) => setManual({ ...manual, language: v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mr">मराठी</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="h-12 w-full"
              disabled={!manual.title || !manual.totalPages}
              onClick={() =>
                add({
                  title: manual.title,
                  author: manual.author,
                  totalPages: Number(manual.totalPages),
                  language: manual.language as Language,
                })
              }
            >
              {t("common.add")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
