import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const TABS = [
  { id: "contacts", label: "Inquiries" },
  { id: "projects", label: "Projects (CMS)" },
  { id: "newsletter", label: "Newsletter" },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("contacts");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--line)] px-6 md:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="font-display text-2xl">ARK<span className="text-[var(--accent)]">.</span></a>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">
            / admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">{user?.email}</span>
          <button onClick={logout} className="btn-pill" data-testid="admin-logout">Logout</button>
        </div>
      </header>

      <div className="px-6 md:px-10 py-10 max-w-[1500px] mx-auto">
        <div className="flex gap-2 mb-10 border-b border-[var(--line)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.25em] transition-colors ${
                tab === t.id ? "text-[var(--fg)] border-b border-[var(--accent)]" : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
              }`}
              data-testid={`admin-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "contacts" && <ContactsPanel />}
        {tab === "projects" && <ProjectsPanel />}
        {tab === "newsletter" && <NewsletterPanel />}
      </div>
    </div>
  );
}

function ContactsPanel() {
  const [items, setItems] = useState([]);
  const load = async () => {
    try {
      const { data } = await api.get("/admin/contacts");
      setItems(data);
    } catch {
      toast.error("Could not load inquiries");
    }
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/admin/contacts/${id}/read`);
    load();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this inquiry?")) return;
    await api.delete(`/admin/contacts/${id}`);
    load();
  };

  return (
    <div data-testid="contacts-panel">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-6">
        {items.length} total · {items.filter((i) => !i.read).length} unread
      </div>
      {items.length === 0 ? (
        <div className="text-[var(--fg-dim)] py-10">No inquiries yet.</div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c.id} className="border border-[var(--line)] p-5 rounded-xl glass" data-testid={`contact-row-${c.id}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="font-display text-2xl">{c.name}</div>
                  <a href={`mailto:${c.email}`} className="text-[var(--accent-2)] text-sm">{c.email}</a>
                  {c.company && <span className="ml-3 text-[var(--fg-dim)] text-xs">@ {c.company}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {!c.read && <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">new</span>}
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--fg-dim)]">{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
              {c.budget && (
                <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)] mb-2">budget · {c.budget}</div>
              )}
              <p className="text-[var(--fg)] whitespace-pre-wrap text-sm">{c.message}</p>
              <div className="mt-4 flex items-center gap-3">
                {!c.read && (
                  <button onClick={() => markRead(c.id)} className="font-mono text-[10px] uppercase tracking-widest ulink">Mark read</button>
                )}
                <button onClick={() => remove(c.id)} className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] ulink">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsletterPanel() {
  const [items, setItems] = useState([]);
  const load = async () => {
    const { data } = await api.get("/admin/newsletter");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Remove subscriber?")) return;
    await api.delete(`/admin/newsletter/${id}`);
    load();
  };

  return (
    <div data-testid="newsletter-panel">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-6">
        {items.length} subscribers
      </div>
      <div className="border border-[var(--line)] rounded-xl divide-y divide-[var(--line)] overflow-hidden">
        {items.length === 0 && <div className="p-6 text-[var(--fg-dim)]">No subscribers yet.</div>}
        {items.map((n) => (
          <div key={n.id} className="flex items-center justify-between p-4">
            <div>
              <div className="text-[var(--fg)]">{n.email}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)]">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <button onClick={() => remove(n.id)} className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] ulink">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsPanel() {
  const empty = { title: "", client: "", year: "", category: "", description: "", image_url: "", accent_color: "#FF3D00", services: [], published: true, order: 0 };
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [servicesText, setServicesText] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/projects");
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (p) => {
    setEditing(p?.id || "new");
    if (p) {
      setForm(p);
      setServicesText((p.services || []).join(", "));
    } else {
      setForm(empty);
      setServicesText("");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, services: servicesText.split(",").map((s) => s.trim()).filter(Boolean), order: Number(form.order) || 0 };
    try {
      if (editing === "new") {
        await api.post("/admin/projects", payload);
        toast.success("Project created");
      } else {
        await api.put(`/admin/projects/${editing}`, payload);
        toast.success("Project updated");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error("Save failed");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete project?")) return;
    await api.delete(`/admin/projects/${id}`);
    load();
  };

  return (
    <div data-testid="projects-panel">
      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">{items.length} projects</div>
        <button onClick={() => startEdit(null)} className="btn-solid" data-testid="add-project">+ New project</button>
      </div>

      {editing && (
        <form onSubmit={save} className="border border-[var(--line)] glass rounded-xl p-6 mb-8 space-y-4" data-testid="project-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["title", "Title"], ["client", "Client"], ["year", "Year"],
              ["category", "Category"], ["image_url", "Image URL"], ["accent_color", "Accent color"],
            ].map(([k, label]) => (
              <div key={k} className="border-b border-[var(--line)] pb-2">
                <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-1">{label}</label>
                <input value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full text-base" />
              </div>
            ))}
            <div className="border-b border-[var(--line)] pb-2">
              <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-1">Order</label>
              <input type="number" value={form.order || 0} onChange={(e) => setForm({ ...form, order: e.target.value })} className="w-full text-base" />
            </div>
            <div className="border-b border-[var(--line)] pb-2 flex items-center gap-3">
              <label className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)]">Published</label>
              <input type="checkbox" checked={!!form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            </div>
          </div>
          <div className="border-b border-[var(--line)] pb-2">
            <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-1">Services (comma separated)</label>
            <input value={servicesText} onChange={(e) => setServicesText(e.target.value)} className="w-full text-base" />
          </div>
          <div className="border-b border-[var(--line)] pb-2">
            <label className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--fg-dim)] mb-1">Description</label>
            <textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full text-base resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-solid" data-testid="save-project">Save</button>
            <button type="button" onClick={() => setEditing(null)} className="btn-pill">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <div key={p.id} className="border border-[var(--line)] rounded-xl overflow-hidden glass">
            {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-2xl">{p.title}</div>
                  <div className="text-[var(--fg-dim)] text-xs font-mono uppercase tracking-widest">{p.client} · {p.year}</div>
                </div>
                <div className="w-4 h-4 rounded-full" style={{ background: p.accent_color }} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => startEdit(p)} className="font-mono text-[10px] uppercase tracking-widest ulink" data-testid={`edit-project-${p.id}`}>Edit</button>
                <button onClick={() => remove(p.id)} className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)] ulink">Delete</button>
                {!p.published && <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-dim)]">hidden</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
