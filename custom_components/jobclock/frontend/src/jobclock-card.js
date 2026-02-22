import { LitElement, html, css, unsafeCSS } from 'lit';
import tailwindCss from './style.css?inline';

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

    const todayFormatted = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
    const monthShortName = this._currentMonth.toLocaleDateString("de-DE", { month: "short" }).toUpperCase();
    const monthName = this._currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

    // Weekly Overview Logic – computed from this._data
    const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const today = new Date();
    const todayKey = formatDateLocal(today);
    // Get Monday of current week
    const dayOfWeek = today.getDay(); // 0=So, 1=Mo, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDaysInfo = [];
    let weekWorked = 0;
    let weekTarget = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = formatDateLocal(d);
      const dayData = this._data[key];
      const dow = d.getDay(); // 0=So, 6=Sa
      const isWeekend = dow === 0 || dow === 6;
      const isToday = key === todayKey;

      let duration = 0;
      let target = 0;
      let type = isWeekend ? 'weekend' : 'work';
      let offHours = 0; // Büro
      let hmHours = 0;  // Home-Office

      if (dayData) {
        duration = (dayData.duration || 0) / 3600;
        target = (dayData.target || 0) / 3600;
        if (dayData.type) type = dayData.type === 'weekend' ? 'weekend' : dayData.type;

        // Split sessions by location
        const sessions = dayData.sessions || [];
        sessions.forEach(s => {
          const dur = (s.duration || 0) / 3600;
          if (s.location === 'home') hmHours += dur;
          else offHours += dur;
        });
        // If no sessions but duration exists (fallback for old data), assume Office
        // Only apply this for actual work days, not sick/vacation
        if (sessions.length === 0 && duration > 0 && type !== 'sick' && type !== 'vacation') {
          offHours = duration;
        }
      } else if (!isWeekend) {
        target = 8;
      }

      // Add current session to today
      if (isToday && isWorking && currentSessionDuration > 0) {
        const liveDur = currentSessionDuration / 3600;
        duration += liveDur;
        if (workMode === 'home') hmHours += liveDur;
        else offHours += liveDur;
      }

      weekWorked += duration;
      weekTarget += target;
      weekDaysInfo.push({ label: dayLabels[d.getDay()], duration, target, type, offHours, hmHours, isToday });
    }

    // Modus-abhängige Farben
    const modeColor = workMode === 'home' ? 'purple' : 'blue';
    const modeGlowBg = workMode === 'home' ? 'bg-purple-500' : 'bg-blue-500';
    const modeGlowBgActive = workMode === 'home' ? 'bg-purple-400' : 'bg-blue-400';
    const modeStrokeClass = workMode === 'home' ? 'stroke-purple-500' : 'stroke-blue-500';

    return html`
      <div class="w-full max-w-xl mx-auto space-y-4 font-sans text-neutral-100 selection:bg-purple-500/30">
          


          <!-- TIMER CARD -->
          <div class="${isActive
        ? 'bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-neutral-700/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
        : 'bg-neutral-800/50 rounded-3xl p-5 sm:p-6 border border-purple-500/10 hover:border-purple-500/20 transition-colors'
      } relative overflow-hidden flex flex-row items-center gap-6">
            <!-- Ambient Glow (only when active) -->
            ${isActive ? html`<div class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${modeGlowBg}"></div>` : ''}
                
                <!-- ORB -->
                <button 
                  @click="${this._manualToggle}"
                  class="relative w-36 h-36 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none group z-10"
                >
                  <div class="absolute inset-0 bg-[#13161f] rounded-full shadow-inner border border-neutral-700/30"></div>

                  ${isActive ? html`<div class="absolute inset-1.5 rounded-full animate-ping opacity-[0.15] ${modeGlowBgActive}"></div>` : ''}

                  ${isActive ? html`
                  <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                    <defs>
                      <filter id="glowTimer" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <circle cx="80" cy="80" r="${radius}" class="stroke-neutral-800" stroke-width="8" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="${radius}"
                      class="transition-all duration-1000 ease-out ${modeStrokeClass}"
                      stroke-width="8" stroke-linecap="round" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                      filter="url(#glowTimer)"
                    />
                  </svg>

                  ` : html`
                  <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                    <circle cx="80" cy="80" r="${radius}" class="stroke-neutral-800" stroke-width="8" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="${radius}"
                      class="transition-all duration-1000 ease-out stroke-[#444455]"
                      stroke-width="8" stroke-linecap="round" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
                    />
                  </svg>
                  `}

                  <div class="absolute flex flex-col items-center justify-center text-center mt-1 z-30">
                    <div class="mb-1 transition-colors duration-300 ${isActive ? (workMode === 'home' ? 'text-purple-400' : 'text-blue-400') : 'text-neutral-400 group-hover:text-purple-400'}">
                       ${isActive ? html`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>` : html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`}
                    </div>
                    <span class="text-2xl font-light mb-0.5 font-mono transition-colors duration-300 ${isActive ? 'text-white' : 'text-neutral-300'}">
                      ${this.formatTime(timeWorked)}
                    </span>
                    <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">
                      Soll: ${Math.floor(targetTime / 3600)}h ${(targetTime % 3600) / 60}m
                    </div>
                  </div>
                </button>

                <!-- RIGHT SIDE (MODE & STATS) -->
                <div class="flex flex-col flex-1 h-36 relative w-full pt-1">
                    
                    ${switchEntity ? html`
                    <div class="relative flex w-full bg-neutral-900/80 rounded-xl p-1 border border-neutral-700/50 shadow-inner">
                        <button 
                        @click="${() => this._handleModeChange('home')}"
                        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${workMode === 'home' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'text-neutral-500 hover:text-neutral-400 border border-transparent'}"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Home
                        </button>
                        <button 
                        @click="${() => this._handleModeChange('office')}"
                        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${workMode === 'office' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'text-neutral-500 hover:text-neutral-400 border border-transparent'}"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                            Büro
                        </button>
                    </div>
                    ` : ''}

                    <div class="mt-auto pb-4">
                        <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                            Monat (${monthShortName})
                        </div>
                        <div class="flex justify-between items-end mb-2">
                            <div class="flex items-baseline gap-1">
                                <span class="text-2xl font-light text-white font-mono">${dynamicMonthlyStats.ist.toFixed(1)}h</span>
                                <span class="text-[11px] font-medium text-neutral-500">/ ${dynamicMonthlyStats.soll.toFixed(1)}h</span>
                            </div>
                            <div class="flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${dynamicMonthlyStats.saldo >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                                ${dynamicMonthlyStats.saldo > 0 ? '+' : ''}${dynamicMonthlyStats.saldo.toFixed(1)}h
                            </div>
                        </div>
                        <div class="w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden shadow-inner border border-neutral-700/30">
                            <div 
                                class="h-full rounded-full transition-all duration-1000 ${workMode === 'home' ? 'bg-purple-400' : 'bg-blue-400'}"
                                style="width: ${Math.min((dynamicMonthlyStats.ist / Math.max(dynamicMonthlyStats.soll, 1)) * 100, 100)}%"
                            ></div>
                        </div>
                    </div>
                </div>
          </div>

          <!-- WEEKLY OVERVIEW -->
          <div class="bg-neutral-800/50 rounded-3xl p-6 border border-purple-500/10 hover:border-purple-500/20 transition-colors">
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-purple-400" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <h2 class="text-base font-semibold text-white tracking-wide">Wochenübersicht</h2>
                </div>
                <div class="px-2.5 py-1 rounded-md bg-[#2a1a3e] border border-purple-500/20 text-purple-300 text-[10px] font-bold tracking-widest font-mono">
                    ${weekWorked.toFixed(1)} / ${weekTarget.toFixed(1)}h
                </div>
            </div>

            <div class="flex justify-between items-end gap-2 mt-6">
                ${weekDaysInfo.map(day => {
        const isWeekend = day.type === 'weekend';
        const isSick = day.type === 'sick';
        const isVacation = day.type === 'vacation';
        const isToday = day.isToday;
        const totalHours = day.offHours + day.hmHours;
        const borderCls = isToday ? 'border-neutral-500/50' : 'border-neutral-700/30';

        // Krank oder Urlaub: voller einfarbiger Balken
        if (isSick || isVacation) {
          const barColor = isSick ? 'bg-rose-500' : 'bg-amber-500';
          const labelText = isSick ? 'Krank' : 'Urlaub';
          return html`
            <div class="flex flex-col items-center flex-1 group">
              <div class="relative w-full flex flex-col justify-end h-20 bg-neutral-800 rounded-lg border ${borderCls} overflow-hidden">
                <div class="w-full ${barColor} rounded-lg transition-all duration-500 ${isToday ? 'opacity-100 shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'opacity-70'}" style="height: 100%"></div>
                <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-xs px-2 py-1 rounded border border-neutral-600 pointer-events-none transition-opacity z-20 whitespace-nowrap text-white font-mono">${labelText}</div>
              </div>
              <span class="text-xs mt-2 font-medium ${isToday ? 'text-white' : 'text-neutral-500'}">${day.label}</span>
            </div>`;
        }

        // Wochenende ohne Arbeit: leerer Balken
        if ((isWeekend || day.target === 0) && totalHours === 0) {
          return html`
            <div class="flex flex-col items-center flex-1 group">
              <div class="relative w-full h-20 bg-neutral-800 rounded-lg border border-neutral-700/30 overflow-hidden"></div>
              <span class="text-xs mt-2 font-medium ${isToday ? 'text-white' : 'text-neutral-500'}">${day.label}</span>
            </div>`;
        }

        // Normale Arbeitstage: gestapelte Balken
        const targetHours = day.target > 0 ? day.target : 8;
        const offPercent = Math.min((day.offHours / targetHours) * 100, 100);
        const hmPercent = Math.min((day.hmHours / targetHours) * 100, 100 - offPercent);

        return html`
          <div class="flex flex-col items-center flex-1 group">
            <div class="relative w-full flex flex-col justify-end h-20 bg-neutral-800 rounded-lg border ${borderCls} overflow-hidden">
              ${day.hmHours > 0 ? html`
                <div class="w-full transition-all duration-500 bg-purple-500 ${day.offHours === 0 ? 'rounded-lg' : 'rounded-t-lg'} ${isToday ? 'opacity-100 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'opacity-70'}" style="height: ${hmPercent}%"></div>
              ` : ''}
              ${day.offHours > 0 ? html`
                <div class="w-full transition-all duration-500 bg-blue-500 ${day.hmHours === 0 ? 'rounded-lg' : 'rounded-b-lg'} ${isToday ? 'opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'opacity-70'}" style="height: ${offPercent}%"></div>
              ` : ''}
              <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-xs px-2 py-1 rounded border border-neutral-600 pointer-events-none transition-opacity z-20 whitespace-nowrap text-white font-mono">${totalHours.toFixed(1)}h</div>
            </div>
            <span class="text-xs mt-2 font-medium ${isToday ? 'text-white' : 'text-neutral-500'}">${day.label}</span>
          </div>`;
      })}
            </div>
          </div>

          <!-- CALENDAR -->
          <div class="calendar bg-neutral-800/50 rounded-3xl p-6 border border-purple-500/10 hover:border-purple-500/20 transition-colors">
            <div class="cal-nav flex justify-between items-center mb-6 px-2">
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span class="cal-title font-bold text-white">${monthName}</span>
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(1)}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="cal-grid grid grid-cols-7 gap-1.5 sm:gap-2">
              ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="cal-hdr text-center text-[10px] font-bold text-neutral-500 mb-2">${d}</div>`)}
              ${this.renderCalendarDays(this._currentMonth, workMode)}
            </div>
          </div>

        ${this._detailOpen ? this._renderDayDetail() : ""}

      </div>
    `;
  }

  renderCalendarDays(date, workMode) {
    const days = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const today = formatDateLocal(new Date());

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    for (let i = 0; i < startOffset; i++) days.push(html`<div class="cal-empty aspect-square rounded-xl opacity-0 cursor-default"></div>`);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dStr = formatDateLocal(new Date(date.getFullYear(), date.getMonth(), i));
      const dd = this._data[dStr];
      const isToday = dStr === today;
      const target = dd?.target || 0;
      const duration = dd?.duration || 0;

      // Calculate dominant work mode from sessions
      let offHours = 0;
      let hmHours = 0;
      if (dd?.sessions?.length > 0) {
        dd.sessions.forEach(s => {
          const dur = (s.duration || 0) / 3600;
          if (s.location === 'home') hmHours += dur;
          else offHours += dur;
        });
      } else if (duration > 0 && dd?.type !== 'sick' && dd?.type !== 'vacation') {
        // Legacy fallback: no sessions, assume office
        offHours = duration / 3600;
      }
      const dominantMode = hmHours > offHours ? 'home' : 'office';

      let bgCls = "bg-neutral-800/40 hover:bg-neutral-700/80";
      // Heute: Rand-Farbe basierend auf dominantem Modus des Tages
      let borderCls = "border border-neutral-700/30";
      if (isToday) {
        borderCls = dominantMode === 'home'
          ? "border border-purple-500/80 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "border border-blue-500/80 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
      }

      let dayTextSize = "text-sm";
      let dayFontWeight = "font-bold";

      let dayColor = "text-neutral-400";
      let subColor = "text-neutral-500";
      let subText = "";

      // FARB-LOGIK (Dominanz-Regel)
      if (dd?.type === 'sick') {
        // Krank überschreibt alles
        dayColor = "text-rose-400";
        subColor = "text-rose-500";
        subText = "Krank";
      } else if (dd?.type === 'vacation') {
        // Urlaub überschreibt Arbeitszeit
        dayColor = "text-amber-400";
        subColor = "text-amber-500";
        subText = "Urlaub";
      } else if (duration > 0) {
        // Arbeitstag mit Stunden – Farbe nach dominantem Modus
        subText = (duration / 3600).toFixed(1) + "h";
        dayColor = dominantMode === 'home' ? "text-purple-400" : "text-blue-400";
        subColor = dominantMode === 'home' ? "text-purple-400" : "text-blue-400";
      } else if (target > 0) {
        // Arbeitstag ohne Stunden
        subText = (target / 3600).toFixed(1) + "h";
      }

      days.push(html`
          <div class="cal-cell aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-colors ${bgCls} ${borderCls}" @click=${() => this.openDayDetail(dStr, dd)}>
            <span class="${dayTextSize} ${dayFontWeight} ${dayColor}">${i}</span>
            ${subText ? html`<span class="text-[10px] font-bold tracking-wider ${subColor} mt-0.5">
              ${subText}
            </span>` : ''}
          </div>
        `);
    }

    const totalCells = days.length;
    const remaining = 42 - totalCells;
    for (let i = 0; i < remaining; i++) {
      days.push(html`<div class="cal-empty aspect-square rounded-xl opacity-0 cursor-default"></div>`);
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
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all" @click=${this.closeDayDetail}>
        <div class="bg-[#1a1f2b] border border-neutral-700/50 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" @click=${e => e.stopPropagation()}>
          
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex justify-between items-center relative">
            <h3 class="text-lg font-bold text-white">${fmtDate(this._detailDate)}</h3>
            <button class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition" @click=${this.closeDayDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
            
            <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Typ</div>
            <div class="relative flex w-full bg-[#13161f] rounded-xl p-1 border border-neutral-800 shadow-inner mb-4">
                <button @click=${() => { this._editType = 'work'; this._autoSave(); }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === 'work' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20 shadow-sm' : 'text-neutral-500 hover:text-neutral-400 border border-transparent'}">
                    Arbeit
                </button>
                <button @click=${() => { this._editType = 'vacation'; this._autoSave(); }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === 'vacation' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20 shadow-sm' : 'text-neutral-500 hover:text-neutral-400 border border-transparent'}">
                    Urlaub
                </button>
                <button @click=${() => { this._editType = 'sick'; this._autoSave(); }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === 'sick' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20 shadow-sm' : 'text-neutral-500 hover:text-neutral-400 border border-transparent'}">
                    Krank
                </button>
            </div>

            ${this._editType === 'work' ? html`
            <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-4 mb-2">Aufgezeichnete Zeiten</div>
            
            <div class="flex flex-col gap-2">
              ${sessions.map((s, i) => html`
                <div class="relative flex items-center gap-2 sm:gap-3 p-2 bg-neutral-800/40 border border-neutral-700/50 rounded-2xl group transition-all">
                  
                  <!-- Modus Button (Links als großes Icon Quadrat) -->
                  <button @click=${() => { s.location = (s.location || 'office') === 'home' ? 'office' : 'home'; this.requestUpdate(); this._autoSave(); }}
                          class="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${s.location === 'home' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}">
                    ${s.location === 'home' ? html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` : html`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`}
                  </button>
                  
                  <!-- Zeit-Pille (Mitte) -->
                  <div class="flex-1 flex items-center bg-[#13161f] rounded-xl border border-neutral-800 p-1 shadow-inner">
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Von</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" 
                             .value=${new Date(s.start).toTimeString().slice(0, 5)} 
                             @change=${(e) => { s.start = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); this._autoSave(); }}>
                    </div>
                    <div class="w-px h-8 bg-neutral-800 mx-1"></div>
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Bis</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" 
                             .value=${new Date(s.end).toTimeString().slice(0, 5)} 
                             @change=${(e) => { s.end = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); this._autoSave(); }}>
                    </div>
                  </div>

                  <!-- Löschen Button (Rechts) -->
                  <button class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          @click=${() => this.deleteSession(i)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              `)}
              ${sessions.length === 0 && !this._addFormOpen ? html`<div class="text-neutral-500 text-sm text-center py-4">Keine Einträge</div>` : ""}
              
              ${this._addFormOpen ? html`
                <div class="relative flex items-center gap-2 sm:gap-3 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mt-2">
                  <button class="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all bg-blue-500/10 text-blue-400 border border-blue-500/20" id="new-loc-btn" @click=${(e) => { const btn = e.currentTarget; const isHome = btn.dataset.loc === 'home'; btn.dataset.loc = isHome ? 'office' : 'home'; this.requestUpdate(); }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                  </button>
                  <div class="flex-1 flex items-center bg-[#13161f] rounded-xl border border-neutral-800 p-1 shadow-inner">
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Von</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" id="new-start" value="08:00">
                    </div>
                    <div class="w-px h-8 bg-neutral-800 mx-1"></div>
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Bis</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0" id="new-end" value="16:00">
                    </div>
                  </div>
                  <button class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors" @click=${() => { const locBtn = this.renderRoot.querySelector('#new-loc-btn'); const loc = locBtn?.dataset.loc === 'home' ? 'home' : 'office'; this.addSession(this.renderRoot.querySelector('#new-start').value, this.renderRoot.querySelector('#new-end').value, loc); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                  </button>
                </div>
              ` : html`
                <button class="w-full border border-dashed border-neutral-700/50 text-neutral-400 p-3 rounded-xl text-sm font-semibold hover:text-white hover:border-neutral-500 hover:bg-neutral-800/30 transition flex items-center justify-center gap-2 mt-2" @click=${() => this._addFormOpen = true}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Eintrag hinzufügen
                </button>
              `}
            </div>
            ` : html`
            <div class="py-8 mt-6 text-center flex flex-col items-center justify-center opacity-70 border border-dashed border-neutral-800 rounded-xl">
                <p class="text-xs text-neutral-400">
                    Der Tag ist als <strong class="${this._editType === 'vacation' ? 'text-amber-400' : 'text-rose-400'}">${this._editType === 'vacation' ? 'Urlaub' : 'Krank'}</strong> markiert. <br/>
                    Sollzeit für diesen Tag ist 0h.
                </p>
            </div>
            `}
            
            <!-- Spacing inside body before footer -->
            <div class="h-6"></div>
          </div>

          <!-- Footer -->
          <div class="p-6 bg-[#151923] border-t border-neutral-800/80">
              <div class="flex justify-center items-center gap-6 mb-6">
                 <div class="flex flex-col items-end">
                     <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Arbeitszeit</span>
                     <span class="text-2xl font-light text-white font-mono">${totalH}h</span>
                 </div>
                 <div class="h-8 w-px bg-neutral-800"></div>
                 <div class="flex flex-col items-start">
                     <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Soll</span>
                     <span class="text-2xl font-light text-neutral-400 font-mono">${targetH}h</span>
                 </div>
              </div>
              
              <button class="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${this._editType === 'work' ? 'bg-purple-600 hover:bg-purple-500 shadow-[0_4px_20px_rgba(147,51,234,0.3)]' : this._editType === 'vacation' ? 'bg-amber-600 hover:bg-amber-500 shadow-[0_4px_20px_rgba(217,119,6,0.3)]' : 'bg-rose-600 hover:bg-rose-500 shadow-[0_4px_20px_rgba(225,29,72,0.3)]'}" @click=${this.closeDayDetail}>
                  Speichern
              </button>
          </div>

        </div>
      </div>
    `;
  }

  static get styles() {
    return [unsafeCSS(tailwindCss)];
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
