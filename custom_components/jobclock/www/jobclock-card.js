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

  // Inject Tailwind CSS via CDN
  connectedCallback() {
    super.connectedCallback();
    if (!document.getElementById("jobclock-tailwind")) {
      const script = document.createElement('script');
      script.id = "jobclock-tailwind";
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }

  createRenderRoot() {
    return this; // Disable shadow DOM for Tailwind to work
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
    <style>${JobClockCard.styles}</style>
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
      /* Empty since we use Tailwind */
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
