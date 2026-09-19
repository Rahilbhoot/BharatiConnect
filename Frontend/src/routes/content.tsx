import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, Pin, Play, Sparkles } from "lucide-react";
import { StaffShell } from "@/components/staff/StaffShell";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
import { actions, useAppState } from "@/lib/store";
import type { VideoCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Notices & Learning — BharatiConnect" },
      {
        name: "description",
        content: "Office notices, field updates, learning videos and book suggestions.",
      },
      { property: "og:title", content: "Notices & Learning — BharatiConnect" },
      {
        property: "og:description",
        content: "Stay up to date with Akshar Bharati notices, updates and learning videos.",
      },
    ],
  }),
  component: Content,
});

const categories: VideoCategory[] = [
  "writing",
  "spreadsheets",
  "translation",
  "donor_reports",
  "social_media",
];

function Content() {
  const { t, i18n } = useTranslation();
  const mr = i18n.language === "mr";
  const { notices, posts, videos, books, suggestions } = useAppState();
  const [cat, setCat] = useState<string>("all");
  const [lang, setLang] = useState<string>("all");
  const [player, setPlayer] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string | null>(null);
  const [sugg, setSugg] = useState({ title: "", author: "" });

  const sortedNotices = [...notices].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt),
  );
  const filteredVideos = videos.filter(
    (v) => (cat === "all" || v.category === cat) && (lang === "all" || v.language === lang),
  );
  const tip = videos.find((v) => v.pinnedTip);

  return (
    <StaffShell>
      <Tabs defaultValue="notices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notices">{t("content.notices")}</TabsTrigger>
          <TabsTrigger value="posts">{t("content.posts")}</TabsTrigger>
          <TabsTrigger value="videos">{t("content.videos")}</TabsTrigger>
          <TabsTrigger value="books">{t("content.suggestions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="space-y-3">
          {sortedNotices.map((n) => (
            <button
              key={n.id}
              onClick={() => actions.markNoticeRead(n.id)}
              className={cn(
                "glass block w-full rounded-2xl p-4 text-left",
                n.priority === "urgent" && "border-destructive/60 bg-destructive/8",
                !n.read && "ring-2 ring-primary/30",
              )}
            >
              <div className="flex items-center gap-2">
                {n.priority === "urgent" && (
                  <span className="flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    <AlertTriangle className="size-3" /> {t("content.urgent")}
                  </span>
                )}
                {n.pinned && (
                  <span className="flex items-center gap-1 rounded-full bg-streak/25 px-2 py-0.5 text-[10px] font-semibold text-streak-foreground">
                    <Pin className="size-3" /> {t("content.pinned")}
                  </span>
                )}
                {!n.read && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                    {t("content.unread")}
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground">{n.publishedAt}</span>
              </div>
              <p className="mt-2 font-medium">{mr ? n.titleMr : n.titleEn}</p>
              <p className="mt-1 text-sm text-muted-foreground">{mr ? n.bodyMr : n.bodyEn}</p>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="glass overflow-hidden rounded-3xl">
              <div className="p-4">
                <p className="text-sm font-semibold">{p.authorName}</p>
                <p className="text-[11px] text-muted-foreground">{p.publishedAt}</p>
                <p className="mt-2 text-sm">{mr ? p.bodyMr : p.bodyEn}</p>
              </div>
              <Carousel className="px-4 pb-4">
                <CarouselContent>
                  {p.images.slice(0, 5).map((src) => (
                    <CarouselItem key={src} className="basis-4/5">
                      <button onClick={() => setGallery(src)} className="w-full">
                        <img src={src} alt="" className="h-40 w-full rounded-2xl object-cover" />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          ))}
          <Dialog open={!!gallery} onOpenChange={(o) => !o && setGallery(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{t("content.posts")}</DialogTitle>
              </DialogHeader>
              {gallery && <img src={gallery} alt="" className="w-full rounded-xl" />}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="videos" className="space-y-3">
          {tip && (
            <div className="glass flex items-center gap-3 rounded-2xl border-primary/40 p-4">
              <Sparkles className="size-5 text-primary" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-primary">{t("content.aiTip")}</p>
                <p className="truncate text-sm">{mr ? tip.titleMr : tip.titleEn}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-11 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="h-11 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="mr">मराठी</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredVideos.map((v) => (
              <div key={v.id} className="glass overflow-hidden rounded-2xl">
                <button onClick={() => setPlayer(v.youtubeId)} className="relative block w-full">
                  <img
                    src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`}
                    alt=""
                    className="h-24 w-full object-cover"
                  />
                  <Play className="absolute inset-0 m-auto size-8 text-white drop-shadow" />
                </button>
                <div className="space-y-2 p-3">
                  <p className="line-clamp-2 text-xs font-medium">{mr ? v.titleMr : v.titleEn}</p>
                  <Button
                    size="sm"
                    variant={v.watched ? "secondary" : "outline"}
                    className="w-full text-[11px]"
                    onClick={() => actions.markWatched(v.id)}
                  >
                    {v.watched ? (
                      <>
                        <Check className="size-3" /> {t("content.watched")}
                      </>
                    ) : (
                      t("content.markWatched")
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Dialog open={!!player} onOpenChange={(o) => !o && setPlayer(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("content.videos")}</DialogTitle>
              </DialogHeader>
              {player && (
                <iframe
                  className="aspect-video w-full rounded-xl"
                  src={`https://www.youtube.com/embed/${player}`}
                  title="video"
                  allowFullScreen
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="books" className="space-y-5">
          {(
            [
              ["content.staffPicks", books.filter((b) => b.staffPick)],
              ["content.forYou", books.filter((b) => b.status === "want_to_read")],
              ["content.shortReads", books.filter((b) => b.totalPages < 150)],
            ] as const
          ).map(([label, list]) => (
            <div key={label} className="space-y-2">
              <p className="text-sm font-semibold">{t(label)}</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {list.map((b) => (
                  <div key={b.id} className="w-28 shrink-0">
                    <span
                      className="block h-36 w-full rounded-xl"
                      style={{ backgroundColor: b.coverColor }}
                    />
                    <p className="mt-1 truncate text-xs font-medium">{b.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{b.author}</p>
                  </div>
                ))}
                {list.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("common.none")}</p>
                )}
              </div>
            </div>
          ))}

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-12 w-full">{t("content.suggestBook")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("content.suggestBook")}</DialogTitle>
                <DialogDescription>{t("content.suggestions")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{t("reading.title")}</Label>
                  <Input
                    className="h-12"
                    value={sugg.title}
                    onChange={(e) => setSugg({ ...sugg, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("reading.author")}</Label>
                  <Input
                    className="h-12"
                    value={sugg.author}
                    onChange={(e) => setSugg({ ...sugg, author: e.target.value })}
                  />
                </div>
                <Button
                  className="h-12 w-full"
                  disabled={!sugg.title}
                  onClick={() => {
                    actions.addSuggestion(sugg.title, sugg.author);
                    setSugg({ title: "", author: "" });
                  }}
                >
                  {t("common.submit")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.author} · {s.byName}
                  </p>
                </div>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </StaffShell>
  );
}
