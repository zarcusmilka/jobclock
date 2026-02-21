import { LitElement, html, css } from "https://unpkg.com/lit@3.2.0/index.js?module";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fmtDate = (dStr) => {
  if (!dStr) return "";
  const [y, m, d] = dStr.split("-");
  return `${d}.${m}.${y}`;
};

class JobClockCard extends (customElements.get("ha-panel-lovelace") ? LitElement : HTMLElement) {
  static get properties() {
    console.info("%c JobClock Card v2.0.0 Loaded (Tailwind) ", "color: white; background: #6366f1; font-weight: bold;");
    return {
      hass: {},
      config: {},
      _data: { type: Object },
      _currentMonth: { type: Object },
      _detailOpen: { type: Boolean },
      _detailDate: { type: String },
      _detailData: { type: Object },
      _editorOpen: { type: Boolean },
      _editSessions: { type: Array },
      _editType: { type: String },
      _addFormOpen: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._data = {};
    this._currentMonth = new Date();
    this._detailOpen = false;
    this._editorOpen = false;
    this._addFormOpen = false;
    this._editSessions = [];
    this._editType = "work";
  }

  setConfig(config) {
    this.config = config;
  }

  updated(changedProps) {
    if (changedProps.has("hass") && this.hass && this.config?.entity) {
      this.fetchData();
    }
  }

  async fetchData() {
    const start = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), 1);
    const end = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() + 1, 0);

    try {
      const res = await this.hass.callWS({
        type: "jobclock/get_data",
        entry_id: this.hass.states[this.config.entity].attributes.entry_id,
        start_date: formatDateLocal(start),
        end_date: formatDateLocal(end)
      });
      const newData = {};
      res.forEach(d => newData[d.date] = d);
      this._data = newData;

      if (this._detailOpen && this._detailDate) {
        this._detailData = this._data[this._detailDate];
      }
    } catch (e) {
      console.error("Fetch failed", e);
    }
  }

  changeMonth(dir) {
    const d = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), 1);
    d.setMonth(d.getMonth() + dir);
    this._currentMonth = d;
    this.fetchData();
  }

  openDayDetail(date, data) {
    this._detailDate = date;
    this._detailData = data || { duration: 0, type: "work", sessions: [] };
    this._editSessions = JSON.parse(JSON.stringify(this._detailData.sessions || []));
    this._editType = this._detailData.type || "work";
    this._detailOpen = true;
    this._editorOpen = true; // Always open in edit mode
    this._addFormOpen = false;
  }

  closeDayDetail() {
    this._detailOpen = false;
  }

  async _manualToggle() {
    const stateObj = this.hass.states[this.config.entity];
    const isWorking = stateObj.attributes.is_working;
    await this.hass.callWS({
      type: "jobclock/manual_toggle",
      entry_id: stateObj.attributes.entry_id,
      action: isWorking ? "stop" : "start"
    });
    this.fetchData();
  }

  async _handleModeChange(mode) {
    const stateObj = this.hass.states[this.config.entity];
    const switchEntity = stateObj.attributes.switch_entity;
    if (!switchEntity) return;

    const isHO = this.hass.states[switchEntity]?.state === "on";
    if ((mode === 'home' && !isHO) || (mode === 'office' && isHO)) {
      await this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity });
    }
  }

  async _autoSave() {
    const stateObj = this.hass.states[this.config.entity];
    await this.hass.callWS({
      type: "jobclock/update_sessions",
      entry_id: stateObj.attributes.entry_id,
      date: this._detailDate,
      sessions: this._editSessions.map(s => ({
        ...s,
        duration: (new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000
      })).filter(s => s.duration >= 0),
      status_type: this._editType
    });
    this.fetchData();
  }

  deleteSession(idx) {
    this._editSessions = this._editSessions.filter((_, i) => i !== idx);
    this._autoSave();
  }

  addSession(startStr, endStr, location) {
    const dStr = this._detailDate;
    const start = new Date(`${dStr}T${startStr}:00`);
    const end = new Date(`${dStr}T${endStr}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Ungültige Zeit");
      return;
    }

    const dur = (end.getTime() - start.getTime()) / 1000;
    this._editSessions.push({
      start: start.toISOString(),
      end: end.toISOString(),
      duration: dur,
      location: location || "office"
    });
    this._addFormOpen = false;
    this.requestUpdate();
    this._autoSave();
  }

  exportToCSV() {
    const rows = [["Datum", "Dauer (Sek)", "Dauer (h)", "Typ"]];
    Object.values(this._data).forEach(d => {
      rows.push([d.date, d.duration, (d.duration / 3600).toFixed(2), d.type]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobclock_export_${formatDateLocal(new Date())}.csv`;
    a.click();
  }

  formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  formatShortTime(totalSeconds) {
    return (totalSeconds / 3600).toFixed(1) + 'h';
  }

  _showSettings() {
    const entityId = this.config.entity;
    const event = new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this.config) return html`<div class="p-4 text-white">Lade Home Assistant Daten...</div>`;
    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) return html`<div class="p-4 text-red-500">Sensor nicht gefunden</div>`;

    const isWorking = stateObj.attributes.is_working;
    const sessionStart = stateObj.attributes.session_start;
    const switchEntity = stateObj.attributes.switch_entity;
    const isHO = switchEntity ? this.hass.states[switchEntity]?.state === "on" : false;
    const workMode = isHO ? 'home' : 'office';

    // Timer Logic
    let currentSessionDuration = 0;
    if (isWorking && sessionStart) {
      currentSessionDuration = Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000);
    }
    const todayData = this._data[formatDateLocal(new Date())] || { duration: 0, target: 0 };
    const timeWorked = (todayData.duration || 0) + currentSessionDuration;
    const targetTime = todayData.target || (8 * 3600); // fallback 8h

    // Monthly Stats
    let totalSeconds = 0;
    let totalTarget = 0;
    Object.values(this._data).forEach(d => {
      totalSeconds += d.duration || 0;
      totalTarget += d.target || 0;
    });

    if (isWorking) {
      // add current session to monthly total
      totalSeconds += currentSessionDuration;
    }

    const dynamicMonthlyStats = {
      ist: totalSeconds / 3600,
      soll: totalTarget / 3600,
      saldo: (totalSeconds - totalTarget) / 3600
    };

    // UI State variables
    const isActive = isWorking;

    // Orb Berechnungen für den SVG-Kreis
    const percentage = Math.min((timeWorked / targetTime) * 100, 100);
    const isOvertime = timeWorked > targetTime;
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const todayFormatted = new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    const monthName = this._currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

    return html`
      <div class="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-8 font-sans flex justify-center">
        <div class="w-full max-w-md space-y-6">
          
          <!-- HEADER -->
          <div class="flex justify-between items-center mb-2">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold tracking-tight text-white">JobClock</h1>
              </div>
              <p class="text-neutral-400 text-sm mt-0.5">Heute, ${todayFormatted}</p>
            </div>
            <div class="flex gap-2">
                <button @click="${this.exportToCSV}" class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <button @click="${this._showSettings}" class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
          </div>

          <!-- MAIN CARD (ORB & CONTROLS) -->
          <div class="bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-neutral-700/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-row items-center gap-6">
            
            ${isActive ? html`<div class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${workMode === 'office' ? 'bg-blue-500' : 'bg-purple-500'}"></div>` : ''}

            <!-- LEFT: ORB BUTTON -->
            <button 
              @click="${this._manualToggle}"
              class="relative w-40 h-40 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none group z-10"
            >
              ${isActive ? html`<div class="absolute inset-1.5 rounded-full animate-ping opacity-[0.15] ${workMode === 'office' ? 'bg-blue-400' : 'bg-purple-400'}"></div>` : ''}
              <div class="absolute inset-3 bg-neutral-900/80 rounded-full shadow-inner border border-white/5"></div>

              ${isActive ? html`
              <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="80" cy="80" r="${radius}" class="stroke-neutral-800" stroke-width="10" fill="transparent" />
                <circle
                  cx="80" cy="80" r="${radius}"
                  class="transition-all duration-1000 ease-out ${isOvertime ? 'stroke-amber-400' : (workMode === 'office' ? 'stroke-blue-500' : 'stroke-purple-500')}"
                  stroke-width="10" stroke-linecap="round" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                  filter="url(#glow)"
                />
              </svg>
              ` : html`
              <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                <circle cx="80" cy="80" r="${radius}" class="stroke-neutral-800" stroke-width="10" fill="transparent" />
                <circle
                  cx="80" cy="80" r="${radius}"
                  class="transition-all duration-1000 ease-out stroke-neutral-600"
                  stroke-width="10" stroke-linecap="round" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                />
              </svg>
              `}

              <div class="absolute flex flex-col items-center justify-center text-center mt-1.5 z-30">
                <div class="mb-1 transition-colors duration-300 ${isActive ? (workMode === 'office' ? 'text-blue-400' : 'text-purple-400') : 'text-neutral-500 group-hover:text-purple-400'}">
                   ${isActive ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>` : html`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`}
                </div>
                <span class="text-2xl font-light tracking-tighter mb-0.5 font-mono transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-300'}">
                  ${this.formatTime(timeWorked)}
                </span>
                <div class="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
                  Soll: ${this.formatShortTime(targetTime)}
                </div>
              </div>
            </button>

            <!-- RIGHT: CONTROLS & STATS -->
            <div class="flex-1 w-full flex flex-col justify-center gap-3.5 z-10">
              
              ${switchEntity ? html`
              <div class="relative flex w-full bg-neutral-900/80 rounded-xl p-1 border border-neutral-700/50 shadow-inner">
                <div class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out shadow-sm ${workMode === 'office' ? 'translate-x-[calc(100%+4px)] bg-blue-500/20 border border-blue-500/30' : 'translate-x-0 bg-purple-500/20 border border-purple-500/30'
        } ${!isActive ? 'opacity-50 grayscale' : ''}"></div>

                <button 
                  @click="${() => this._handleModeChange('home')}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${workMode === 'home' ? (isActive ? 'text-purple-300' : 'text-neutral-300') : 'text-neutral-500 hover:text-neutral-300'
        }"
                >
                  Home
                </button>
                <button 
                  @click="${() => this._handleModeChange('office')}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${workMode === 'office' ? (isActive ? 'text-blue-300' : 'text-neutral-300') : 'text-neutral-500 hover:text-neutral-300'
        }"
                >
                  Büro
                </button>
              </div>
              ` : ''}

              <!-- MONTHLY SUMMARY -->
              <div class="mt-2 flex flex-col gap-3 px-1">
                <div class="flex justify-between items-end">
                  <div>
                    <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                      Monat
                    </div>
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-xl font-light text-white font-mono">${dynamicMonthlyStats.ist.toFixed(1)}h</span>
                      <span class="text-xs font-medium text-neutral-500">/ ${dynamicMonthlyStats.soll.toFixed(1)}h</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold ${dynamicMonthlyStats.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      }">
                    ${dynamicMonthlyStats.saldo > 0 ? '+' : ''}${dynamicMonthlyStats.saldo.toFixed(1)}h
                  </div>
                </div>
                <div class="w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden shadow-inner border border-neutral-700/30">
                  <div 
                    class="h-full rounded-full transition-all duration-1000 ${isActive ? (workMode === 'office' ? 'bg-blue-400' : 'bg-purple-400') : 'bg-neutral-500'}"
                    style="width: ${Math.min((dynamicMonthlyStats.ist / Math.max(dynamicMonthlyStats.soll, 1)) * 100, 100)}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- CALENDAR -->
          <div class="calendar mt-6 bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/30 p-4">
            <div class="cal-nav flex justify-between items-center mb-4">
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span class="cal-title font-bold text-white">${monthName}</span>
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(1)}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="cal-grid grid grid-cols-7 gap-1">
              ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="cal-hdr text-center text-xs font-bold text-neutral-500 mb-2">${d}</div>`)}
              ${this.renderCalendarDays(this._currentMonth)}
            </div>
          </div>

        </div>
        
        ${this._detailOpen ? this._renderDayDetail() : ""}

      </div>
    `;
  }

  renderCalendarDays(date) {
    const days = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const today = formatDateLocal(new Date());

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    for (let i = 0; i < startOffset; i++) days.push(html`<div class="cal-empty aspect-square"></div>`);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dStr = formatDateLocal(new Date(date.getFullYear(), date.getMonth(), i));
      const dd = this._data[dStr];
      const isToday = dStr === today;
      const isWork = dd?.type === 'work' || !dd?.type;
      const target = dd?.target || 0;
      const duration = dd?.duration || 0;

      let bgCls = "bg-white/5 hover:bg-white/10";
      let borderCls = isToday ? "border-2 border-primary" : "border border-transparent";

      if (isToday) {
        bgCls = "bg-indigo-500/10";
        borderCls = "border-2 border-indigo-500";
      }

      let timeColor = "text-neutral-400";
      if (duration > 0) {
        timeColor = duration >= target ? "text-emerald-400" : "text-rose-400";
      }

      days.push(html`
          <div class="cal-cell aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${bgCls} ${borderCls}" @click=${() => this.openDayDetail(dStr, dd)}>
            <span class="text-sm font-bold ${timeColor}">${i}</span>
            ${dd?.duration > 0 || (dd?.type && dd?.type !== 'work') ? html`
              <span class="text-[10px] font-semibold ${timeColor}">
                ${dd?.type === 'vacation' ? html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 22 20-20"/><path d="m14 22 8-8"/><path d="M4 12a8 8 0 0 0 8 8"/><path d="M8 8a8 8 0 0 0 8 8"/></svg>` :
            dd?.type === 'sick' ? html`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>` :
              ((dd?.duration || 0) / 3600).toFixed(1) + 'h'}
              </span>
            ` : ""}
          </div>
        `);
    }

    const totalCells = days.length;
    const remaining = 42 - totalCells;
    for (let i = 0; i < remaining; i++) {
      days.push(html`<div class="cal-empty aspect-square"></div>`);
    }

    return days;
  }

  _renderDayDetail() {
    const dd = this._detailData;
    const sessions = this._editSessions;
    const totalSeks = sessions.reduce((sum, s) => {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      return sum + (isNaN(start) || isNaN(end) ? 0 : (end - start) / 1000);
    }, 0);
    const totalH = (totalSeks / 3600).toFixed(2);
    const targetH = ((dd?.target || 0) / 3600).toFixed(1);

    return html`
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" @click=${this.closeDayDetail}>
        <div class="bg-neutral-900 border border-neutral-700/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl" @click=${e => e.stopPropagation()}>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white">${fmtDate(this._detailDate)}</h3>
            <button class="text-neutral-400 hover:text-white transition" @click=${this.closeDayDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div class="mb-6">
            <div class="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-3">Aufgezeichnete Zeiten</div>
            <div class="flex flex-col gap-2">
              ${sessions.map((s, i) => html`
                <div class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span class="text-[10px] text-indigo-400 font-bold w-4">#${i + 1}</span>
                  <div class="flex items-center gap-1 flex-1">
                      <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" .value=${new Date(s.start).toTimeString().slice(0, 5)} @change=${e => { s.start = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); this._autoSave(); }}>
                      <span class="text-neutral-500">—</span>
                      <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" .value=${new Date(s.end).toTimeString().slice(0, 5)} @change=${e => { s.end = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); this._autoSave(); }}>
                  </div>
                  <select class="bg-transparent border-none text-white text-sm cursor-pointer outline-none" .value=${s.location || 'office'} @change=${e => { s.location = e.target.value; this.requestUpdate(); this._autoSave(); }}>
                    <option class="bg-neutral-800" value="office">Office</option>
                    <option class="bg-neutral-800" value="home">Home</option>
                  </select>
                  <button class="text-rose-400 p-1 hover:bg-rose-500/20 rounded-lg transition" @click=${() => this.deleteSession(i)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              `)}
              ${sessions.length === 0 && !this._addFormOpen ? html`<div class="text-neutral-500 text-sm text-center py-4">Keine Einträge</div>` : ""}
              
              ${this._addFormOpen ? html`
                <div class="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mt-2">
                    <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" id="new-start" value="08:00">
                    <span class="text-neutral-500">—</span>
                    <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" id="new-end" value="16:00">
                    <select id="new-loc" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm"><option value="office">Office</option><option value="home">Home</option></select>
                    <button class="text-emerald-400 p-1 hover:bg-emerald-500/20 rounded-lg transition ml-auto" @click=${() => this.addSession(this.querySelector('#new-start').value, this.querySelector('#new-end').value, this.querySelector('#new-loc').value)}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                    </button>
                </div>
              ` : html`
                <button class="w-full border border-dashed border-neutral-700 text-neutral-400 p-2 rounded-xl text-sm font-semibold hover:text-white hover:border-indigo-400 transition flex items-center justify-center gap-2 mt-2" @click=${() => this._addFormOpen = true}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Eintrag hinzufügen
                </button>
              `}
            </div>

            <div class="border-t border-neutral-700/50 mt-6 pt-5 flex flex-col gap-3">
              <div class="flex justify-between items-center text-sm">
                 <span class="text-neutral-400">Arbeitszeit</span>
                 <span class="font-bold text-white">${totalH}h</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                 <span class="text-neutral-400">Soll</span>
                 <span class="font-bold text-white">${targetH}h</span>
              </div>
              <div class="flex justify-between items-center text-sm mt-2">
                <span class="text-neutral-400">Typ</span>
                <select class="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm font-semibold outline-none" .value=${this._editType} @change=${e => { this._editType = e.target.value; this._autoSave(); }}>
                    <option value="work">Arbeit</option>
                    <option value="vacation">Urlaub</option>
                    <option value="sick">Krank</option>
                </select>
              </div>
            </div>
          </div>

          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%}@media (min-width:640px){.container{max-width:640px}}@media (min-width:768px){.container{max-width:768px}}@media (min-width:1024px){.container{max-width:1024px}}@media (min-width:1280px){.container{max-width:1280px}}@media (min-width:1536px){.container{max-width:1536px}}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.not-sr-only{position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;white-space:normal}.pointer-events-none{pointer-events:none}.pointer-events-auto{pointer-events:auto}.visible{visibility:visible}.invisible{visibility:hidden}.collapse{visibility:collapse}.static{position:static}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.sticky{position:sticky}.inset-0{inset:0}.inset-1\\.5{inset:.375rem}.inset-3{inset:.75rem}.-left-16{left:-4rem}.-top-16{top:-4rem}.bottom-1{bottom:.25rem}.top-1{top:.25rem}.isolate{isolation:isolate}.isolation-auto{isolation:auto}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-50{z-index:50}.z-\\[1000\\]{z-index:1000}.order-none{order:0}.col-start-2{grid-column-start:2}.row-span-2{grid-row:span 2/span 2}.row-start-1{grid-row-start:1}.float-start{float:inline-start}.float-end{float:inline-end}.float-right{float:right}.float-left{float:left}.float-none{float:none}.clear-start{clear:inline-start}.clear-end{clear:inline-end}.clear-left{clear:left}.clear-right{clear:right}.clear-both{clear:both}.clear-none{clear:none}.mx-auto{margin-left:auto;margin-right:auto}.mb-0\\.5{margin-bottom:.125rem}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-3{margin-bottom:.75rem}.mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.ml-auto{margin-left:auto}.mt-0\\.5{margin-top:.125rem}.mt-1\\.5{margin-top:.375rem}.mt-2{margin-top:.5rem}.mt-6{margin-top:1.5rem}.box-border{box-sizing:border-box}.box-content{box-sizing:content-box}.line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1}.block{display:block}.inline-block{display:inline-block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.inline-table{display:inline-table}.table-caption{display:table-caption}.table-cell{display:table-cell}.table-column{display:table-column}.table-column-group{display:table-column-group}.table-footer-group{display:table-footer-group}.table-header-group{display:table-header-group}.table-row-group{display:table-row-group}.table-row{display:table-row}.flow-root{display:flow-root}.grid{display:grid}.inline-grid{display:inline-grid}.contents{display:contents}.list-item{display:list-item}.hidden{display:none}.aspect-square{aspect-ratio:1/1}.size-auto{width:auto;height:auto}.h-1\\.5{height:.375rem}.h-40{height:10rem}.h-64{height:16rem}.h-auto{height:auto}.h-full{height:100%}.h-px{height:1px}.h-screen{height:100vh}.max-h-none{max-height:none}.max-h-screen{max-height:100vh}.min-h-screen{min-height:100vh}.w-4{width:1rem}.w-40{width:10rem}.w-64{width:16rem}.w-\\[72px\\]{width:72px}.w-\\[calc\\(50\\%-4px\\)\\]{width:calc(50% - 4px)}.w-auto{width:auto}.w-fit{width:-moz-fit-content;width:fit-content}.w-full{width:100%}.w-screen{width:100vw}.max-w-md{max-width:28rem}.max-w-none{max-width:none}.max-w-sm{max-width:24rem}.flex-1{flex:1 1 0%}.flex-auto{flex:1 1 auto}.flex-initial{flex:0 1 auto}.flex-none{flex:none}.flex-shrink{flex-shrink:1}.flex-shrink-0{flex-shrink:0}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.grow{flex-grow:1}.basis-auto{flex-basis:auto}.basis-full{flex-basis:100%}.table-auto{table-layout:auto}.table-fixed{table-layout:fixed}.caption-top{caption-side:top}.caption-bottom{caption-side:bottom}.border-collapse{border-collapse:collapse}.border-separate{border-collapse:separate}.translate-x-0{--tw-translate-x:0px}.translate-x-0,.translate-x-\\[calc\\(100\\%\\+4px\\)\\]{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.translate-x-\\[calc\\(100\\%\\+4px\\)\\]{--tw-translate-x:calc(100% + 4px)}.-rotate-90{--tw-rotate:-90deg}.-rotate-90,.transform,.transform-cpu{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.transform-gpu{transform:translate3d(var(--tw-translate-x),var(--tw-translate-y),0) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.transform-none{transform:none}@keyframes ping{75%,to{transform:scale(2);opacity:0}}.animate-ping{animation:ping 1s cubic-bezier(0,0,.2,1) infinite}.cursor-default{cursor:default}.cursor-pointer{cursor:pointer}.touch-pinch-zoom{--tw-pinch-zoom:pinch-zoom;touch-action:var(--tw-pan-x) var(--tw-pan-y) var(--tw-pinch-zoom)}.select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}.resize-none{resize:none}.resize-y{resize:vertical}.resize-x{resize:horizontal}.resize{resize:both}.snap-none{scroll-snap-type:none}.snap-mandatory{--tw-scroll-snap-strictness:mandatory}.snap-proximity{--tw-scroll-snap-strictness:proximity}.snap-start{scroll-snap-align:start}.snap-end{scroll-snap-align:end}.snap-center{scroll-snap-align:center}.snap-align-none{scroll-snap-align:none}.snap-normal{scroll-snap-stop:normal}.snap-always{scroll-snap-stop:always}.list-inside{list-style-position:inside}.list-outside{list-style-position:outside}.appearance-none{-webkit-appearance:none;-moz-appearance:none;appearance:none}.appearance-auto{-webkit-appearance:auto;-moz-appearance:auto;appearance:auto}.grid-flow-row{grid-auto-flow:row}.grid-flow-col{grid-auto-flow:column}.grid-flow-dense{grid-auto-flow:dense}.grid-flow-row-dense{grid-auto-flow:row dense}.grid-flow-col-dense{grid-auto-flow:column dense}.auto-rows-min{grid-auto-rows:min-content}.grid-cols-7{grid-template-columns:repeat(7,minmax(0,1fr))}.flex-row{flex-direction:row}.flex-row-reverse{flex-direction:row-reverse}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-wrap{flex-wrap:wrap}.flex-wrap-reverse{flex-wrap:wrap-reverse}.flex-nowrap{flex-wrap:nowrap}.place-content-center{place-content:center}.place-content-start{place-content:start}.place-content-end{place-content:end}.place-content-between{place-content:space-between}.place-content-around{place-content:space-around}.place-content-evenly{place-content:space-evenly}.place-content-baseline{place-content:baseline}.place-content-stretch{place-content:stretch}.place-items-start{place-items:start}.place-items-end{place-items:end}.place-items-center{place-items:center}.place-items-baseline{place-items:baseline}.place-items-stretch{place-items:stretch}.content-normal{align-content:normal}.content-center{align-content:center}.content-start{align-content:flex-start}.content-end{align-content:flex-end}.content-between{align-content:space-between}.content-around{align-content:space-around}.content-evenly{align-content:space-evenly}.content-baseline{align-content:baseline}.content-stretch{align-content:stretch}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.items-center{align-items:center}.items-baseline{align-items:baseline}.items-stretch{align-items:stretch}.justify-normal{justify-content:normal}.justify-start{justify-content:flex-start}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.justify-around{justify-content:space-around}.justify-evenly{justify-content:space-evenly}.justify-stretch{justify-content:stretch}.justify-items-start{justify-items:start}.justify-items-end{justify-items:end}.justify-items-center{justify-items:center}.justify-items-stretch{justify-items:stretch}.gap-1{gap:.25rem}.gap-1\\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-3\\.5{gap:.875rem}.gap-6{gap:1.5rem}.space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1.5rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1.5rem*var(--tw-space-y-reverse))}.space-y-reverse>:not([hidden])~:not([hidden]){--tw-space-y-reverse:1}.space-x-reverse>:not([hidden])~:not([hidden]){--tw-space-x-reverse:1}.divide-x>:not([hidden])~:not([hidden]){--tw-divide-x-reverse:0;border-right-width:calc(1px*var(--tw-divide-x-reverse));border-left-width:calc(1px*(1 - var(--tw-divide-x-reverse)))}.divide-y>:not([hidden])~:not([hidden]){--tw-divide-y-reverse:0;border-top-width:calc(1px*(1 - var(--tw-divide-y-reverse)));border-bottom-width:calc(1px*var(--tw-divide-y-reverse))}.divide-y-reverse>:not([hidden])~:not([hidden]){--tw-divide-y-reverse:1}.divide-x-reverse>:not([hidden])~:not([hidden]){--tw-divide-x-reverse:1}.place-self-auto{place-self:auto}.place-self-start{place-self:start}.place-self-end{place-self:end}.place-self-center{place-self:center}.place-self-stretch{place-self:stretch}.self-auto{align-self:auto}.self-start{align-self:flex-start}.self-end{align-self:flex-end}.self-center{align-self:center}.self-stretch{align-self:stretch}.self-baseline{align-self:baseline}.justify-self-auto{justify-self:auto}.justify-self-start{justify-self:start}.justify-self-end{justify-self:end}.justify-self-center{justify-self:center}.justify-self-stretch{justify-self:stretch}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.overflow-x-hidden{overflow-x:hidden}.scroll-auto{scroll-behavior:auto}.scroll-smooth{scroll-behavior:smooth}.truncate{overflow:hidden;white-space:nowrap}.overflow-ellipsis,.text-ellipsis,.truncate{text-overflow:ellipsis}.text-clip{text-overflow:clip}.hyphens-none{-webkit-hyphens:none;hyphens:none}.hyphens-manual{-webkit-hyphens:manual;hyphens:manual}.hyphens-auto{-webkit-hyphens:auto;hyphens:auto}.whitespace-normal{white-space:normal}.whitespace-nowrap{white-space:nowrap}.whitespace-pre{white-space:pre}.whitespace-pre-line{white-space:pre-line}.whitespace-pre-wrap{white-space:pre-wrap}.whitespace-break-spaces{white-space:break-spaces}.text-wrap{text-wrap:wrap}.text-nowrap{text-wrap:nowrap}.text-balance{text-wrap:balance}.text-pretty{text-wrap:pretty}.break-normal{overflow-wrap:normal;word-break:normal}.break-words{overflow-wrap:break-word}.break-all{word-break:break-all}.break-keep{word-break:keep-all}.rounded-2xl{border-radius:1rem}.rounded-3xl{border-radius:1.5rem}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:.5rem}.rounded-xl{border-radius:.75rem}.border{border-width:1px}.border-0{border-width:0}.border-2{border-width:2px}.border-x{border-left-width:1px;border-right-width:1px}.border-y{border-top-width:1px}.border-b,.border-y{border-bottom-width:1px}.border-e{border-inline-end-width:1px}.border-l{border-left-width:1px}.border-r{border-right-width:1px}.border-s{border-inline-start-width:1px}.border-t{border-top-width:1px}.border-solid{border-style:solid}.border-dashed{border-style:dashed}.border-dotted{border-style:dotted}.border-double{border-style:double}.border-hidden{border-style:hidden}.border-none{border-style:none}.border-blue-500\\/30{border-color:rgba(59,130,246,.3)}.border-emerald-500\\/20{border-color:rgba(16,185,129,.2)}.border-indigo-500{--tw-border-opacity:1;border-color:rgb(99 102 241/var(--tw-border-opacity,1))}.border-indigo-500\\/30{border-color:rgba(99,102,241,.3)}.border-neutral-700{--tw-border-opacity:1;border-color:rgb(64 64 64/var(--tw-border-opacity,1))}.border-neutral-700\\/30{border-color:rgba(64,64,64,.3)}.border-neutral-700\\/50{border-color:rgba(64,64,64,.5)}.border-purple-500\\/30{border-color:rgba(168,85,247,.3)}.border-rose-500\\/20{border-color:rgba(244,63,94,.2)}.border-transparent{border-color:transparent}.border-white\\/10{border-color:hsla(0,0%,100%,.1)}.border-white\\/5{border-color:hsla(0,0%,100%,.05)}.bg-black\\/80{background-color:rgba(0,0,0,.8)}.bg-blue-400{--tw-bg-opacity:1;background-color:rgb(96 165 250/var(--tw-bg-opacity,1))}.bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity,1))}.bg-blue-500\\/20{background-color:rgba(59,130,246,.2)}.bg-emerald-500\\/10{background-color:rgba(16,185,129,.1)}.bg-indigo-500\\/10{background-color:rgba(99,102,241,.1)}.bg-neutral-500{--tw-bg-opacity:1;background-color:rgb(115 115 115/var(--tw-bg-opacity,1))}.bg-neutral-800{--tw-bg-opacity:1;background-color:rgb(38 38 38/var(--tw-bg-opacity,1))}.bg-neutral-900{--tw-bg-opacity:1;background-color:rgb(23 23 23/var(--tw-bg-opacity,1))}.bg-neutral-900\\/80{background-color:hsla(0,0%,9%,.8)}.bg-purple-400{--tw-bg-opacity:1;background-color:rgb(192 132 252/var(--tw-bg-opacity,1))}.bg-purple-500{--tw-bg-opacity:1;background-color:rgb(168 85 247/var(--tw-bg-opacity,1))}.bg-purple-500\\/20{background-color:rgba(168,85,247,.2)}.bg-rose-500\\/10{background-color:rgba(244,63,94,.1)}.bg-transparent{background-color:transparent}.bg-white\\/5{background-color:hsla(0,0%,100%,.05)}.bg-gradient-to-b{background-image:linear-gradient(to bottom,var(--tw-gradient-stops))}.bg-none{background-image:none}.from-neutral-800\\/80{--tw-gradient-from:rgba(38,38,38,.8) var(--tw-gradient-from-position);--tw-gradient-to:rgba(38,38,38,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-neutral-900\\/80{--tw-gradient-to:hsla(0,0%,9%,.8) var(--tw-gradient-to-position)}.decoration-slice{-webkit-box-decoration-break:slice;box-decoration-break:slice}.decoration-clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}.box-decoration-slice{-webkit-box-decoration-break:slice;box-decoration-break:slice}.box-decoration-clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}.bg-auto{background-size:auto}.bg-contain{background-size:contain}.bg-cover{background-size:cover}.bg-fixed{background-attachment:fixed}.bg-local{background-attachment:local}.bg-scroll{background-attachment:scroll}.bg-clip-border{background-clip:border-box}.bg-clip-padding{background-clip:padding-box}.bg-clip-content{background-clip:content-box}.bg-clip-text{-webkit-background-clip:text;background-clip:text}.bg-bottom{background-position:bottom}.bg-center{background-position:50%}.bg-left{background-position:0}.bg-left-bottom{background-position:0 100%}.bg-left-top{background-position:0 0}.bg-right{background-position:100%}.bg-right-bottom{background-position:100% 100%}.bg-right-top{background-position:100% 0}.bg-top{background-position:top}.bg-repeat{background-repeat:repeat}.bg-no-repeat{background-repeat:no-repeat}.bg-repeat-x{background-repeat:repeat-x}.bg-repeat-y{background-repeat:repeat-y}.bg-repeat-round{background-repeat:round}.bg-repeat-space{background-repeat:space}.bg-origin-border{background-origin:border-box}.bg-origin-padding{background-origin:padding-box}.bg-origin-content{background-origin:content-box}.fill-none{fill:none}.stroke-amber-400{stroke:#fbbf24}.stroke-blue-500{stroke:#3b82f6}.stroke-neutral-600{stroke:#525252}.stroke-neutral-800{stroke:#262626}.stroke-none{stroke:none}.stroke-purple-500{stroke:#a855f7}.object-contain{-o-object-fit:contain;object-fit:contain}.object-cover{-o-object-fit:cover;object-fit:cover}.object-fill{-o-object-fit:fill;object-fit:fill}.object-none{-o-object-fit:none;object-fit:none}.object-scale-down{-o-object-fit:scale-down;object-fit:scale-down}.object-left-bottom{-o-object-position:left bottom;object-position:left bottom}.object-left-top{-o-object-position:left top;object-position:left top}.object-right-bottom{-o-object-position:right bottom;object-position:right bottom}.object-right-top{-o-object-position:right top;object-position:right top}.p-1{padding:.25rem}.p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-6{padding:1.5rem}.px-1{padding-left:.25rem;padding-right:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-3{padding-left:.75rem;padding-right:.75rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\\.5{padding-top:.375rem;padding-bottom:.375rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-4{padding-top:1rem;padding-bottom:1rem}.pt-5{padding-top:1.25rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.text-justify{text-align:justify}.text-start{text-align:start}.text-end{text-align:end}.align-baseline{vertical-align:baseline}.align-top{vertical-align:top}.align-middle{vertical-align:middle}.align-bottom{vertical-align:bottom}.align-text-top{vertical-align:text-top}.align-text-bottom{vertical-align:text-bottom}.align-sub{vertical-align:sub}.align-super{vertical-align:super}.font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.font-sans{font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.text-2xl{font-size:1.5rem;line-height:2rem}.text-\\[10px\\]{font-size:10px}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-light{font-weight:300}.font-medium{font-weight:500}.font-semibold{font-weight:600}.uppercase{text-transform:uppercase}.lowercase{text-transform:lowercase}.capitalize{text-transform:capitalize}.normal-case{text-transform:none}.italic{font-style:italic}.not-italic{font-style:normal}.normal-nums{font-variant-numeric:normal}.ordinal{--tw-ordinal:ordinal}.ordinal,.slashed-zero{font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.slashed-zero{--tw-slashed-zero:slashed-zero}.lining-nums{--tw-numeric-figure:lining-nums}.lining-nums,.oldstyle-nums{font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.oldstyle-nums{--tw-numeric-figure:oldstyle-nums}.proportional-nums{--tw-numeric-spacing:proportional-nums}.proportional-nums,.tabular-nums{font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.tabular-nums{--tw-numeric-spacing:tabular-nums}.diagonal-fractions{--tw-numeric-fraction:diagonal-fractions}.diagonal-fractions,.stacked-fractions{font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.stacked-fractions{--tw-numeric-fraction:stacked-fractions}.leading-none{line-height:1}.tracking-tight{letter-spacing:-.025em}.tracking-tighter{letter-spacing:-.05em}.tracking-wider{letter-spacing:.05em}.tracking-widest{letter-spacing:.1em}.text-blue-300{--tw-text-opacity:1;color:rgb(147 197 253/var(--tw-text-opacity,1))}.text-blue-400{--tw-text-opacity:1;color:rgb(96 165 250/var(--tw-text-opacity,1))}.text-emerald-400{--tw-text-opacity:1;color:rgb(52 211 153/var(--tw-text-opacity,1))}.text-indigo-400{--tw-text-opacity:1;color:rgb(129 140 248/var(--tw-text-opacity,1))}.text-neutral-100{--tw-text-opacity:1;color:rgb(245 245 245/var(--tw-text-opacity,1))}.text-neutral-300{--tw-text-opacity:1;color:rgb(212 212 212/var(--tw-text-opacity,1))}.text-neutral-400{--tw-text-opacity:1;color:rgb(163 163 163/var(--tw-text-opacity,1))}.text-neutral-500{--tw-text-opacity:1;color:rgb(115 115 115/var(--tw-text-opacity,1))}.text-purple-300{--tw-text-opacity:1;color:rgb(216 180 254/var(--tw-text-opacity,1))}.text-purple-400{--tw-text-opacity:1;color:rgb(192 132 252/var(--tw-text-opacity,1))}.text-red-500{--tw-text-opacity:1;color:rgb(239 68 68/var(--tw-text-opacity,1))}.text-rose-400{--tw-text-opacity:1;color:rgb(251 113 133/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.underline{text-decoration-line:underline}.overline{text-decoration-line:overline}.line-through{text-decoration-line:line-through}.no-underline{text-decoration-line:none}.decoration-solid{text-decoration-style:solid}.decoration-double{text-decoration-style:double}.decoration-dotted{text-decoration-style:dotted}.decoration-dashed{text-decoration-style:dashed}.decoration-wavy{text-decoration-style:wavy}.decoration-auto{text-decoration-thickness:auto}.decoration-from-font{text-decoration-thickness:from-font}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.accent-auto{accent-color:auto}.opacity-20{opacity:.2}.opacity-50{opacity:.5}.opacity-\\[0\\.15\\]{opacity:.15}.mix-blend-plus-darker{mix-blend-mode:plus-darker}.mix-blend-plus-lighter{mix-blend-mode:plus-lighter}.shadow-2xl{--tw-shadow:0 25px 50px -12px rgba(0,0,0,.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color)}.shadow-2xl,.shadow-\\[0_8px_30px_rgba\\(0\\2c 0\\2c 0\\2c 0\\.2\\)\\]{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-\\[0_8px_30px_rgba\\(0\\2c 0\\2c 0\\2c 0\\.2\\)\\]{--tw-shadow:0 8px 30px rgba(0,0,0,.2);--tw-shadow-colored:0 8px 30px var(--tw-shadow-color)}.shadow-inner{--tw-shadow:inset 0 2px 4px 0 rgba(0,0,0,.05);--tw-shadow-colored:inset 0 2px 4px 0 var(--tw-shadow-color)}.shadow-inner,.shadow-sm{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline{outline-style:solid}.outline-dashed{outline-style:dashed}.outline-dotted{outline-style:dotted}.outline-double{outline-style:double}.ring{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.ring-inset{--tw-ring-inset:inset}.blur{--tw-blur:blur(8px)}.blur,.blur-\\[80px\\]{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.blur-\\[80px\\]{--tw-blur:blur(80px)}.drop-shadow-none{--tw-drop-shadow:drop-shadow(0 0 #0000)}.drop-shadow-none,.drop-shadow-xl{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.drop-shadow-xl{--tw-drop-shadow:drop-shadow(0 20px 13px rgba(0,0,0,.03)) drop-shadow(0 8px 5px rgba(0,0,0,.08))}.grayscale{--tw-grayscale:grayscale(100%)}.grayscale,.invert{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.invert{--tw-invert:invert(100%)}.sepia{--tw-sepia:sepia(100%)}.filter,.sepia{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur-sm{--tw-backdrop-blur:blur(4px)}.backdrop-blur-sm,.backdrop-blur-xl{-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-blur-xl{--tw-backdrop-blur:blur(24px)}.backdrop-grayscale{--tw-backdrop-grayscale:grayscale(100%)}.backdrop-grayscale,.backdrop-invert{-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.backdrop-invert{--tw-backdrop-invert:invert(100%)}.backdrop-sepia{--tw-backdrop-sepia:sepia(100%)}.backdrop-filter,.backdrop-sepia{-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-100{transition-duration:.1s}.duration-1000{transition-duration:1s}.duration-300{transition-duration:.3s}.ease-out{transition-timing-function:cubic-bezier(0,0,.2,1)}.will-change-auto{will-change:auto}.will-change-contents{will-change:contents}.will-change-scroll{will-change:scroll-position}.will-change-transform{will-change:transform}.contain-none{contain:none}.contain-content{contain:content}.contain-strict{contain:strict}.contain-size{--tw-contain-size:size}.contain-inline-size,.contain-size{contain:var(--tw-contain-size) var(--tw-contain-layout) var(--tw-contain-paint) var(--tw-contain-style)}.contain-inline-size{--tw-contain-size:inline-size}.contain-layout{--tw-contain-layout:layout}.contain-layout,.contain-paint{contain:var(--tw-contain-size) var(--tw-contain-layout) var(--tw-contain-paint) var(--tw-contain-style)}.contain-paint{--tw-contain-paint:paint}.contain-style{--tw-contain-style:style;contain:var(--tw-contain-size) var(--tw-contain-layout) var(--tw-contain-paint) var(--tw-contain-style)}.content-none{--tw-content:none;content:var(--tw-content)}.forced-color-adjust-auto{forced-color-adjust:auto}.forced-color-adjust-none{forced-color-adjust:none}.hover\\:scale-\\[1\\.02\\]:hover{--tw-scale-x:1.02;--tw-scale-y:1.02;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.hover\\:border-indigo-400:hover{--tw-border-opacity:1;border-color:rgb(129 140 248/var(--tw-border-opacity,1))}.hover\\:bg-emerald-500\\/20:hover{background-color:rgba(16,185,129,.2)}.hover\\:bg-neutral-800:hover{--tw-bg-opacity:1;background-color:rgb(38 38 38/var(--tw-bg-opacity,1))}.hover\\:bg-rose-500\\/20:hover{background-color:rgba(244,63,94,.2)}.hover\\:bg-white\\/10:hover{background-color:hsla(0,0%,100%,.1)}.hover\\:text-neutral-300:hover{--tw-text-opacity:1;color:rgb(212 212 212/var(--tw-text-opacity,1))}.hover\\:text-white:hover{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.focus\\:outline-none:focus{outline:2px solid transparent;outline-offset:2px}.active\\:scale-95:active{--tw-scale-x:.95;--tw-scale-y:.95;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.group:hover .group-hover\\:text-purple-400{--tw-text-opacity:1;color:rgb(192 132 252/var(--tw-text-opacity,1))}@media (min-width:640px){.sm\\:p-6{padding:1.5rem}}@media (min-width:768px){.md\\:p-8{padding:2rem}}
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
