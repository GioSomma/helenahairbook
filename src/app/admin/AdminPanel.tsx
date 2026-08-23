"use client";

import { useState, useEffect, useCallback } from "react";

type Booking = {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  notes: string;
  admin_notes: string;
  sentiment: number | null;
  status: string;
  cancelled_at: string | null;
  instagram_handle: string;
  created_at: string;
  services: { name: string; price: string } | null;
  availability: { date: string; time_slot: string } | null;
};

type Cost = {
  id: number;
  month: string;
  amount: number;
  description: string;
  category: string;
};

type RevenueTarget = {
  id: number;
  month: string;
  target_amount: number;
};

type AvailabilitySlot = {
  id: number;
  date: string;
  time_slot: string;
  is_booked: boolean;
};

const TABS = ["Appuntamenti", "Incassi", "Clienti", "Dati"];
const MONTHS = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const COLORS = {
  gold: "#b7a05a",
  sage: "#7a9e75",
  dark: "#1a1a2e",
  card: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.1)",
  text: "rgba(255,255,255,0.9)",
  muted: "rgba(255,255,255,0.4)",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(m: string) {
  const [y, mo] = m.split("-");
  return `${MONTHS[parseInt(mo) - 1]} ${y}`;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [costs, setCosts] = useState<Cost[]>([]);
  const [targets, setTargets] = useState<RevenueTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // New availability form
  const [newDate, setNewDate] = useState("");
  const [newSlots, setNewSlots] = useState("09:00,10:30,12:00,15:00,16:30");
  const [addingSlots, setAddingSlots] = useState(false);

  // New cost form
  const [newCost, setNewCost] = useState({ month: getCurrentMonth(), amount: "", description: "", category: "prodotti" });
  const [targetInput, setTargetInput] = useState("");
  const [targetMonth, setTargetMonth] = useState(getCurrentMonth());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, aRes, cRes, tRes] = await Promise.all([
        fetch("/api/admin/bookings"),
        fetch("/api/admin/availability"),
        fetch("/api/admin/costs"),
        fetch("/api/admin/targets"),
      ]);
      const [b, a, c, t] = await Promise.all([bRes.json(), aRes.json(), cRes.json(), tRes.json()]);
      setBookings(Array.isArray(b) ? b : []);
      setAvailability(Array.isArray(a) ? a : []);
      setCosts(Array.isArray(c) ? c : []);
      setTargets(Array.isArray(t) ? t : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAvailability = async () => {
    if (!newDate) return;
    setAddingSlots(true);
    const slots = newSlots.split(",").map(s => s.trim()).filter(Boolean);
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, slots }),
    });
    setNewDate("");
    await fetchAll();
    setAddingSlots(false);
  };

  const deleteSlot = async (id: number) => {
    await fetch("/api/admin/availability", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAll();
  };

  const updateBooking = async (id: string, fields: Partial<Booking>) => {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    await fetchAll();
  };

  const cancelBooking = async (id: string) => {
    await updateBooking(id, { status: "cancelled", cancelled_at: new Date().toISOString() } as Partial<Booking>);
    setSelectedBooking(null);
  };

  const addCost = async () => {
    if (!newCost.amount) return;
    await fetch("/api/admin/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCost),
    });
    setNewCost({ month: getCurrentMonth(), amount: "", description: "", category: "prodotti" });
    await fetchAll();
  };

  const setTarget = async () => {
    if (!targetInput) return;
    await fetch("/api/admin/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: targetMonth, target_amount: parseFloat(targetInput) }),
    });
    setTargetInput("");
    await fetchAll();
  };

  // ─── COMPUTED DATA ───
  const confirmedBookings = bookings.filter(b => b.status !== "cancelled");
  const currentMonth = getCurrentMonth();

  const parsePrice = (p: string) => parseFloat(p?.replace(/[^0-9.]/g, "") || "0");

  const monthlyRevenue = (month: string) => {
    return confirmedBookings
      .filter(b => b.availability?.date?.startsWith(month))
      .reduce((s, b) => s + parsePrice(b.services?.price || "0"), 0);
  };

  const monthlyCosts = (month: string) => {
    return costs.filter(c => c.month === month).reduce((s, c) => s + c.amount, 0);
  };

  const currentRevenue = monthlyRevenue(currentMonth);
  const currentCosts = monthlyCosts(currentMonth);
  const currentTarget = targets.find(t => t.month === currentMonth)?.target_amount || 0;

  // Get all months with data
  const allMonths = Array.from(new Set([
    ...bookings.map(b => b.availability?.date?.slice(0, 7)).filter(Boolean),
    ...costs.map(c => c.month),
    currentMonth,
  ])).sort().reverse() as string[];

  // Group availability by date
  const availByDate = availability.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  // Upcoming bookings
  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = confirmedBookings
    .filter(b => b.availability?.date >= today)
    .sort((a, b) => (a.availability?.date || "") < (b.availability?.date || "") ? -1 : 1);

  // Client stats
  const clientMap = new Map<string, { booking: Booking; count: number; total: number }>();
  confirmedBookings.forEach(b => {
    const key = b.email;
    if (!clientMap.has(key)) clientMap.set(key, { booking: b, count: 0, total: 0 });
    const entry = clientMap.get(key)!;
    entry.count++;
    entry.total += parsePrice(b.services?.price || "0");
  });
  const clients = Array.from(clientMap.values()).sort((a, b) => b.total - a.total);

  const sentimentEmoji = (s: number | null) => {
    if (s === null) return "—";
    if (s >= 4) return "😍";
    if (s === 3) return "😊";
    if (s === 2) return "😐";
    return "😕";
  };

  const panelStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    fontFamily: "'Jost', sans-serif",
    color: COLORS.text,
  };

  const cardStyle: React.CSSProperties = {
    background: COLORS.card,
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: 20,
    border: `1px solid ${COLORS.border}`,
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.07)",
    color: "white",
    fontSize: 13,
    outline: "none",
    fontFamily: "'Jost', sans-serif",
    boxSizing: "border-box",
  };

  const btnStyle: React.CSSProperties = {
    padding: "10px 20px",
    borderRadius: 10,
    background: `linear-gradient(135deg, ${COLORS.gold}, #d4be78)`,
    border: "none",
    color: "white",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: "'Jost', sans-serif",
    whiteSpace: "nowrap",
  };

  const btnDangerStyle: React.CSSProperties = {
    ...btnStyle,
    background: "rgba(239,68,68,0.7)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: COLORS.gold,
    marginBottom: 4,
    display: "block",
  };

  if (loading) return (
    <div style={{ ...panelStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: COLORS.gold, letterSpacing: 3, fontSize: 13 }}>✦ Caricamento...</div>
    </div>
  );

  return (
    <div style={panelStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(183,160,90,0.3); border-radius: 2px; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        select option { background: #1a1a2e; color: white; }
      `}</style>

      {/* HEADER */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300 }}>
            Helena <em style={{ color: COLORS.gold }}>Admin</em>
          </div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: COLORS.gold, textTransform: "uppercase" }}>
            Pannello di controllo
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Questo mese</div>
          <div style={{ fontSize: 18, color: COLORS.gold, fontWeight: 500 }}>€{currentRevenue.toFixed(0)}</div>
          {currentTarget > 0 && (
            <div style={{ fontSize: 10, color: COLORS.muted }}>
              Target: €{currentTarget} ({Math.round(currentRevenue / currentTarget * 100)}%)
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", padding: "16px 20px 0", gap: 4, overflowX: "auto", borderBottom: `1px solid ${COLORS.border}`, marginTop: 16 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)} style={{
            padding: "10px 16px",
            borderRadius: "10px 10px 0 0",
            border: "none",
            background: activeTab === i ? "rgba(183,160,90,0.15)" : "transparent",
            color: activeTab === i ? COLORS.gold : COLORS.muted,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            borderBottom: activeTab === i ? `2px solid ${COLORS.gold}` : "2px solid transparent",
            fontFamily: "'Jost', sans-serif",
            whiteSpace: "nowrap",
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "20px", maxWidth: 800, margin: "0 auto" }}>

        {/* ─── TAB 0: APPUNTAMENTI ─── */}
        {activeTab === 0 && (
          <>
            {/* Add availability */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 16 }}>
                ✦ Aggiungi disponibilità
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Data</label>
                  <input type="date" style={inputStyle} value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Orari (separati da virgola)</label>
                  <input style={inputStyle} value={newSlots} onChange={e => setNewSlots(e.target.value)} placeholder="09:00,10:30,12:00" />
                </div>
              </div>
              <button style={btnStyle} onClick={addAvailability} disabled={addingSlots}>
                {addingSlots ? "Salvataggio..." : "+ Aggiungi"}
              </button>
            </div>

            {/* Calendar view */}
            {Object.keys(availByDate).sort().map(date => {
              const slots = availByDate[date];
              const dateBookings = upcomingBookings.filter(b => b.availability?.date === date);
              return (
                <div key={date} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif" }}>{formatDate(date)}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>
                      {slots.filter(s => s.is_booked).length}/{slots.length} occupati
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {slots.map(slot => {
                      const booking = dateBookings.find(b => b.availability?.time_slot === slot.time_slot);
                      return (
                        <div key={slot.id} onClick={() => booking && setSelectedBooking(booking)} style={{
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: slot.is_booked ? "rgba(183,160,90,0.2)" : "rgba(122,158,117,0.15)",
                          border: `1px solid ${slot.is_booked ? COLORS.gold : COLORS.sage}`,
                          cursor: booking ? "pointer" : "default",
                          minWidth: 80,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: slot.is_booked ? COLORS.gold : COLORS.sage }}>
                            {slot.time_slot}
                          </div>
                          {booking ? (
                            <>
                              <div style={{ fontSize: 10, color: COLORS.text, marginTop: 2 }}>{booking.name} {booking.surname}</div>
                              <div style={{ fontSize: 9, color: COLORS.muted, marginTop: 1 }}>{booking.services?.name}</div>
                              <div style={{ fontSize: 10, color: COLORS.gold }}>{booking.services?.price}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 10, color: COLORS.sage, marginTop: 2 }}>Libero</div>
                          )}
                          {!slot.is_booked && (
                            <button onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }} style={{
                              marginTop: 4, fontSize: 9, color: "rgba(239,68,68,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0,
                            }}>× rimuovi</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {Object.keys(availByDate).length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: COLORS.muted, fontStyle: "italic" }}>
                Nessuna disponibilità inserita. Aggiungi la prima tappa!
              </div>
            )}
          </>
        )}

        {/* ─── TAB 1: INCASSI ─── */}
        {activeTab === 1 && (
          <>
            {/* Target + add cost */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 12 }}>Target mese</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <select style={{ ...inputStyle, flex: 1 }} value={targetMonth} onChange={e => setTargetMonth(e.target.value)}>
                    {allMonths.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="€ obiettivo" value={targetInput} onChange={e => setTargetInput(e.target.value)} />
                  <button style={btnStyle} onClick={setTarget}>✓</button>
                </div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 12 }}>Aggiungi costo</div>
                <select style={{ ...inputStyle, marginBottom: 8 }} value={newCost.month} onChange={e => setNewCost({ ...newCost, month: e.target.value })}>
                  {allMonths.map(m => <option key={m} value={m}>{getMonthLabel(m)}</option>)}
                </select>
                <select style={{ ...inputStyle, marginBottom: 8 }} value={newCost.category} onChange={e => setNewCost({ ...newCost, category: e.target.value })}>
                  {["prodotti", "trasporto", "marketing", "formazione", "altro"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 1 }} type="number" placeholder="€ importo" value={newCost.amount} onChange={e => setNewCost({ ...newCost, amount: e.target.value })} />
                </div>
                <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="Descrizione" value={newCost.description} onChange={e => setNewCost({ ...newCost, description: e.target.value })} />
                <button style={btnStyle} onClick={addCost}>+ Aggiungi costo</button>
              </div>
            </div>

            {/* Monthly breakdown */}
            {allMonths.map(month => {
              const rev = monthlyRevenue(month);
              const cost = monthlyCosts(month);
              const margin = rev - cost;
              const target = targets.find(t => t.month === month)?.target_amount || 0;
              const monthCosts = costs.filter(c => c.month === month);
              const monthBookings = confirmedBookings.filter(b => b.availability?.date?.startsWith(month));

              return (
                <div key={month} style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{getMonthLabel(month)}</div>
                    {target > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: COLORS.muted }}>Target: €{target}</div>
                        <div style={{ height: 4, width: 80, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: "100%", width: `${Math.min(100, rev / target * 100)}%`, background: rev >= target ? COLORS.sage : COLORS.gold, borderRadius: 2, transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Fatturato", value: `€${rev.toFixed(0)}`, color: COLORS.gold },
                      { label: "Costi", value: `€${cost.toFixed(0)}`, color: "#ef4444" },
                      { label: "Margine", value: `€${margin.toFixed(0)}`, color: margin >= 0 ? COLORS.sage : "#ef4444" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: "center", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: 10 }}>
                        <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                        <div style={{ fontSize: 18, color, fontWeight: 500, marginTop: 4 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 8 }}>
                    {monthBookings.length} appuntamenti · {monthBookings.map(b => b.services?.name).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                  </div>
                  {monthCosts.length > 0 && (
                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
                      <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Dettaglio costi</div>
                      {monthCosts.map(c => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                          <span style={{ color: COLORS.muted }}>{c.description || c.category}</span>
                          <span style={{ color: "#ef4444" }}>-€{c.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI insight box */}
                  {monthBookings.length > 0 && (
                    <div style={{ marginTop: 12, padding: 12, background: "rgba(183,160,90,0.07)", borderRadius: 10, border: `1px solid rgba(183,160,90,0.2)` }}>
                      <div style={{ fontSize: 9, color: COLORS.gold, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>✦ Insight</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>
                        {target > 0 && rev < target && (
                          <span>Mancano €{(target - rev).toFixed(0)} al target. Servono circa {Math.ceil((target - rev) / (rev / monthBookings.length))} appuntamenti in più. </span>
                        )}
                        {target > 0 && rev >= target && (
                          <span style={{ color: COLORS.sage }}>🎉 Target raggiunto! Ottimo lavoro. </span>
                        )}
                        {monthBookings.length > 0 && (
                          <span>Media per appuntamento: €{(rev / monthBookings.length).toFixed(0)}. </span>
                        )}
                        {cost > 0 && (
                          <span>Margine netto: {((margin / rev) * 100).toFixed(0)}% del fatturato.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ─── TAB 2: CLIENTI ─── */}
        {activeTab === 2 && (
          <>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 16 }}>
              {clients.length} clienti · €{confirmedBookings.reduce((s, b) => s + parsePrice(b.services?.price || "0"), 0).toFixed(0)} totale generato
            </div>
            {clients.map(({ booking, count, total }) => (
              <div key={booking.email} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontFamily: "'Cormorant Garamond', serif" }}>{booking.name} {booking.surname}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{booking.email}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>{booking.phone}</div>
                    {booking.instagram_handle && (
                      <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2 }}>@{booking.instagram_handle}</div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, color: COLORS.gold, fontWeight: 500 }}>€{total.toFixed(0)}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{count} appuntamenti</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>Media €{(total / count).toFixed(0)}</div>
                  </div>
                </div>
                {/* Last booking */}
                {(() => {
                  const clientBookings = confirmedBookings.filter(b => b.email === booking.email).sort((a, b) => (b.availability?.date || "") < (a.availability?.date || "") ? -1 : 1);
                  const last = clientBookings[clientBookings.length - 1];
                  return last ? (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 11, color: COLORS.muted }}>
                      Ultimo: {formatDate(last.availability?.date || "")} — {last.services?.name}
                      {last.sentiment !== null && <span style={{ marginLeft: 8 }}>{sentimentEmoji(last.sentiment)}</span>}
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
            {clients.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: COLORS.muted, fontStyle: "italic" }}>Nessuna cliente ancora</div>
            )}
          </>
        )}

        {/* ─── TAB 3: DATI ─── */}
        {activeTab === 3 && (
          <>
            {/* KPI overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Appuntamenti totali", value: confirmedBookings.length },
                { label: "Clienti uniche", value: clients.length },
                { label: "Fatturato totale", value: `€${confirmedBookings.reduce((s, b) => s + parsePrice(b.services?.price || "0"), 0).toFixed(0)}` },
                { label: "Valore medio cliente", value: `€${clients.length > 0 ? (confirmedBookings.reduce((s, b) => s + parsePrice(b.services?.price || "0"), 0) / clients.length).toFixed(0) : 0}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ ...cardStyle, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                  <div style={{ fontSize: 22, color: COLORS.gold, fontWeight: 500, marginTop: 6 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Servizi breakdown */}
            <div style={cardStyle}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 12 }}>Servizi più prenotati</div>
              {(() => {
                const srvMap = new Map<string, number>();
                confirmedBookings.forEach(b => {
                  const n = b.services?.name || "N/D";
                  srvMap.set(n, (srvMap.get(n) || 0) + 1);
                });
                return Array.from(srvMap.entries()).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13 }}>
                    <span>{name}</span>
                    <span style={{ color: COLORS.gold }}>{count}x</span>
                  </div>
                ));
              })()}
            </div>

            {/* Per-client analytics */}
            <div style={cardStyle}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: COLORS.gold, textTransform: "uppercase", marginBottom: 12 }}>Dettaglio per cliente</div>
              {clients.map(({ booking, count, total }) => {
                const clientBookings = confirmedBookings.filter(b => b.email === booking.email);
                const cancelled = bookings.filter(b => b.email === booking.email && b.status === "cancelled").length;
                const sentiments = clientBookings.map(b => b.sentiment).filter((s): s is number => s !== null);
                const avgSentiment = sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null;
                const services = Array.from(new Set(clientBookings.map(b => b.services?.name))).filter(Boolean);
                const dates = clientBookings.map(b => b.availability?.date).filter(Boolean).sort();

                return (
                  <div key={booking.email} style={{ padding: "12px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontFamily: "'Cormorant Garamond', serif" }}>{booking.name} {booking.surname}</span>
                      <span style={{ fontSize: 12, color: COLORS.gold }}>€{total.toFixed(0)}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { k: "Appuntamenti", v: count },
                        { k: "Annullamenti", v: cancelled },
                        { k: "Sentiment", v: avgSentiment !== null ? sentimentEmoji(Math.round(avgSentiment)) : "—" },
                        { k: "Servizi", v: services.join(", ") || "—" },
                        { k: "Prima visita", v: dates[0] ? formatDate(dates[0]) : "—" },
                        { k: "Ultima visita", v: dates[dates.length - 1] ? formatDate(dates[dates.length - 1]) : "—" },
                      ].map(({ k, v }) => (
                        <div key={k} style={{ padding: "4px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                          <span style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>{k}: </span>
                          <span style={{ fontSize: 11, color: COLORS.text }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── BOOKING MODAL ─── */}
      {selectedBooking && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
          alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: 20,
        }} onClick={() => setSelectedBooking(null)}>
          <div style={{
            background: "#16213e", borderRadius: "20px 20px 0 0", padding: 24, width: "100%",
            maxWidth: 500, border: `1px solid ${COLORS.border}`, maxHeight: "85vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>
              {selectedBooking.name} {selectedBooking.surname}
            </div>
            <div style={{ fontSize: 11, color: COLORS.gold, marginBottom: 16 }}>
              {formatDate(selectedBooking.availability?.date || "")} · {selectedBooking.availability?.time_slot}
            </div>

            {[
              { k: "Servizio", v: selectedBooking.services?.name },
              { k: "Prezzo", v: selectedBooking.services?.price },
              { k: "Email", v: selectedBooking.email },
              { k: "Telefono", v: selectedBooking.phone },
              { k: "Note cliente", v: selectedBooking.notes || "—" },
            ].map(({ k, v }) => (
              <div key={k} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>{k}</span>
                <span style={{ fontSize: 13 }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Handle Instagram</label>
              <input style={{ ...inputStyle, marginBottom: 12 }}
                placeholder="@username"
                defaultValue={selectedBooking.instagram_handle || ""}
                onBlur={e => updateBooking(selectedBooking.id, { instagram_handle: e.target.value } as Partial<Booking>)}
              />
              <label style={labelStyle}>Note admin</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "none", marginBottom: 12 }}
                placeholder="Note interne..."
                defaultValue={selectedBooking.admin_notes || ""}
                onBlur={e => updateBooking(selectedBooking.id, { admin_notes: e.target.value } as Partial<Booking>)}
              />
              <label style={labelStyle}>Sentiment post-trattamento</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => updateBooking(selectedBooking.id, { sentiment: s } as Partial<Booking>)} style={{
                    flex: 1, padding: 10, borderRadius: 10,
                    background: selectedBooking.sentiment === s ? "rgba(183,160,90,0.3)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${selectedBooking.sentiment === s ? COLORS.gold : COLORS.border}`,
                    color: "white", cursor: "pointer", fontSize: 16,
                  }}>{sentimentEmoji(s)}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ ...btnStyle, flex: 1 }} onClick={() => setSelectedBooking(null)}>Chiudi</button>
              {selectedBooking.status !== "cancelled" && (
                <button style={{ ...btnDangerStyle, flex: 1 }} onClick={() => cancelBooking(selectedBooking.id)}>Annulla prenotazione</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
