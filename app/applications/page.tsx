"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  Briefcase,
  Trash2,
  ExternalLink,
  Calendar,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppBackground } from "@/components/app-background";
import { AppHeader } from "@/components/app-header";
import { Footer } from "@/components/footer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Status = "SAVED" | "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";
type ToastType = "success" | "error";

type Application = {
  id: string;
  company: string;
  position: string;
  status: Status;
  appliedDate: string | null;
  link: string | null;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  jobDescription: { id: string; title: string; company: string | null } | null;
  analysis: { id: string; matchScore: number } | null;
};

const COLUMNS: { id: Status; label: string; tone: string; ring: string }[] = [
  { id: "SAVED", label: "Saved", tone: "text-slate-700", ring: "ring-slate-200" },
  { id: "APPLIED", label: "Applied", tone: "text-blue-700", ring: "ring-blue-200" },
  { id: "INTERVIEW", label: "Interview", tone: "text-violet-700", ring: "ring-violet-200" },
  { id: "OFFER", label: "Offer", tone: "text-emerald-700", ring: "ring-emerald-200" },
  { id: "REJECTED", label: "Rejected", tone: "text-red-700", ring: "ring-red-200" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; text: string } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((type: ToastType, text: string) => setToast({ type, text }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setApplications(data.applications ?? []);
    } catch {
      showToast("error", "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  const grouped = useMemo(() => {
    const map: Record<Status, Application[]> = {
      SAVED: [],
      APPLIED: [],
      INTERVIEW: [],
      OFFER: [],
      REJECTED: [],
    };
    for (const a of applications) map[a.status].push(a);
    return map;
  }, [applications]);

  const activeApp = useMemo(
    () => applications.find((a) => a.id === draggingId) ?? null,
    [applications, draggingId]
  );

  async function moveApplication(id: string, toStatus: Status) {
    const prev = applications;
    // Optimistic update — column change is instant, server confirms in bg.
    setApplications((apps) =>
      apps.map((a) => (a.id === id ? { ...a, status: toStatus } : a))
    );
    try {
      const res = await fetch(`/api/applications?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: toStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setApplications(prev);
      showToast("error", "Failed to move card");
    }
  }

  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeleting(true);
    const prev = applications;
    setApplications((apps) => apps.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("success", "Application removed");
    } catch {
      setApplications(prev);
      showToast("error", "Failed to delete");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    if (!e.over) return;
    const toStatus = String(e.over.id) as Status;
    const id = String(e.active.id);
    const current = applications.find((a) => a.id === id);
    if (current && current.status !== toStatus) {
      moveApplication(id, toStatus);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50">
      <AppBackground />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-xl ${
              toast.type === "success"
                ? "border-emerald-200 bg-white/95 text-emerald-700"
                : "border-red-200 bg-white/95 text-red-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
        </div>
      )}

      <AppHeader backHref="/dashboard" maxWidth="max-w-7xl" />

      <section className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Application tracker</h1>
            <p className="mt-1 text-sm text-slate-500">
              Move cards between columns as your applications progress.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-10 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Add application
          </Button>
        </div>

        {/* Stats strip */}
        {!loading && applications.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {COLUMNS.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl bg-white/85 px-4 py-3 ring-1 ${c.ring} backdrop-blur-xl`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.label}
                </div>
                <div className={`text-2xl font-semibold ${c.tone}`}>{grouped[c.id].length}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : applications.length === 0 ? (
          <EmptyState onAdd={() => setAddOpen(true)} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setDraggingId(null)}
          >
            <div className="grid gap-4 lg:grid-cols-5">
              {COLUMNS.map((col) => (
                <Column
                  key={col.id}
                  status={col.id}
                  label={col.label}
                  tone={col.tone}
                  ring={col.ring}
                  applications={grouped[col.id]}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <DragOverlay>
              {activeApp ? <ApplicationCard application={activeApp} dragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      {addOpen && (
        <AddApplicationModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            setAddOpen(false);
            load();
            showToast("success", "Application added");
          }}
          onError={(msg) => showToast("error", msg)}
        />
      )}

      <ConfirmDialog
        open={!!pendingDeleteId}
        title="Delete this application?"
        description="This action can be undone by an admin."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />

      <Footer />
    </main>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white/70 py-20 ring-1 ring-slate-200/70 backdrop-blur-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
        <Briefcase className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">No applications yet</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
        Track every role you save, apply to, and interview for — all in one Kanban board.
      </p>
      <Button onClick={onAdd} className="mt-5 gap-1.5 rounded-lg bg-violet-600 px-4 font-medium text-white hover:bg-violet-700">
        <Plus className="h-4 w-4" />
        Add your first application
      </Button>
    </div>
  );
}

function Column({
  status,
  label,
  tone,
  ring,
  applications,
  onDelete,
}: {
  status: Status;
  label: string;
  tone: string;
  ring: string;
  applications: Application[];
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] flex-col rounded-2xl bg-white/70 p-3 ring-1 ${ring} backdrop-blur-xl transition ${
        isOver ? "ring-2 ring-violet-400 bg-violet-50/40" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className={`text-xs font-semibold uppercase tracking-wider ${tone}`}>{label}</div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          {applications.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {applications.map((a) => (
          <DraggableCard key={a.id} application={a} onDelete={() => onDelete(a.id)} />
        ))}
        {applications.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-[10px] text-slate-400">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  application,
  onDelete,
}: {
  application: Application;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`${isDragging ? "opacity-30" : ""}`}
    >
      <ApplicationCard application={application} onDelete={onDelete} />
    </div>
  );
}

function ApplicationCard({
  application,
  onDelete,
  dragging,
}: {
  application: Application;
  onDelete?: () => void;
  dragging?: boolean;
}) {
  const score = application.analysis?.matchScore;
  const scoreColor =
    score === undefined
      ? "bg-slate-100 text-slate-600"
      : score >= 75
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : score >= 50
      ? "bg-amber-50 text-amber-700 ring-amber-100"
      : "bg-red-50 text-red-700 ring-red-100";

  return (
    <div
      className={`group rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md hover:ring-slate-300 ${
        dragging ? "rotate-2 shadow-xl ring-violet-300" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{application.position}</h3>
          <p className="line-clamp-1 text-xs text-slate-500">{application.company}</p>
        </div>
        {onDelete && (
          <button
            // Stop drag events from swallowing the click
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-md p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            aria-label="Delete application"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {score !== undefined && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${scoreColor}`}
          >
            <TrendingUp className="h-3 w-3" />
            {score}%
          </span>
        )}
        {application.appliedDate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-100">
            <Calendar className="h-3 w-3" />
            {new Date(application.appliedDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {application.link && (
        <a
          href={application.link}
          target="_blank"
          rel="noopener noreferrer"
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-violet-700 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Posting
        </a>
      )}
    </div>
  );
}

function AddApplicationModal({
  onClose,
  onSuccess,
  onError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [jobs, setJobs] = useState<{ id: string; title: string; company: string | null }[]>([]);
  const [jobId, setJobId] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<Status>("SAVED");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        setJobs(data.jobs ?? []);
      } catch {
        /* non-fatal */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pre-fill company/position when a JD is selected.
  useEffect(() => {
    if (!jobId) return;
    const j = jobs.find((x) => x.id === jobId);
    if (j) {
      setPosition((p) => p || j.title);
      if (j.company) setCompany((c) => c || j.company!);
    }
  }, [jobId, jobs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !position.trim()) {
      onError("Company and position are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescriptionId: jobId || undefined,
          company: company.trim(),
          position: position.trim(),
          link: link.trim() || undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Failed to add application");
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch {
      onError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">Add application</h2>
        <p className="mt-1 text-sm text-slate-500">Track this role through your pipeline.</p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {jobs.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="job" className="text-sm font-medium text-slate-700">
                  Linked job description (optional)
                </Label>
                <div className="relative">
                  <select
                    id="job"
                    value={jobId}
                    onChange={(e) => setJobId(e.target.value)}
                    disabled={submitting}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
                  >
                    <option value="">— none —</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                        {j.company ? ` · ${j.company}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                  Company *
                </Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  maxLength={120}
                  disabled={submitting}
                  placeholder="Stripe"
                  className="h-10 rounded-lg border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position" className="text-sm font-medium text-slate-700">
                  Position *
                </Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  maxLength={120}
                  disabled={submitting}
                  placeholder="Senior Frontend Engineer"
                  className="h-10 rounded-lg border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="link" className="text-sm font-medium text-slate-700">
                Posting URL (optional)
              </Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                disabled={submitting}
                placeholder="https://…"
                className="h-10 rounded-lg border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                Stage
              </Label>
              <div className="relative">
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  disabled={submitting}
                  className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 disabled:opacity-60"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg bg-violet-600 font-medium text-white hover:bg-violet-700 disabled:opacity-80"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </span>
              ) : (
                "Add application"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
