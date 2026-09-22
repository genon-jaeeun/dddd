import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { toast, Toaster } from "sonner"
import { Archive, ChevronLeft, ChevronRight, FileText, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

type Note = {
  id: string
  content: string
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = "memo-notes-v1"
const PAGE_SIZE = 20

function readNotes(): Note[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp)
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [deletingNote, setDeletingNote] = useState<Note | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<"save" | "edit" | "delete" | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotes(readNotes())
      setIsLoading(false)
    }, 220)
    return () => window.clearTimeout(timer)
  }, [])

  const totalPages = Math.max(1, Math.ceil(notes.length / PAGE_SIZE))
  const visibleNotes = useMemo(
    () => notes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [notes, page],
  )

  function persist(nextNotes: Note[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes))
    setNotes(nextNotes)
  }

  async function saveNote() {
    const content = draft.trim()
    if (!content) {
      toast.error("메모 내용을 입력해 주세요.")
      return
    }
    const previous = notes
    setBusy("save")
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260))
      const now = Date.now()
      persist([{ id: crypto.randomUUID(), content, createdAt: now, updatedAt: now }, ...notes])
      setDraft("")
      setPage(1)
      toast.success("메모가 저장되었습니다.")
    } catch {
      setNotes(previous)
      toast.error("메모를 저장하지 못했습니다.")
    } finally {
      setBusy(null)
    }
  }

  function beginEdit(note: Note) {
    setEditingId(note.id)
    setEditingText(note.content)
  }

  async function updateNote() {
    if (!editingId || !editingText.trim()) {
      toast.error("메모 내용을 입력해 주세요.")
      return
    }
    const previous = notes
    setBusy("edit")
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260))
      persist(notes.map((note) => note.id === editingId ? { ...note, content: editingText.trim(), updatedAt: Date.now() } : note))
      setEditingId(null)
      setEditingText("")
      toast.success("메모가 수정되었습니다.")
    } catch {
      setNotes(previous)
      toast.error("메모를 수정하지 못했습니다.")
    } finally {
      setBusy(null)
    }
  }

  async function deleteNote() {
    if (!deletingNote) return
    const previous = notes
    setBusy("delete")
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 260))
      const next = notes.filter((note) => note.id !== deletingNote.id)
      persist(next)
      if (page > Math.max(1, Math.ceil(next.length / PAGE_SIZE))) setPage(page - 1)
      setDeletingNote(null)
      toast.success("메모가 삭제되었습니다.")
    } catch {
      setNotes(previous)
      toast.error("메모를 삭제하지 못했습니다.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">메모장</h1>
              <p className="text-xs text-muted-foreground">생각을 가볍게 기록하세요</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden gap-1.5 sm:flex">
            <Archive className="size-3.5" /> {notes.length}개의 메모
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="mb-2 text-sm font-semibold text-primary">MY NOTES</p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">오늘의 생각을 남겨보세요.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">중요한 아이디어와 할 일을 한 곳에 기록하고, 필요할 때 언제든 다시 꺼내보세요.</p>
        </motion.div>

        <Card className="mb-8 border-primary/20 shadow-md">
          <CardHeader className="pb-3"><CardTitle className="text-lg">새 메모 작성</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="무슨 생각을 하고 있나요?" className="min-h-32 resize-y bg-background leading-relaxed" disabled={busy !== null} />
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{draft.length}자</span>
              <Button onClick={saveNote} disabled={busy !== null || !draft.trim()} className="gap-2">
                {busy === "save" ? <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" /> : <Plus className="size-4" />}
                {busy === "save" ? "저장 중..." : "메모 저장"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">저장된 메모</h3>
            <p className="mt-1 text-sm text-muted-foreground">총 {notes.length}개 · 최신순으로 표시됩니다</p>
          </div>
          {notes.length > 0 && <span className="text-sm text-muted-foreground">{page} / {totalPages} 페이지</span>}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div>
        ) : visibleNotes.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"><FileText className="size-7" /></div>
            <h3 className="font-semibold text-foreground">작성된 메모가 없습니다</h3>
            <p className="mt-1 text-sm text-muted-foreground">위 입력창에서 첫 번째 메모를 작성해 보세요.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleNotes.map((note, index) => (
              <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
                <Card className="h-full border-border/70 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
                  {editingId === note.id ? (
                    <CardContent className="flex h-full flex-col p-5">
                      <Textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} className="min-h-32 flex-1 resize-y bg-background leading-relaxed" autoFocus disabled={busy !== null} />
                      <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} disabled={busy !== null} className="gap-1.5"><X className="size-4" /> 취소</Button>
                        <Button size="sm" onClick={updateNote} disabled={busy !== null || !editingText.trim()} className="gap-1.5"><Save className="size-4" /> {busy === "edit" ? "저장 중..." : "변경 저장"}</Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="flex h-full flex-col p-5">
                      <p className="min-h-24 flex-1 whitespace-pre-wrap break-words text-sm leading-7 text-card-foreground">{note.content}</p>
                      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                        <time className="text-xs text-muted-foreground" dateTime={new Date(note.updatedAt).toISOString()}>{formatDate(note.updatedAt)}</time>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => beginEdit(note)} aria-label="메모 수정" disabled={busy !== null} className="size-8 text-muted-foreground hover:text-primary"><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingNote(note)} aria-label="메모 삭제" disabled={busy !== null} className="size-8 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage((current) => current - 1)} disabled={page === 1} className="gap-1"><ChevronLeft className="size-4" /> 이전</Button>
            <span className="min-w-20 text-center text-sm font-medium text-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={page === totalPages} className="gap-1">다음 <ChevronRight className="size-4" /></Button>
          </div>
        )}
      </main>

      <AlertDialog open={deletingNote !== null} onOpenChange={(open) => !open && setDeletingNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>삭제한 메모는 복구할 수 없습니다. 이 작업을 계속하시겠어요?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "delete"}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void deleteNote() }} disabled={busy === "delete"} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{busy === "delete" ? "삭제 중..." : "삭제하기"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export default App
