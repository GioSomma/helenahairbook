"use client";

import { useState, useEffect } from "react";

type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: string;
};

type Slot = {
  id: number;
  time_slot: string;
};

type DayAvailability = {
  date: string;
  slots: Slot[];
};

export default function HelenaBooking() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", surname: "", email: "", phone: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servRes, availRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/availability'),
        ]);
        const servData = await servRes.json();
        const availData = await availRes.json();
        setServices(servData);
        setAvailability(availData);
      } catch {
        setError("Errore nel caricamento dei dati. Riprova.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return {
      day: days[d.getDay()],
      num: d.getDate(),
      month: months[d.getMonth()],
    };
  };

  const canGoStep2 = selectedService !== null;
  const canGoStep3 = selectedDay !== null && selectedSlot !== null;
  const canSubmit = form.name && form.surname && form.email && form.phone;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedService || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          availability_id: selectedSlot.id,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella prenotazione');
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #f7f5f0 0%, #ede9e0 50%, #f0ede6 100%)", fontFamily: "'Jost', sans-serif", color: "#b7a05a", fontSize: 14, letterSpacing: 2 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap');`}</style>
      ✦ Caricamento...
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f7f5f0 0%, #ede9e0 50%, #f0ede6 100%)",
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      color: "#2c2c2c",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .bg-ornament { position: fixed; top: -120px; right: -120px; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(183,160,90,0.08) 0%, transparent 70%); pointer-events: none; }
        .bg-ornament-2 { position: fixed; bottom: -100px; left: -100px; width: 350px; height: 350px; border-radius: 50%; background: radial-gradient(circle, rgba(143,175,138,0.1) 0%, transparent 70%); pointer-events: none; }
        .header { text-align: center; padding: 36px 24px 28px; position: relative; }
        .header::after { content: ''; display: block; margin: 20px auto 0; width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #b7a05a, transparent); }
        .logo-eyebrow { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 4px; color: #b7a05a; text-transform: uppercase; margin-bottom: 6px; }
        .logo-name { font-size: 32px; font-weight: 300; letter-spacing: 1px; color: #2c2c2c; line-height: 1.15; }
        .logo-name em { font-style: italic; color: #7a9e75; }
        .logo-sub { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 5px; color: #9a8c6a; text-transform: uppercase; margin-top: 6px; }
        .steps-bar { display: flex; justify-content: center; align-items: center; gap: 0; padding: 0 24px 28px; }
        .step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; max-width: 100px; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500; border: 1.5px solid #d4c9a0; color: #c4b88a; background: transparent; transition: all 0.3s ease; }
        .step-circle.active { background: linear-gradient(135deg, #b7a05a, #d4be78); border-color: transparent; color: white; box-shadow: 0 4px 16px rgba(183,160,90,0.35); }
        .step-circle.done { background: #7a9e75; border-color: transparent; color: white; }
        .step-label { font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: #aaa; }
        .step-label.active { color: #b7a05a; }
        .step-label.done { color: #7a9e75; }
        .step-line { flex: 1; height: 1px; background: #ddd; margin-bottom: 20px; max-width: 40px; }
        .step-line.done { background: #7a9e75; }
        .content { padding: 0 20px 40px; max-width: 480px; margin: 0 auto; }
        .section-title { font-size: 24px; font-weight: 300; color: #2c2c2c; margin-bottom: 4px; }
        .section-title em { font-style: italic; color: #7a9e75; }
        .section-sub { font-family: 'Jost', sans-serif; font-size: 12px; color: #999; letter-spacing: 1px; margin-bottom: 24px; }
        .profile-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.07); margin-bottom: 28px; display: flex; gap: 0; position: relative; }
        .profile-img-wrap { width: 130px; min-height: 160px; flex-shrink: 0; background: linear-gradient(180deg, #8faf8a 0%, #6b9066 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .profile-avatar { width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 40px; position: relative; z-index: 1; }
        .profile-text { padding: 20px 18px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .profile-name { font-size: 18px; font-weight: 400; color: #2c2c2c; margin-bottom: 4px; }
        .profile-role { font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #b7a05a; margin-bottom: 12px; }
        .profile-bio { font-size: 13px; font-style: italic; color: #666; line-height: 1.6; }
        .profile-stars { margin-top: 12px; color: #b7a05a; font-size: 12px; letter-spacing: 2px; }
        .service-card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); cursor: pointer; border: 2px solid transparent; transition: all 0.25s ease; position: relative; overflow: hidden; }
        .service-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: linear-gradient(180deg, #b7a05a, #7a9e75); opacity: 0; transition: opacity 0.25s; }
        .service-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); transform: translateY(-1px); }
        .service-card.selected { border-color: #b7a05a; background: linear-gradient(135deg, #fffdf5 0%, #f9f7ef 100%); box-shadow: 0 8px 28px rgba(183,160,90,0.18); }
        .service-card.selected::before { opacity: 1; }
        .service-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #f5f0e8, #ede8d8); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #b7a05a; flex-shrink: 0; }
        .service-info { flex: 1; }
        .service-name { font-size: 16px; font-weight: 400; color: #2c2c2c; margin-bottom: 2px; }
        .service-desc { font-family: 'Jost', sans-serif; font-size: 11px; color: #999; margin-bottom: 6px; }
        .service-meta { display: flex; gap: 12px; align-items: center; }
        .service-price { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 500; color: #b7a05a; }
        .service-dur { font-family: 'Jost', sans-serif; font-size: 11px; color: #bbb; }
        .service-check { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #e0e0e0; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .service-check.checked { background: #b7a05a; border-color: #b7a05a; color: white; font-size: 11px; }
        .days-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 24px; scrollbar-width: none; }
        .days-scroll::-webkit-scrollbar { display: none; }
        .day-chip { flex-shrink: 0; padding: 12px 16px; border-radius: 14px; background: white; border: 1.5px solid #e8e0cc; cursor: pointer; text-align: center; min-width: 80px; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .day-chip:hover { border-color: #b7a05a; }
        .day-chip.selected { background: linear-gradient(135deg, #b7a05a, #d4be78); border-color: transparent; color: white; box-shadow: 0 4px 16px rgba(183,160,90,0.35); }
        .day-name { font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.7; margin-bottom: 4px; }
        .day-date { font-size: 15px; font-weight: 300; }
        .slots-label { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #999; margin-bottom: 12px; }
        .slots-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
        .slot-btn { padding: 12px 8px; border-radius: 12px; background: white; border: 1.5px solid #e8e0cc; font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400; color: #555; cursor: pointer; text-align: center; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .slot-btn:hover { border-color: #7a9e75; color: #7a9e75; }
        .slot-btn.selected { background: #7a9e75; border-color: transparent; color: white; box-shadow: 0 4px 14px rgba(122,158,117,0.35); }
        .recap-pill { background: white; border-radius: 14px; padding: 14px 18px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-left: 3px solid #b7a05a; }
        .recap-icon { color: #b7a05a; font-size: 18px; }
        .recap-info { flex: 1; }
        .recap-service { font-size: 14px; font-weight: 400; color: #2c2c2c; }
        .recap-when { font-family: 'Jost', sans-serif; font-size: 11px; color: #999; margin-top: 2px; }
        .form-group { margin-bottom: 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .form-label { font-family: 'Jost', sans-serif; font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase; color: #b7a05a; margin-bottom: 6px; display: block; }
        .form-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid #e8e0cc; background: white; font-family: 'Jost', sans-serif; font-size: 14px; color: #2c2c2c; outline: none; transition: border-color 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .form-input:focus { border-color: #b7a05a; }
        .form-input::placeholder { color: #ccc; }
        textarea.form-input { resize: none; min-height: 100px; }
        .privacy-note { font-family: 'Jost', sans-serif; font-size: 10px; color: #bbb; text-align: center; margin-bottom: 20px; line-height: 1.6; }
        .btn-primary { width: 100%; padding: 18px; border-radius: 16px; background: linear-gradient(135deg, #b7a05a 0%, #d4be78 50%, #b7a05a 100%); background-size: 200% 100%; border: none; color: white; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 500; cursor: pointer; box-shadow: 0 8px 28px rgba(183,160,90,0.4); transition: all 0.3s ease; margin-bottom: 16px; }
        .btn-primary:hover:not(:disabled) { background-position: 100% 0; box-shadow: 0 12px 36px rgba(183,160,90,0.5); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
        .btn-back { width: 100%; padding: 14px; border-radius: 16px; background: transparent; border: 1.5px solid #e0d8c8; color: #999; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .btn-back:hover { border-color: #bbb; color: #666; }
        .error-box { background: #fff5f5; border: 1px solid #fca5a5; border-radius: 12px; padding: 14px 16px; margin-bottom: 16px; font-family: 'Jost', sans-serif; font-size: 12px; color: #dc2626; text-align: center; }
        .empty-state { text-align: center; padding: 40px 0; font-family: 'Jost', sans-serif; font-size: 13px; color: #ccc; font-style: italic; }
        .success-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; min-height: 60vh; }
        .success-icon { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #7a9e75, #98bf93); display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 24px; box-shadow: 0 12px 36px rgba(122,158,117,0.35); animation: successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
        @keyframes successPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .success-title { font-size: 28px; font-weight: 300; margin-bottom: 8px; }
        .success-title em { font-style: italic; color: #7a9e75; }
        .success-msg { font-family: 'Jost', sans-serif; font-size: 13px; color: #888; line-height: 1.7; max-width: 280px; margin-bottom: 28px; }
        .success-card { background: white; border-radius: 20px; padding: 24px; width: 100%; max-width: 340px; box-shadow: 0 8px 32px rgba(0,0,0,0.07); text-align: left; }
        .success-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0ece4; }
        .success-row:last-child { border-bottom: none; }
        .success-key { font-family: 'Jost', sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #bbb; }
        .success-val { font-size: 14px; color: #2c2c2c; }
        .ornament-divider { text-align: center; color: #d4be78; font-size: 16px; letter-spacing: 8px; margin: 6px 0 20px; opacity: 0.6; }
      `}</style>

      <div className="bg-ornament" />
      <div className="bg-ornament-2" />

      <div className="header">
        <div className="logo-eyebrow">✦ Benvenuta ✦</div>
        <div className="logo-name">Helena <em>Hair</em><br />Beauty Mentor</div>
        <div className="logo-sub">Milano · Eccellenza · Stile</div>
      </div>

      {!submitted && (
        <div className="steps-bar">
          <div className="step-item">
            <div className={`step-circle ${step > 1 ? "done" : step === 1 ? "active" : ""}`}>{step > 1 ? "✓" : "1"}</div>
            <div className={`step-label ${step === 1 ? "active" : step > 1 ? "done" : ""}`}>Servizio</div>
          </div>
          <div className={`step-line ${step > 1 ? "done" : ""}`} />
          <div className="step-item">
            <div className={`step-circle ${step > 2 ? "done" : step === 2 ? "active" : ""}`}>{step > 2 ? "✓" : "2"}</div>
            <div className={`step-label ${step === 2 ? "active" : step > 2 ? "done" : ""}`}>Data</div>
          </div>
          <div className={`step-line ${step > 2 ? "done" : ""}`} />
          <div className="step-item">
            <div className={`step-circle ${step === 3 ? "active" : ""}`}>3</div>
            <div className={`step-label ${step === 3 ? "active" : ""}`}>Conferma</div>
          </div>
        </div>
      )}

      <div className="content">

        {/* STEP 1 — Servizi */}
        {step === 1 && (
          <>
            <div className="profile-card">
              <div className="profile-img-wrap">
                <div className="profile-avatar">👩‍🦱</div>
              </div>
              <div className="profile-text">
                <div className="profile-name">Helena</div>
                <div className="profile-role">Hair · Colore · Mentor</div>
                <div className="profile-bio">&quot;Con oltre 10 anni di esperienza, ogni capello è un&apos;opera d&apos;arte unica. La mia passione è farti uscire sentendoti straordinaria.&quot;</div>
                <div className="profile-stars">★★★★★</div>
              </div>
            </div>

            <div className="section-title">Scegli il tuo <em>servizio</em></div>
            <div className="ornament-divider">· · ·</div>
            <div className="section-sub">Seleziona il trattamento che desideri</div>

            {services.length === 0 ? (
              <div className="empty-state">Nessun servizio disponibile al momento.</div>
            ) : (
              services.map((s, i) => {
                const icons = ["✦", "✧", "✦"];
                return (
                  <div key={s.id} className={`service-card ${selectedService?.id === s.id ? "selected" : ""}`} onClick={() => setSelectedService(s)}>
                    <div className="service-icon">{icons[i % icons.length]}</div>
                    <div className="service-info">
                      <div className="service-name">{s.name}</div>
                      <div className="service-desc">{s.description}</div>
                      <div className="service-meta">
                        <span className="service-price">{s.price}</span>
                        <span className="service-dur">⏱ {s.duration}</span>
                      </div>
                    </div>
                    <div className={`service-check ${selectedService?.id === s.id ? "checked" : ""}`}>{selectedService?.id === s.id ? "✓" : ""}</div>
                  </div>
                );
              })
            )}

            <div style={{ marginTop: 8 }} />
            <button className="btn-primary" disabled={!canGoStep2} onClick={() => setStep(2)}>Continua →</button>
          </>
        )}

        {/* STEP 2 — Data e orario */}
        {step === 2 && (
          <>
            <div className="section-title">Scegli <em>data</em> e orario</div>
            <div className="ornament-divider">· · ·</div>
            <div className="section-sub">Seleziona il giorno che preferisci</div>

            {availability.length === 0 ? (
              <div className="empty-state">Nessuna disponibilità al momento.<br />Torna presto per le prossime date!</div>
            ) : (
              <div className="days-scroll">
                {availability.map((d) => {
                  const { day, num, month } = formatDate(d.date);
                  return (
                    <div key={d.date} className={`day-chip ${selectedDay?.date === d.date ? "selected" : ""}`} onClick={() => { setSelectedDay(d); setSelectedSlot(null); }}>
                      <div className="day-name">{day}</div>
                      <div className="day-date">{num}<br /><span style={{ fontSize: 11, opacity: 0.7 }}>{month}</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedDay && (
              <>
                <div className="slots-label">Orari disponibili</div>
                <div className="slots-grid">
                  {selectedDay.slots.map((slot) => (
                    <div key={slot.id} className={`slot-btn ${selectedSlot?.id === slot.id ? "selected" : ""}`} onClick={() => setSelectedSlot(slot)}>
                      {slot.time_slot}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!selectedDay && availability.length > 0 && (
              <div className="empty-state">Seleziona un giorno per vedere gli orari</div>
            )}

            <button className="btn-primary" disabled={!canGoStep3} onClick={() => setStep(3)}>Continua →</button>
            <button className="btn-back" onClick={() => setStep(1)}>← Indietro</button>
          </>
        )}

        {/* STEP 3 — Conferma */}
        {step === 3 && !submitted && (
          <>
            <div className="section-title">Conferma la tua <em>prenotazione</em></div>
            <div className="ornament-divider">· · ·</div>
            <div className="section-sub">Inserisci i tuoi dati per non perdere il posto</div>

            <div className="recap-pill">
              <div className="recap-icon">✦</div>
              <div className="recap-info">
                <div className="recap-service">{selectedService?.name}</div>
                <div className="recap-when">
                  {selectedDay && (() => { const { day, num, month } = formatDate(selectedDay.date); return `${day} ${num} ${month}`; })()} · {selectedSlot?.time_slot} · {selectedService?.price}
                </div>
              </div>
            </div>

            {error && <div className="error-box">⚠️ {error}</div>}

            <div className="form-row">
              <div>
                <label className="form-label">Nome</label>
                <input className="form-input" placeholder="Maria" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Cognome</label>
                <input className="form-input" placeholder="Rossi" value={form.surname} onChange={e => setForm({ ...form, surname: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="maria@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input className="form-input" type="tel" placeholder="+39 333 000 0000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Note e desideri ✦ opzionale</label>
              <textarea className="form-input" placeholder="Raccontami cosa vorresti ottenere..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="privacy-note">
              Confermando accetti che i tuoi dati vengano utilizzati esclusivamente<br />per gestire la tua prenotazione e inviarti promemoria.
            </div>

            <button className="btn-primary" disabled={!canSubmit || submitting} onClick={handleSubmit}>
              {submitting ? "Invio in corso..." : "✦ Conferma Prenotazione"}
            </button>
            <button className="btn-back" onClick={() => setStep(2)}>← Indietro</button>
          </>
        )}

        {/* SUCCESS */}
        {submitted && (
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <div className="success-title">Prenotazione <em>confermata!</em></div>
            <div className="success-msg">Riceverai una email di conferma a breve. Ti ricorderemo l&apos;appuntamento 3 giorni prima.</div>
            <div className="success-card">
              <div className="success-row"><span className="success-key">Servizio</span><span className="success-val">{selectedService?.name}</span></div>
              <div className="success-row"><span className="success-key">Data</span><span className="success-val">{selectedDay && (() => { const { day, num, month } = formatDate(selectedDay.date); return `${day} ${num} ${month}`; })()}</span></div>
              <div className="success-row"><span className="success-key">Orario</span><span className="success-val">{selectedSlot?.time_slot}</span></div>
              <div className="success-row"><span className="success-key">Nome</span><span className="success-val">{form.name} {form.surname}</span></div>
              <div className="success-row"><span className="success-key">Prezzo</span><span className="success-val" style={{ color: "#b7a05a" }}>{selectedService?.price}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
