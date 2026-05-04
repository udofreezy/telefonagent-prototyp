"use client";

import { useState, useEffect } from "react";
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  AlertTriangle,
  Shield,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Database,
  Loader2,
  RefreshCw,
  Clock,
  FileText,
  X,
} from "lucide-react";

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function insuranceBadge(type?: string) {
  if (!type) return null;
  const colors: Record<string, string> = {
    KVG: "bg-blue-500/10 text-blue-400",
    VVG: "bg-purple-500/10 text-purple-400",
    Privat: "bg-amber-500/10 text-amber-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${colors[type] || "bg-muted text-muted-foreground"}`}>
      <Shield className="h-3 w-3" />
      {type}
    </span>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/50 bg-card transition-all duration-200 hover:border-border">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0693e3]/10">
              <Users className="h-5 w-5 text-[#0693e3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{customer.name}</p>
                {insuranceBadge(customer.insuranceType)}
              </div>
              <p className="text-xs text-muted-foreground">{customer.patientenNr}</p>
            </div>
          </div>
          {customer.allergies && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-500">{customer.allergies}</span>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          {customer.phone && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate text-xs">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate text-xs">{customer.email}</span>
            </div>
          )}
          {customer.lastVisit && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs">Letzter Besuch: {formatDate(customer.lastVisit)}</span>
            </div>
          )}
          {customer.dateOfBirth && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs">Geb.: {formatDate(customer.dateOfBirth)}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{customer.notes}</p>
          </div>
        )}

        {/* Treatment toggle */}
        {customer.treatments.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            <span>Behandlungshistorie ({customer.treatments.length})</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Treatment timeline */}
        {expanded && customer.treatments.length > 0 && (
          <div className="ml-4 border-l-2 border-border/50 pl-4 space-y-3">
            {customer.treatments
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((t) => (
                <div key={t.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#0693e3]" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{formatDate(t.date)}</span>
                      {t.dentist && <span className="text-[10px] text-muted-foreground">| {t.dentist}</span>}
                      {t.cost && <span className="text-[10px] text-muted-foreground">| CHF {t.cost}</span>}
                    </div>
                    <p className="text-xs">{t.description}</p>
                    {t.notes && <p className="text-[10px] text-muted-foreground italic">{t.notes}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newInsurance, setNewInsurance] = useState<"KVG" | "VVG" | "Privat" | "">("");
  const [creating, setCreating] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    fetchCustomers();
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/customers/seed", { method: "POST" });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      console.error("Error seeding:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          email: newEmail.trim() || undefined,
          insuranceType: newInsurance || undefined,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewPhone("");
        setNewEmail("");
        setNewInsurance("");
        setShowNewForm(false);
        await fetchCustomers();
      }
    } catch (err) {
      console.error("Error creating customer:", err);
    } finally {
      setCreating(false);
    }
  };

  const withAllergies = customers.filter((c) => c.allergies);
  const insuranceCounts = customers.reduce<Record<string, number>>((acc, c) => {
    if (c.insuranceType) acc[c.insuranceType] = (acc[c.insuranceType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0693e3]/10">
              <Users className="h-5 w-5 text-[#0693e3]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-xs text-muted-foreground">Patienten</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{withAllergies.length}</p>
              <p className="text-xs text-muted-foreground">Mit Allergien</p>
            </div>
          </div>
        </div>
        {Object.entries(insuranceCounts).slice(0, 2).map(([type, count]) => (
          <div key={type} className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{type}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Name oder Telefon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 w-full sm:w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693e3]/50"
            />
          </div>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleSearch} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Suchen
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Database className="mr-2 h-3.5 w-3.5" />}
            Beispieldaten laden
          </Button>
          <Button size="sm" className="rounded-lg bg-[#0693e3] hover:bg-[#0693e3]/90 text-white" onClick={() => setShowNewForm(!showNewForm)}>
            {showNewForm ? <X className="mr-2 h-3.5 w-3.5" /> : <UserPlus className="mr-2 h-3.5 w-3.5" />}
            {showNewForm ? "Abbrechen" : "Neuer Patient"}
          </Button>
        </div>
      </div>

      {/* New patient form */}
      {showNewForm && (
        <div className="rounded-xl border border-[#0693e3]/20 bg-[#0693e3]/5 p-4 space-y-3">
          <p className="text-sm font-semibold">Neuen Patienten erfassen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Name *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693e3]/50"
            />
            <input
              type="text"
              placeholder="Telefon"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693e3]/50"
            />
            <input
              type="email"
              placeholder="E-Mail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693e3]/50"
            />
            <select
              value={newInsurance}
              onChange={(e) => setNewInsurance(e.target.value as "KVG" | "VVG" | "Privat" | "")}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0693e3]/50"
            >
              <option value="">Versicherung wählen...</option>
              <option value="KVG">KVG</option>
              <option value="VVG">VVG</option>
              <option value="Privat">Privat</option>
            </select>
          </div>
          <Button
            size="sm"
            className="rounded-lg bg-[#0693e3] hover:bg-[#0693e3]/90 text-white"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
          >
            {creating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserPlus className="mr-2 h-3.5 w-3.5" />}
            Patient erstellen
          </Button>
        </div>
      )}

      {/* Customer list */}
      {loading && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[#0693e3]/20" />
            <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#0693e3]" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Patienten werden geladen...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-medium">Noch keine Patienten</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Klicken Sie auf &quot;Beispieldaten laden&quot; um Testdaten zu erstellen.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
