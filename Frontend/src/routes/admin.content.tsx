import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pin } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actions, useAppState } from "@/lib/store";
import type { Language, VideoCategory } from "@/lib/types";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Content Management — BharatiConnect Admin" },
      { name: "description", content: "Publish notices, updates, videos and approve book suggestions." },
      { property: "og:title", content: "Content Management — BharatiConnect Admin" },
      { property: "og:description", content: "Dual-language content publishing for Akshar Bharati." },
    ],
  }),
  component: AdminContent,
});

function AdminContent() {
  const { t } = useTranslation();
  const { notices, posts, videos, suggestions } = useAppState();
  const [notice, setNotice] = useState({
    titleEn: "",
    titleMr: "",
    bodyEn: "",
    bodyMr: "",
    urgent: false,
    pinned: false,
  });
  const [post, setPost] = useState({ bodyEn: "", bodyMr: "", images: "" });
  const [video, setVideo] = useState({
    titleEn: "",
    titleMr: "",
    youtubeId: "",
    category: "writing" as VideoCategory,
    language: "mr" as Language,
  });

  return (
    <AdminShell title={t("admin.content")}>
      <Tabs defaultValue="notices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notices">{t("content.notices")}</TabsTrigger>
          <TabsTrigger value="posts">{t("content.posts")}</TabsTrigger>
          <TabsTrigger value="videos">{t("content.videos")}</TabsTrigger>
          <TabsTrigger value="books">{t("content.suggestions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="grid gap-4 lg:grid-cols-2">
          <div className="glass space-y-3 rounded-3xl p-5">
            {(
              [
                ["titleEn", t("admin.nameEn")],
                ["titleMr", t("admin.nameMr")],
              ] as const
            ).map(([f, label]) => (
              <div key={f} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  className="h-11"
                  lang={f.endsWith("Mr") ? "mr" : "en"}
                  value={notice[f]}
                  onChange={(e) => setNotice({ ...notice, [f]: e.target.value })}
                />
              </div>
            ))}
            {(["bodyEn", "bodyMr"] as const).map((f) => (
              <div key={f} className="space-y-1.5">
                <Label>{f === "bodyEn" ? "Body (English)" : "Body (Marathi)"}</Label>
                <Textarea
                  rows={3}
                  lang={f === "bodyMr" ? "mr" : "en"}
                  value={notice[f]}
                  onChange={(e) => setNotice({ ...notice, [f]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={notice.urgent}
                  onCheckedChange={(c) => setNotice({ ...notice, urgent: c })}
                />
                {t("content.urgent")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={notice.pinned}
                  onCheckedChange={(c) => setNotice({ ...notice, pinned: c })}
                />
                {t("content.pinned")}
              </label>
            </div>
            <Button
              className="h-11 w-full"
              disabled={!notice.titleEn || !notice.titleMr}
              onClick={() => {
                actions.addNotice({
                  titleEn: notice.titleEn,
                  titleMr: notice.titleMr,
                  bodyEn: notice.bodyEn,
                  bodyMr: notice.bodyMr,
                  priority: notice.urgent ? "urgent" : "normal",
                  pinned: notice.pinned,
                });
                setNotice({
                  titleEn: "",
                  titleMr: "",
                  bodyEn: "",
                  bodyMr: "",
                  urgent: false,
                  pinned: false,
                });
              }}
            >
              {t("common.submit")}
            </Button>
          </div>
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="glass rounded-2xl p-4">
                <p className="text-sm font-medium">{n.titleEn}</p>
                <p lang="mr" className="text-sm text-muted-foreground">
                  {n.titleMr}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {n.publishedAt} · {n.priority}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="posts" className="grid gap-4 lg:grid-cols-2">
          <div className="glass space-y-3 rounded-3xl p-5">
            <div className="space-y-1.5">
              <Label>Body (English)</Label>
              <Textarea
                rows={3}
                value={post.bodyEn}
                onChange={(e) => setPost({ ...post, bodyEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Body (Marathi)</Label>
              <Textarea
                rows={3}
                lang="mr"
                value={post.bodyMr}
                onChange={(e) => setPost({ ...post, bodyMr: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Images (up to 5)</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                className="h-11"
                onChange={(e) =>
                  setPost({
                    ...post,
                    images: Array.from(e.target.files ?? [])
                      .slice(0, 5)
                      .map((f) => f.name)
                      .join(", "),
                  })
                }
              />
              {post.images && <p className="text-xs text-muted-foreground">{post.images}</p>}
            </div>
            <Button
              className="h-11 w-full"
              disabled={!post.bodyEn}
              onClick={() => {
                const count = post.images ? post.images.split(",").length : 3;
                actions.addPost({
                  bodyEn: post.bodyEn,
                  bodyMr: post.bodyMr,
                  images: Array.from({ length: count }).map(
                    (_, i) => `https://picsum.photos/seed/new${Date.now()}${i}/800/600`,
                  ),
                });
                setPost({ bodyEn: "", bodyMr: "", images: "" });
              }}
            >
              {t("common.submit")}
            </Button>
          </div>
          <div className="space-y-2">
            {posts.map((p) => (
              <div key={p.id} className="glass rounded-2xl p-4">
                <p className="text-sm font-medium">{p.authorName}</p>
                <p className="text-sm text-muted-foreground">{p.bodyEn}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.publishedAt} · {p.images.length} images
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="grid gap-4 lg:grid-cols-2">
          <div className="glass space-y-3 rounded-3xl p-5">
            <div className="space-y-1.5">
              <Label>{t("admin.nameEn")}</Label>
              <Input
                className="h-11"
                value={video.titleEn}
                onChange={(e) => setVideo({ ...video, titleEn: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("admin.nameMr")}</Label>
              <Input
                className="h-11"
                lang="mr"
                value={video.titleMr}
                onChange={(e) => setVideo({ ...video, titleMr: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>YouTube ID</Label>
              <Input
                className="h-11"
                value={video.youtubeId}
                onChange={(e) => setVideo({ ...video, youtubeId: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                value={video.category}
                onValueChange={(v) => setVideo({ ...video, category: v as VideoCategory })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["writing", "spreadsheets", "translation", "donor_reports", "social_media"].map(
                    (c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select
                value={video.language}
                onValueChange={(v) => setVideo({ ...video, language: v as Language })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mr">मराठी</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="h-11 w-full"
              disabled={!video.titleEn || !video.youtubeId}
              onClick={() => {
                actions.addVideo(video);
                setVideo({ ...video, titleEn: "", titleMr: "", youtubeId: "" });
              }}
            >
              {t("common.submit")}
            </Button>
          </div>
          <div className="space-y-2">
            {videos.map((v) => (
              <div key={v.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                <img
                  src={`https://img.youtube.com/vi/${v.youtubeId}/default.jpg`}
                  alt=""
                  className="h-12 w-20 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{v.titleEn}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {v.category} · {v.language}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={v.pinnedTip ? "default" : "outline"}
                  className="gap-1 text-[11px]"
                  onClick={() => actions.pinTip(v.id)}
                >
                  <Pin className="size-3" /> {t("content.aiTip")}
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="books" className="space-y-2">
          {suggestions.map((s) => (
            <div key={s.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">
                  {s.author} · {s.byName} · {s.status}
                </p>
              </div>
              <Button size="sm" onClick={() => actions.setSuggestionStatus(s.id, "approved")}>
                {t("common.approve")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => actions.setSuggestionStatus(s.id, "rejected")}
              >
                {t("common.reject")}
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
