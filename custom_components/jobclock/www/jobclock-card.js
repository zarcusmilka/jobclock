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
    if(!switchEntity) return;
    
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
    if(h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    const targetTime = todayData.target || (8*3600); // fallback 8h

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
                <div class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out shadow-sm ${
                    workMode === 'office' ? 'translate-x-[calc(100%+4px)] bg-blue-500/20 border border-blue-500/30' : 'translate-x-0 bg-purple-500/20 border border-purple-500/30'
                  } ${!isActive ? 'opacity-50 grayscale' : ''}"></div>

                <button 
                  @click="${() => this._handleModeChange('home')}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    workMode === 'home' ? (isActive ? 'text-purple-300' : 'text-neutral-300') : 'text-neutral-500 hover:text-neutral-300'
                  }"
                >
                  Home
                </button>
                <button 
                  @click="${() => this._handleModeChange('office')}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    workMode === 'office' ? (isActive ? 'text-blue-300' : 'text-neutral-300') : 'text-neutral-500 hover:text-neutral-300'
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
                  <div class="flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold ${
                    dynamicMonthlyStats.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
      
      if(isToday) {
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
/*! tailwindcss v4.2.0 | MIT License | https://tailwindcss.com */
@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-pan-x:initial;--tw-pan-y:initial;--tw-pinch-zoom:initial;--tw-scroll-snap-strictness:proximity;--tw-space-y-reverse:0;--tw-space-x-reverse:0;--tw-divide-x-reverse:0;--tw-border-style:solid;--tw-divide-y-reverse:0;--tw-leading:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-outline-style:solid;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-contain-size:initial;--tw-contain-layout:initial;--tw-contain-paint:initial;--tw-contain-style:initial;--tw-text-shadow-color:initial;--tw-text-shadow-alpha:100%}}}.\@container\/card-header{container:card-header/inline-size}.\@container{container-type:inline-size}.pointer-events-auto{pointer-events:auto}.pointer-events-none{pointer-events:none}.collapse{visibility:collapse}.invisible{visibility:hidden}.visible{visibility:visible}.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}.not-sr-only{clip-path:none;white-space:normal;width:auto;height:auto;margin:0;padding:0;position:static;overflow:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.sticky{position:sticky}.isolate{isolation:isolate}.isolation-auto{isolation:auto}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-50{z-index:50}.z-\[1000\]{z-index:1000}.order-0,.order-none{order:0}.col-start-2{grid-column-start:2}.row-span-2{grid-row:span 2/span 2}.row-start-1{grid-row-start:1}.float-end{float:inline-end}.float-left{float:left}.float-none{float:none}.float-right{float:right}.float-start{float:inline-start}.clear-both{clear:both}.clear-end{clear:inline-end}.clear-left{clear:left}.clear-none{clear:none}.clear-right{clear:right}.clear-start{clear:inline-start}.container{width:100%}.mx-auto{margin-inline:auto}.ml-auto{margin-left:auto}.box-border{box-sizing:border-box}.box-content{box-sizing:content-box}.block{display:block}.contents{display:contents}.flex{display:flex}.flow-root{display:flow-root}.grid{display:grid}.hidden{display:none}.inline{display:inline}.inline-block{display:inline-block}.inline-flex{display:inline-flex}.inline-grid{display:inline-grid}.inline-table{display:inline-table}.list-item{display:list-item}.table{display:table}.table-caption{display:table-caption}.table-cell{display:table-cell}.table-column{display:table-column}.table-column-group{display:table-column-group}.table-footer-group{display:table-footer-group}.table-header-group{display:table-header-group}.table-row{display:table-row}.table-row-group{display:table-row-group}.field-sizing-content{field-sizing:content}.field-sizing-fixed{field-sizing:fixed}.aspect-square{aspect-ratio:1}.size-auto{width:auto;height:auto}.h-\[var\(--radix-select-trigger-height\)\]{height:var(--radix-select-trigger-height)}.h-auto{height:auto}.h-full{height:100%}.h-lh{height:1lh}.h-px{height:1px}.h-screen{height:100vh}.max-h-\(--radix-select-content-available-height\){max-height:var(--radix-select-content-available-height)}.max-h-lh{max-height:1lh}.max-h-none{max-height:none}.max-h-screen{max-height:100vh}.min-h-\[140px\]{min-height:140px}.min-h-auto{min-height:auto}.min-h-lh{min-height:1lh}.min-h-screen{min-height:100vh}.w-\[72px\]{width:72px}.w-\[100px\]{width:100px}.w-\[calc\(50\%-4px\)\]{width:calc(50% - 4px)}.w-auto{width:auto}.w-fit{width:fit-content}.w-full{width:100%}.w-screen{width:100vw}.max-w-none{max-width:none}.max-w-screen{max-width:100vw}.min-w-\[0px\]{min-width:0}.min-w-\[8rem\]{min-width:8rem}.min-w-\[320px\]{min-width:320px}.min-w-\[var\(--radix-select-trigger-width\)\]{min-width:var(--radix-select-trigger-width)}.min-w-auto{min-width:auto}.min-w-screen{min-width:100vw}.flex-1{flex:1}.flex-auto{flex:auto}.flex-initial{flex:0 auto}.flex-none{flex:none}.flex-shrink{flex-shrink:1}.flex-shrink-0{flex-shrink:0}.shrink{flex-shrink:1}.shrink-0{flex-shrink:0}.flex-grow,.grow{flex-grow:1}.basis-auto{flex-basis:auto}.basis-full{flex-basis:100%}.table-auto{table-layout:auto}.table-fixed{table-layout:fixed}.caption-bottom{caption-side:bottom}.caption-top{caption-side:top}.border-collapse{border-collapse:collapse}.border-separate{border-collapse:separate}.origin-\(--radix-select-content-transform-origin\){transform-origin:var(--radix-select-content-transform-origin)}.-translate-full{--tw-translate-x:-100%;--tw-translate-y:-100%;translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-full{--tw-translate-x:100%;--tw-translate-y:100%;translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-x-\[calc\(100\%\+4px\)\]{--tw-translate-x:calc(100% + 4px);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-3d{translate:var(--tw-translate-x) var(--tw-translate-y) var(--tw-translate-z)}.translate-none{translate:none}.scale-120{--tw-scale-x:120%;--tw-scale-y:120%;--tw-scale-z:120%;scale:var(--tw-scale-x) var(--tw-scale-y)}.scale-3d{scale:var(--tw-scale-x) var(--tw-scale-y) var(--tw-scale-z)}.scale-none{scale:none}.-rotate-90{rotate:-90deg}.rotate-none{rotate:none}.transform,.transform-cpu{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.transform-gpu{transform:translateZ(0) var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.transform-none{transform:none}.\[animation\:spin_20s_linear_infinite\],.animate-\[spin_20s_linear_infinite\]{animation:20s linear infinite spin}.cursor-default{cursor:default}.cursor-pointer{cursor:pointer}.touch-pinch-zoom{--tw-pinch-zoom:pinch-zoom;touch-action:var(--tw-pan-x,) var(--tw-pan-y,) var(--tw-pinch-zoom,)}.resize{resize:both}.resize-none{resize:none}.resize-x{resize:horizontal}.resize-y{resize:vertical}.snap-none{scroll-snap-type:none}.snap-mandatory{--tw-scroll-snap-strictness:mandatory}.snap-proximity{--tw-scroll-snap-strictness:proximity}.snap-align-none{scroll-snap-align:none}.snap-center{scroll-snap-align:center}.snap-end{scroll-snap-align:end}.snap-start{scroll-snap-align:start}.snap-always{scroll-snap-stop:always}.snap-normal{scroll-snap-stop:normal}.list-inside{list-style-position:inside}.list-outside{list-style-position:outside}.appearance-auto{appearance:auto}.appearance-none{appearance:none}.grid-flow-col{grid-auto-flow:column}.grid-flow-col-dense{grid-auto-flow:column dense}.grid-flow-dense{grid-auto-flow:dense}.grid-flow-row{grid-auto-flow:row}.grid-flow-row-dense{grid-auto-flow:dense}.auto-rows-min{grid-auto-rows:min-content}.grid-cols-7{grid-template-columns:repeat(7,minmax(0,1fr))}.grid-rows-\[auto_auto\]{grid-template-rows:auto auto}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-row{flex-direction:row}.flex-row-reverse{flex-direction:row-reverse}.flex-nowrap{flex-wrap:nowrap}.flex-wrap{flex-wrap:wrap}.flex-wrap-reverse{flex-wrap:wrap-reverse}.place-content-around{place-content:space-around}.place-content-baseline{place-content:baseline start}.place-content-between{place-content:space-between}.place-content-center{place-content:center}.place-content-center-safe{place-content:safe center}.place-content-end{place-content:end}.place-content-end-safe{place-content:safe end}.place-content-evenly{place-content:space-evenly}.place-content-start{place-content:start}.place-content-stretch{place-content:stretch}.place-items-baseline{place-items:baseline}.place-items-center{place-items:center}.place-items-center-safe{place-items:safe center}.place-items-end{place-items:end}.place-items-end-safe{place-items:safe end}.place-items-start{place-items:start}.place-items-stretch{place-items:stretch stretch}.content-around{align-content:space-around}.content-baseline{align-content:baseline}.content-between{align-content:space-between}.content-center{align-content:center}.content-center-safe{align-content:safe center}.content-end{align-content:flex-end}.content-end-safe{align-content:safe flex-end}.content-evenly{align-content:space-evenly}.content-normal{align-content:normal}.content-start{align-content:flex-start}.content-stretch{align-content:stretch}.items-baseline{align-items:baseline}.items-baseline-last{align-items:last baseline}.items-center{align-items:center}.items-center-safe{align-items:safe center}.items-end{align-items:flex-end}.items-end-safe{align-items:safe flex-end}.items-start{align-items:flex-start}.items-stretch{align-items:stretch}.justify-around{justify-content:space-around}.justify-baseline{justify-content:baseline}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-center-safe{justify-content:safe center}.justify-end{justify-content:flex-end}.justify-end-safe{justify-content:safe flex-end}.justify-evenly{justify-content:space-evenly}.justify-normal{justify-content:normal}.justify-start{justify-content:flex-start}.justify-stretch{justify-content:stretch}.justify-items-center{justify-items:center}.justify-items-center-safe{justify-items:safe center}.justify-items-end{justify-items:end}.justify-items-end-safe{justify-items:safe end}.justify-items-normal{justify-items:normal}.justify-items-start{justify-items:start}.justify-items-stretch{justify-items:stretch}:where(.space-y-reverse>:not(:last-child)){--tw-space-y-reverse:1}:where(.space-x-reverse>:not(:last-child)){--tw-space-x-reverse:1}:where(.divide-x>:not(:last-child)){--tw-divide-x-reverse:0;border-inline-style:var(--tw-border-style);border-inline-start-width:calc(1px * var(--tw-divide-x-reverse));border-inline-end-width:calc(1px * calc(1 - var(--tw-divide-x-reverse)))}:where(.divide-y>:not(:last-child)){--tw-divide-y-reverse:0;border-bottom-style:var(--tw-border-style);border-top-style:var(--tw-border-style);border-top-width:calc(1px * var(--tw-divide-y-reverse));border-bottom-width:calc(1px * calc(1 - var(--tw-divide-y-reverse)))}:where(.divide-y-reverse>:not(:last-child)){--tw-divide-y-reverse:1}.place-self-auto{place-self:auto}.place-self-center{place-self:center}.place-self-center-safe{place-self:safe center}.place-self-end{place-self:end}.place-self-end-safe{place-self:safe end}.place-self-start{place-self:start}.place-self-stretch{place-self:stretch stretch}.self-auto{align-self:auto}.self-baseline{align-self:baseline}.self-baseline-last{align-self:last baseline}.self-center{align-self:center}.self-center-safe{align-self:safe center}.self-end{align-self:flex-end}.self-end-safe{align-self:safe flex-end}.self-start{align-self:flex-start}.self-stretch{align-self:stretch}.justify-self-auto{justify-self:auto}.justify-self-center{justify-self:center}.justify-self-center-safe{justify-self:safe center}.justify-self-end{justify-self:flex-end}.justify-self-end-safe{justify-self:safe flex-end}.justify-self-start{justify-self:flex-start}.justify-self-stretch{justify-self:stretch}.truncate{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.overflow-hidden{overflow:hidden}.overflow-x-hidden{overflow-x:hidden}.overflow-y-auto{overflow-y:auto}.scroll-auto{scroll-behavior:auto}.scroll-smooth{scroll-behavior:smooth}.rounded-full{border-radius:3.40282e38px}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-x{border-inline-style:var(--tw-border-style);border-inline-width:1px}.border-y{border-block-style:var(--tw-border-style);border-block-width:1px}.border-s{border-inline-start-style:var(--tw-border-style);border-inline-start-width:1px}.border-e{border-inline-end-style:var(--tw-border-style);border-inline-end-width:1px}.border-bs{border-block-start-style:var(--tw-border-style);border-block-start-width:1px}.border-be{border-block-end-style:var(--tw-border-style);border-block-end-width:1px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-r{border-right-style:var(--tw-border-style);border-right-width:1px}.border-b{border-bottom-style:var(--tw-border-style);border-bottom-width:1px}.border-l{border-left-style:var(--tw-border-style);border-left-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-dotted{--tw-border-style:dotted;border-style:dotted}.border-double{--tw-border-style:double;border-style:double}.border-hidden{--tw-border-style:hidden;border-style:hidden}.border-none{--tw-border-style:none;border-style:none}.border-solid{--tw-border-style:solid;border-style:solid}.border-\[\#fbf0df\]{border-color:#fbf0df}.border-transparent{border-color:#0000}.bg-\[\#1a1a1a\]{background-color:#1a1a1a}.bg-\[\#242424\]{background-color:#242424}.bg-\[\#fbf0df\]{background-color:#fbf0df}.bg-transparent{background-color:#0000}.-bg-conic,.bg-conic{--tw-gradient-position:in oklab;background-image:conic-gradient(var(--tw-gradient-stops))}.bg-gradient-to-b{--tw-gradient-position:to bottom in oklab;background-image:linear-gradient(var(--tw-gradient-stops))}.bg-radial{--tw-gradient-position:in oklab;background-image:radial-gradient(var(--tw-gradient-stops))}.bg-none{background-image:none}.via-none{--tw-gradient-via-stops:initial}.mask-none{-webkit-mask-image:none;mask-image:none}.mask-circle{--tw-mask-radial-shape:circle}.mask-ellipse{--tw-mask-radial-shape:ellipse}.mask-radial-closest-corner{--tw-mask-radial-size:closest-corner}.mask-radial-closest-side{--tw-mask-radial-size:closest-side}.mask-radial-farthest-corner{--tw-mask-radial-size:farthest-corner}.mask-radial-farthest-side{--tw-mask-radial-size:farthest-side}.mask-radial-at-bottom{--tw-mask-radial-position:bottom}.mask-radial-at-bottom-left{--tw-mask-radial-position:bottom left}.mask-radial-at-bottom-right{--tw-mask-radial-position:bottom right}.mask-radial-at-center{--tw-mask-radial-position:center}.mask-radial-at-left{--tw-mask-radial-position:left}.mask-radial-at-right{--tw-mask-radial-position:right}.mask-radial-at-top{--tw-mask-radial-position:top}.mask-radial-at-top-left{--tw-mask-radial-position:top left}.mask-radial-at-top-right{--tw-mask-radial-position:top right}.box-decoration-clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}.box-decoration-slice{-webkit-box-decoration-break:slice;box-decoration-break:slice}.decoration-clone{-webkit-box-decoration-break:clone;box-decoration-break:clone}.decoration-slice{-webkit-box-decoration-break:slice;box-decoration-break:slice}.bg-auto{background-size:auto}.bg-contain{background-size:contain}.bg-cover{background-size:cover}.bg-fixed{background-attachment:fixed}.bg-local{background-attachment:local}.bg-scroll{background-attachment:scroll}.bg-clip-border{background-clip:border-box}.bg-clip-content{background-clip:content-box}.bg-clip-padding{background-clip:padding-box}.bg-clip-text{-webkit-background-clip:text;background-clip:text}.bg-bottom{background-position:bottom}.bg-bottom-left{background-position:0 100%}.bg-bottom-right{background-position:100% 100%}.bg-center{background-position:50%}.bg-left{background-position:0}.bg-left-bottom{background-position:0 100%}.bg-left-top{background-position:0 0}.bg-right{background-position:100%}.bg-right-bottom{background-position:100% 100%}.bg-right-top{background-position:100% 0}.bg-top{background-position:top}.bg-top-left{background-position:0 0}.bg-top-right{background-position:100% 0}.bg-no-repeat{background-repeat:no-repeat}.bg-repeat{background-repeat:repeat}.bg-repeat-round{background-repeat:round}.bg-repeat-space{background-repeat:space}.bg-repeat-x{background-repeat:repeat-x}.bg-repeat-y{background-repeat:repeat-y}.bg-origin-border{background-origin:border-box}.bg-origin-content{background-origin:content-box}.bg-origin-padding{background-origin:padding-box}.mask-add{-webkit-mask-composite:source-over;-webkit-mask-composite:source-over;mask-composite:add}.mask-exclude{-webkit-mask-composite:xor;-webkit-mask-composite:xor;mask-composite:exclude}.mask-intersect{-webkit-mask-composite:source-in;-webkit-mask-composite:source-in;mask-composite:intersect}.mask-subtract{-webkit-mask-composite:source-out;-webkit-mask-composite:source-out;mask-composite:subtract}.mask-alpha{-webkit-mask-source-type:alpha;-webkit-mask-source-type:alpha;mask-mode:alpha}.mask-luminance{-webkit-mask-source-type:luminance;-webkit-mask-source-type:luminance;mask-mode:luminance}.mask-match{-webkit-mask-source-type:auto;-webkit-mask-source-type:auto;mask-mode:match-source}.mask-type-alpha{mask-type:alpha}.mask-type-luminance{mask-type:luminance}.mask-auto{-webkit-mask-size:auto;mask-size:auto}.mask-contain{-webkit-mask-size:contain;mask-size:contain}.mask-cover{-webkit-mask-size:cover;mask-size:cover}.mask-clip-border{-webkit-mask-clip:border-box;mask-clip:border-box}.mask-clip-content{-webkit-mask-clip:content-box;mask-clip:content-box}.mask-clip-fill{-webkit-mask-clip:fill-box;mask-clip:fill-box}.mask-clip-padding{-webkit-mask-clip:padding-box;mask-clip:padding-box}.mask-clip-stroke{-webkit-mask-clip:stroke-box;mask-clip:stroke-box}.mask-clip-view{-webkit-mask-clip:view-box;mask-clip:view-box}.mask-no-clip{-webkit-mask-clip:no-clip;mask-clip:no-clip}.mask-bottom{-webkit-mask-position:bottom;mask-position:bottom}.mask-bottom-left{-webkit-mask-position:0 100%;mask-position:0 100%}.mask-bottom-right{-webkit-mask-position:100% 100%;mask-position:100% 100%}.mask-center{-webkit-mask-position:50%;mask-position:50%}.mask-left{-webkit-mask-position:0;mask-position:0}.mask-right{-webkit-mask-position:100%;mask-position:100%}.mask-top{-webkit-mask-position:top;mask-position:top}.mask-top-left{-webkit-mask-position:0 0;mask-position:0 0}.mask-top-right{-webkit-mask-position:100% 0;mask-position:100% 0}.mask-no-repeat{-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}.mask-repeat{-webkit-mask-repeat:repeat;mask-repeat:repeat}.mask-repeat-round{-webkit-mask-repeat:round;mask-repeat:round}.mask-repeat-space{-webkit-mask-repeat:space;mask-repeat:space}.mask-repeat-x{-webkit-mask-repeat:repeat-x;mask-repeat:repeat-x}.mask-repeat-y{-webkit-mask-repeat:repeat-y;mask-repeat:repeat-y}.mask-origin-border{-webkit-mask-origin:border-box;mask-origin:border-box}.mask-origin-content{-webkit-mask-origin:content-box;mask-origin:content-box}.mask-origin-fill{-webkit-mask-origin:fill-box;mask-origin:fill-box}.mask-origin-padding{-webkit-mask-origin:padding-box;mask-origin:padding-box}.mask-origin-stroke{-webkit-mask-origin:stroke-box;mask-origin:stroke-box}.mask-origin-view{-webkit-mask-origin:view-box;mask-origin:view-box}.fill-none{fill:none}.stroke-none{stroke:none}.object-contain{object-fit:contain}.object-cover{object-fit:cover}.object-fill{object-fit:fill}.object-none{object-fit:none}.object-scale-down{object-fit:scale-down}.object-left-bottom{object-position:left bottom}.object-left-top{object-position:left top}.object-right-bottom{object-position:right bottom}.object-right-top{object-position:right top}.px-\[0\.3rem\]{padding-inline:.3rem}.py-\[0\.2rem\]{padding-block:.2rem}.text-center{text-align:center}.text-end{text-align:end}.text-justify{text-align:justify}.text-left{text-align:left}.text-right{text-align:right}.text-start{text-align:start}.align-baseline{vertical-align:baseline}.align-bottom{vertical-align:bottom}.align-middle{vertical-align:middle}.align-sub{vertical-align:sub}.align-super{vertical-align:super}.align-text-bottom{vertical-align:text-bottom}.align-text-top{vertical-align:text-top}.align-top{vertical-align:top}.text-\[10px\]{font-size:10px}.leading-none{--tw-leading:1;line-height:1}.text-balance{text-wrap:balance}.text-nowrap{text-wrap:nowrap}.text-pretty{text-wrap:pretty}.text-wrap{text-wrap:wrap}.break-normal{overflow-wrap:normal;word-break:normal}.break-words{overflow-wrap:break-word}.wrap-anywhere{overflow-wrap:anywhere}.wrap-break-word{overflow-wrap:break-word}.wrap-normal{overflow-wrap:normal}.break-all{word-break:break-all}.break-keep{word-break:keep-all}.overflow-ellipsis{text-overflow:ellipsis}.text-clip{text-overflow:clip}.text-ellipsis{text-overflow:ellipsis}.hyphens-auto{-webkit-hyphens:auto;hyphens:auto}.hyphens-manual{-webkit-hyphens:manual;hyphens:manual}.hyphens-none{-webkit-hyphens:none;hyphens:none}.whitespace-break-spaces{white-space:break-spaces}.whitespace-normal{white-space:normal}.whitespace-nowrap{white-space:nowrap}.whitespace-pre{white-space:pre}.whitespace-pre-line{white-space:pre-line}.whitespace-pre-wrap{white-space:pre-wrap}.text-\[\#1a1a1a\]{color:#1a1a1a}.text-\[\#fbf0df\]{color:#fbf0df}.text-\[rgba\(255\,255\,255\,0\.87\)\]{color:#ffffffde}.capitalize{text-transform:capitalize}.lowercase{text-transform:lowercase}.normal-case{text-transform:none}.uppercase{text-transform:uppercase}.italic{font-style:italic}.not-italic{font-style:normal}.font-stretch-condensed{font-stretch:75%}.font-stretch-expanded{font-stretch:125%}.font-stretch-extra-condensed{font-stretch:62.5%}.font-stretch-extra-expanded{font-stretch:150%}.font-stretch-normal{font-stretch:100%}.font-stretch-semi-condensed{font-stretch:87.5%}.font-stretch-semi-expanded{font-stretch:112.5%}.font-stretch-ultra-condensed{font-stretch:50%}.font-stretch-ultra-expanded{font-stretch:200%}.diagonal-fractions{--tw-numeric-fraction:diagonal-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.lining-nums{--tw-numeric-figure:lining-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.oldstyle-nums{--tw-numeric-figure:oldstyle-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.proportional-nums{--tw-numeric-spacing:proportional-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.slashed-zero{--tw-slashed-zero:slashed-zero;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.stacked-fractions{--tw-numeric-fraction:stacked-fractions;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal,) var(--tw-slashed-zero,) var(--tw-numeric-figure,) var(--tw-numeric-spacing,) var(--tw-numeric-fraction,)}.normal-nums{font-variant-numeric:normal}.line-through{text-decoration-line:line-through}.no-underline{text-decoration-line:none}.overline{text-decoration-line:overline}.underline{text-decoration-line:underline}.decoration-dashed{text-decoration-style:dashed}.decoration-dotted{text-decoration-style:dotted}.decoration-double{text-decoration-style:double}.decoration-solid{text-decoration-style:solid}.decoration-wavy{text-decoration-style:wavy}.decoration-auto{text-decoration-thickness:auto}.decoration-from-font{text-decoration-thickness:from-font}.underline-offset-4{text-underline-offset:4px}.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.subpixel-antialiased{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}.placeholder-\[\#fbf0df\]\/40::placeholder{color:oklab(95.9232% .00488412 .0249393/.4)}.accent-auto{accent-color:auto}.scheme-dark{color-scheme:dark}.scheme-light{color-scheme:light}.scheme-light-dark{color-scheme:light dark}.scheme-normal{color-scheme:normal}.scheme-only-dark{color-scheme:dark only}.scheme-only-light{color-scheme:light only}.opacity-20{opacity:.2}.opacity-50{opacity:.5}.opacity-\[0\.15\]{opacity:.15}.mix-blend-plus-darker{mix-blend-mode:plus-darker}.mix-blend-plus-lighter{mix-blend-mode:plus-lighter}.shadow-\[0_8px_30px_rgba\(0\,0\,0\,0\.2\)\]{--tw-shadow:0 8px 30px var(--tw-shadow-color,#0003);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.ring{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.inset-ring{--tw-inset-ring-shadow:inset 0 0 0 1px var(--tw-inset-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.shadow-initial{--tw-shadow-color:initial}.inset-shadow-initial{--tw-inset-shadow-color:initial}.outline-hidden{--tw-outline-style:none;outline-style:none}@media (forced-colors:active){.outline-hidden{outline-offset:2px;outline:2px solid #0000}}.outline{outline-style:var(--tw-outline-style);outline-width:1px}.blur-\[80px\]{--tw-blur:blur(80px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow-none{--tw-drop-shadow: ;filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.sepia{--tw-sepia:sepia(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-grayscale{--tw-backdrop-grayscale:grayscale(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-invert{--tw-backdrop-invert:invert(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-sepia{--tw-backdrop-sepia:sepia(100%);-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-filter{-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,ease);transition-duration:var(--tw-duration,0s)}.transition-\[color\,box-shadow\]{transition-property:color,box-shadow;transition-timing-function:var(--tw-ease,ease);transition-duration:var(--tw-duration,0s)}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,ease);transition-duration:var(--tw-duration,0s)}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,ease);transition-duration:var(--tw-duration,0s)}.transition-discrete{transition-behavior:allow-discrete}.transition-normal{transition-behavior:normal}.duration-100{--tw-duration:.1s;transition-duration:.1s}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-1000{--tw-duration:1s;transition-duration:1s}.will-change-auto{will-change:auto}.will-change-contents{will-change:contents}.will-change-scroll{will-change:scroll-position}.will-change-transform{will-change:transform}.contain-inline-size{--tw-contain-size:inline-size;contain:var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)}.contain-layout{--tw-contain-layout:layout;contain:var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)}.contain-paint{--tw-contain-paint:paint;contain:var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)}.contain-size{--tw-contain-size:size;contain:var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)}.contain-style{--tw-contain-style:style;contain:var(--tw-contain-size,) var(--tw-contain-layout,) var(--tw-contain-paint,) var(--tw-contain-style,)}.contain-content{contain:content}.contain-none{contain:none}.contain-strict{contain:strict}.content-none{--tw-content:none;content:none}.forced-color-adjust-auto{forced-color-adjust:auto}.forced-color-adjust-none{forced-color-adjust:none}.outline-dashed{--tw-outline-style:dashed;outline-style:dashed}.outline-dotted{--tw-outline-style:dotted;outline-style:dotted}.outline-double{--tw-outline-style:double;outline-style:double}.outline-none{--tw-outline-style:none;outline-style:none}.outline-solid{--tw-outline-style:solid;outline-style:solid}.select-none{-webkit-user-select:none;user-select:none}.backface-hidden{backface-visibility:hidden}.backface-visible{backface-visibility:visible}.block-auto{block-size:auto}.block-lh{block-size:1lh}.block-screen{block-size:100vh}:where(.divide-x-reverse>:not(:last-child)){--tw-divide-x-reverse:1}.duration-initial{--tw-duration:initial}.inline-auto{inline-size:auto}.inline-screen{inline-size:100vw}.max-block-lh{max-block-size:1lh}.max-block-none{max-block-size:none}.max-block-screen{max-block-size:100vh}.max-inline-none{max-inline-size:none}.max-inline-screen{max-inline-size:100vw}.min-block-auto{min-block-size:auto}.min-block-lh{min-block-size:1lh}.min-block-screen{min-block-size:100vh}.min-inline-auto{min-inline-size:auto}.min-inline-screen{min-inline-size:100vw}.ring-inset{--tw-ring-inset:inset}.text-shadow-initial{--tw-text-shadow-color:initial}.transform-3d{transform-style:preserve-3d}.transform-border{transform-box:border-box}.transform-content{transform-box:content-box}.transform-fill{transform-box:fill-box}.transform-flat{transform-style:flat}.transform-stroke{transform-box:stroke-box}.transform-view{transform-box:view-box}.group-data-\[disabled\=true\]\:pointer-events-none:is(:where(.group)[data-disabled=true] *){pointer-events:none}.group-data-\[disabled\=true\]\:opacity-50:is(:where(.group)[data-disabled=true] *){opacity:.5}.peer-disabled\:cursor-not-allowed:is(:where(.peer):disabled~*){cursor:not-allowed}.peer-disabled\:opacity-50:is(:where(.peer):disabled~*){opacity:.5}.file\:inline-flex::file-selector-button{display:inline-flex}.file\:border-0::file-selector-button{border-style:var(--tw-border-style);border-width:0}.file\:bg-transparent::file-selector-button{background-color:#0000}.focus-within\:border-\[\#f3d5a3\]:focus-within{border-color:#f3d5a3}@media (hover:hover){.hover\:-translate-y-px:hover{--tw-translate-y:-1px;translate:var(--tw-translate-x) var(--tw-translate-y)}.hover\:scale-\[1\.02\]:hover{scale:1.02}.hover\:bg-\[\#f3d5a3\]:hover{background-color:#f3d5a3}.hover\:underline:hover{text-decoration-line:underline}.hover\:drop-shadow-\[0_0_2em_\#61dafbaa\]:hover{--tw-drop-shadow-size:drop-shadow(0 0 2em var(--tw-drop-shadow-color,#61dafbaa));--tw-drop-shadow:var(--tw-drop-shadow-size);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.hover\:drop-shadow-\[0_0_2em_\#646cffaa\]:hover{--tw-drop-shadow-size:drop-shadow(0 0 2em var(--tw-drop-shadow-color,#646cffaa));--tw-drop-shadow:var(--tw-drop-shadow-size);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}}.focus\:border-\[\#f3d5a3\]:focus{border-color:#f3d5a3}.focus\:outline-none:focus{--tw-outline-style:none;outline-style:none}.focus-visible\:ring-\[3px\]:focus-visible{--tw-ring-shadow:var(--tw-ring-inset,) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color,currentcolor);box-shadow:var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)}.active\:scale-95:active{--tw-scale-x:95%;--tw-scale-y:95%;--tw-scale-z:95%;scale:var(--tw-scale-x) var(--tw-scale-y)}.disabled\:pointer-events-none:disabled{pointer-events:none}.disabled\:cursor-not-allowed:disabled{cursor:not-allowed}.disabled\:opacity-50:disabled{opacity:.5}.has-data-\[slot\=card-action\]\:grid-cols-\[1fr_auto\]:has([data-slot=card-action]){grid-template-columns:1fr auto}.data-\[disabled\]\:pointer-events-none[data-disabled]{pointer-events:none}.data-\[disabled\]\:opacity-50[data-disabled]{opacity:.5}:is(.\*\:data-\[slot\=select-value\]\:line-clamp-1>*)[data-slot=select-value]{-webkit-line-clamp:1;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}:is(.\*\:data-\[slot\=select-value\]\:flex>*)[data-slot=select-value]{display:flex}:is(.\*\:data-\[slot\=select-value\]\:items-center>*)[data-slot=select-value]{align-items:center}.\[\&_svg\]\:pointer-events-none svg{pointer-events:none}.\[\&_svg\]\:shrink-0 svg{flex-shrink:0}:is(.\*\:\[span\]\:last\:flex>*):is(span):last-child{display:flex}:is(.\*\:\[span\]\:last\:items-center>*):is(span):last-child{align-items:center}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-scale-x{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-y{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-z{syntax:"*";inherits:false;initial-value:1}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-pan-x{syntax:"*";inherits:false}@property --tw-pan-y{syntax:"*";inherits:false}@property --tw-pinch-zoom{syntax:"*";inherits:false}@property --tw-scroll-snap-strictness{syntax:"*";inherits:false;initial-value:proximity}@property --tw-space-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-space-x-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-divide-x-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-divide-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-leading{syntax:"*";inherits:false}@property --tw-ordinal{syntax:"*";inherits:false}@property --tw-slashed-zero{syntax:"*";inherits:false}@property --tw-numeric-figure{syntax:"*";inherits:false}@property --tw-numeric-spacing{syntax:"*";inherits:false}@property --tw-numeric-fraction{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-outline-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-backdrop-blur{syntax:"*";inherits:false}@property --tw-backdrop-brightness{syntax:"*";inherits:false}@property --tw-backdrop-contrast{syntax:"*";inherits:false}@property --tw-backdrop-grayscale{syntax:"*";inherits:false}@property --tw-backdrop-hue-rotate{syntax:"*";inherits:false}@property --tw-backdrop-invert{syntax:"*";inherits:false}@property --tw-backdrop-opacity{syntax:"*";inherits:false}@property --tw-backdrop-saturate{syntax:"*";inherits:false}@property --tw-backdrop-sepia{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@property --tw-contain-size{syntax:"*";inherits:false}@property --tw-contain-layout{syntax:"*";inherits:false}@property --tw-contain-paint{syntax:"*";inherits:false}@property --tw-contain-style{syntax:"*";inherits:false}@property --tw-text-shadow-color{syntax:"*";inherits:false}@property --tw-text-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
