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

const fmtTime = (iso) => {
  if (!iso) return "00:00";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const fmtDur = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

class JobClockCard extends (customElements.get("ha-panel-lovelace") ? LitElement : HTMLElement) {
  static get properties() {
    console.info("%c JobClock Card v1.4.1 Loaded ", "color: white; background: #6366f1; font-weight: bold;");
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
    const d = new Date(this._currentMonth);
    d.setMonth(d.getMonth() + dir);
    this._currentMonth = d;
    this.fetchData();
  }

  openDayDetail(date, data) {
    this._detailDate = date;
    this._detailData = data || { duration: 0, type: "work", sessions: [] };
    this._detailOpen = true;
    this._editorOpen = false;
    this._addFormOpen = false;
  }

  closeDayDetail() {
    this._detailOpen = false;
  }

  openEditor() {
    this._editSessions = JSON.parse(JSON.stringify(this._detailData?.sessions || []));
    this._editType = this._detailData?.type || "work";
    this._editorOpen = true;
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

  async saveSessions() {
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
    this._editorOpen = false;
    this.fetchData();
  }

  deleteSession(idx) {
    this._editSessions = this._editSessions.filter((_, i) => i !== idx);
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
    if (!this.hass || !this.config) return html``;
    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) return html`<ha-alert alert-type="error">Sensor nicht gefunden</ha-alert>`;

    const isWorking = stateObj.attributes.is_working;
    const sessionStart = stateObj.attributes.session_start;
    const switchEntity = stateObj.attributes.switch_entity;
    const isHO = switchEntity ? this.hass.states[switchEntity]?.state === "on" : false;
    const friendlyName = stateObj.attributes.friendly_name || "JobClock";

    const monthName = this._currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

    let totalSeconds = 0;
    let totalTarget = 0;
    Object.values(this._data).forEach(d => {
      totalSeconds += d.duration || 0;
      totalTarget += d.target || 0;
    });

    let timerDisplay = "00:00";
    if (isWorking && sessionStart) {
      const diff = Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      const todayData = this._data[formatDateLocal(new Date())];
      if (todayData?.duration) {
        const h = Math.floor(todayData.duration / 3600);
        const m = Math.floor((todayData.duration % 3600) / 60);
        timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
    }

    return html`
      <ha-card class="${isWorking ? 'is-working' : ''}">
        <div class="card-header">
          <div class="brand">
            <ha-icon icon="mdi:briefcase-clock"></ha-icon>
            <span>JobClock</span>
          </div>
          <div class="header-actions">
            <ha-icon-button icon="mdi:export-variant" @click=${this.exportToCSV}></ha-icon-button>
            <ha-icon-button icon="mdi:cog" @click=${this._showSettings}></ha-icon-button>
          </div>
        </div>

        <div class="hero ${isWorking ? 'working' : ''}">
          <div class="glass-orb ${isWorking ? 'active' : ''}">
            <div class="orb-content">
              <span class="timer">${timerDisplay}</span>
              <span class="status-badge ${isWorking ? 'on' : 'off'}">${isWorking ? "● REC" : "PAUSE"}</span>
            </div>
          </div>
          <div class="hero-controls">
            <button class="action-btn ${isWorking ? 'stop' : 'start'}" @click=${this._manualToggle}>
              <ha-icon icon="${isWorking ? 'mdi:stop' : 'mdi:play'}"></ha-icon>
              ${isWorking ? "Stop" : "Start"}
            </button>
            ${switchEntity ? html`
              <button class="action-btn mode ${isHO ? 'ho-active' : ''}" @click=${() => this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity })}>
                <ha-icon icon="${isHO ? 'mdi:home' : 'mdi:office-building'}"></ha-icon>
                ${isHO ? "Home" : "Office"}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="stats-row">
          <div class="stat"><span class="sv">${(totalTarget / 3600).toFixed(1)}h</span><span class="sl">SOLL</span></div>
          <div class="stat"><span class="sv">${(totalSeconds / 3600).toFixed(1)}h</span><span class="sl">IST</span></div>
          <div class="stat"><span class="sv ${(totalSeconds - totalTarget) >= 0 ? 'pos' : 'neg'}">${(totalSeconds - totalTarget) >= 0 ? '+' : ''}${((totalSeconds - totalTarget) / 3600).toFixed(1)}h</span><span class="sl">SALDO</span></div>
        </div>

        <div class="calendar">
          <div class="cal-nav">
            <button class="nav-btn" @click=${() => this.changeMonth(-1)}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <span class="cal-title">${monthName}</span>
            <button class="nav-btn" @click=${() => this.changeMonth(1)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </div>
          <div class="cal-grid">
            ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="cal-hdr">${d}</div>`)}
            ${this.renderCalendarDays(this._currentMonth)}
          </div>
        </div>

        ${this._detailOpen ? this._renderDayDetail() : ""}
      </ha-card>
    `;
  }

  renderCalendarDays(date) {
    const days = [];
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const today = formatDateLocal(new Date());

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    for (let i = 0; i < startOffset; i++) days.push(html`<div class="cal-empty"></div>`);

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dStr = formatDateLocal(new Date(date.getFullYear(), date.getMonth(), i));
      const dd = this._data[dStr];
      const isToday = dStr === today;
      const cls = `cal-cell ${isToday ? 'today' : ''} ${dd?.type || ''}`;

      const isWork = dd?.type === 'work' || !dd?.type;
      const target = dd?.target || 0;
      const duration = dd?.duration || 0;
      let timeColor = "";
      if (duration > 0) {
        timeColor = duration >= target ? "clr-good" : "clr-bad";
      }

      days.push(html`
          <div class="${cls}" @click=${() => this.openDayDetail(dStr, dd)}>
            <span class="dn ${timeColor}">${i}</span>
            ${dd?.duration > 0 || (dd?.type && dd?.type !== 'work') ? html`
              <span class="dt ${timeColor}">${dd?.type === 'vacation' ? '🏝️' : dd?.type === 'sick' ? '🤒' : (dd?.duration / 3600).toFixed(1) + 'h'}</span>
            ` : ""}
          </div>
        `);
    }
    return days;
  }

  _renderDayDetail() {
    const dd = this._detailData;
    const isEditing = this._editorOpen;
    const sessions = isEditing ? this._editSessions : (dd?.sessions || []);
    const totalSeks = isEditing ? sessions.reduce((sum, s) => sum + ((new Date(s.end).getTime() - new Date(s.start).getTime()) / 1000), 0) : (dd?.duration || 0);
    const totalH = (totalSeks / 3600).toFixed(2);
    const targetH = ((dd?.target || 0) / 3600).toFixed(1);

    return html`
      <div class="modal-overlay" @click=${this.closeDayDetail}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <div class="modal-header">
            <h3>${fmtDate(this._detailDate)}</h3>
            <button class="close-btn" @click=${this.closeDayDetail}><ha-icon icon="mdi:close"></ha-icon></button>
          </div>

          <div class="session-section">
            <div class="section-label">Aufgezeichnete Zeiten</div>
            <div class="session-list">
              ${sessions.map((s, i) => html`
                <div class="session-row">
                  <span class="session-num">#${i + 1}</span>
                  <span class="session-loc">${s.location === 'home' ? '🏠' : '🏢'}</span>
                  ${isEditing ? html`
                    <div class="session-edit-group">
                        <input type="time" .value=${new Date(s.start).toTimeString().slice(0, 5)} @change=${e => { s.start = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); }}>
                        <span>—</span>
                        <input type="time" .value=${new Date(s.end).toTimeString().slice(0, 5)} @change=${e => { s.end = `${this._detailDate}T${e.target.value}:00`; this.requestUpdate(); }}>
                    </div>
                    <button class="row-action del" @click=${() => this.deleteSession(i)}><ha-icon icon="mdi:delete-outline"></ha-icon></button>
                  ` : html`
                    <span class="session-time">${fmtTime(s.start)} — ${fmtTime(s.end)}</span>
                    <span class="session-dur">${fmtDur(s.duration)}</span>
                  `}
                </div>
              `)}
              ${sessions.length === 0 && !this._addFormOpen ? html`<div class="no-sessions">Keine Einträge</div>` : ""}
              
              ${isEditing && this._addFormOpen ? html`
                <div class="session-row add-row">
                    <input type="time" id="new-start" value="08:00">
                    <span>—</span>
                    <input type="time" id="new-end" value="16:00">
                    <select id="new-loc"><option value="office">🏢 Büro</option><option value="home">🏠 Home</option></select>
                    <button class="row-action add" @click=${() => this.addSession(this.shadowRoot.getElementById('new-start').value, this.shadowRoot.getElementById('new-end').value, this.shadowRoot.getElementById('new-loc').value)}><ha-icon icon="mdi:check"></ha-icon></button>
                </div>
              ` : isEditing ? html`
                <button class="btn-add-line" @click=${() => this._addFormOpen = true}><ha-icon icon="mdi:plus"></ha-icon> Eintrag hinzufügen</button>
              ` : ""}
            </div>

            <div class="day-summary">
              <div class="sum-row"><span>Gesamt</span><span class="sum-val">${totalH}h</span></div>
              <div class="sum-row"><span>Soll</span><span class="sum-val">${targetH}h</span></div>
              <div class="sum-row">
                <span>Typ</span>
                ${isEditing ? html`
                    <select class="type-sel" .value=${this._editType} @change=${e => this._editType = e.target.value}>
                        <option value="work">Arbeit</option>
                        <option value="vacation">Urlaub</option>
                        <option value="sick">Krank</option>
                    </select>
                ` : html`<span class="sum-val type-badge ${dd?.type}">${dd?.type === 'vacation' ? 'Urlaub' : dd?.type === 'sick' ? 'Krank' : 'Arbeit'}</span>`}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            ${isEditing ? html`
                <button class="btn secondary" @click=${() => this._editorOpen = false}>Abbrechen</button>
                <button class="btn primary" @click=${this.saveSessions}>Speichern</button>
            ` : html`
                <button class="btn-full" @click=${this.openEditor}><ha-icon icon="mdi:pencil-outline"></ha-icon> Bearbeiten</button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        --jc-primary: #6366f1;
        --jc-success: #10b981;
        --jc-danger: #ef4444;
        --jc-bg: #0f172a;
        --jc-card: rgba(30, 41, 59, 0.7);
        --jc-glass: rgba(255, 255, 255, 0.03);
        --jc-border: rgba(255, 255, 255, 0.1);
        --jc-text: #f8fafc;
        --jc-dim: #94a3b8;
      }

      ha-card {
        background: var(--jc-bg);
        background-image: radial-gradient(circle at 50% -20%, #312e81 0%, transparent 60%);
        color: var(--jc-text);
        border-radius: 20px;
        padding: 16px;
        font-family: 'Inter', -apple-system, sans-serif;
        border: 2px solid var(--jc-border);
        box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
        overflow: hidden;
      }
      ha-card.is-working { border-color: var(--jc-success); box-shadow: 0 0 25px rgba(16, 185, 129, 0.15), 0 20px 40px -12px rgba(0,0,0,0.5); }

      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .brand { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 800; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .brand ha-icon { --mdc-icon-size: 22px; color: #818cf8; -webkit-text-fill-color: initial; }
      .header-actions ha-icon-button { color: var(--jc-dim); --mdc-icon-size: 18px; }

      .hero {
        display: flex; align-items: center; gap: 20px;
        margin-bottom: 12px; padding: 16px;
        background: var(--jc-glass); border: 1px solid var(--jc-border); border-radius: 18px;
      }
      .glass-orb {
        width: 110px; height: 110px; border-radius: 50%;
        background: rgba(99, 102, 241, 0.05); border: 2px solid var(--jc-border);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; position: relative;
      }
      .glass-orb.active { border-color: var(--jc-success); background: rgba(16, 185, 129, 0.08); animation: pulse-green 2s infinite; }
      @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

      .orb-content { display: flex; flex-direction: column; align-items: center; }
      .timer { font-size: 1.6rem; font-weight: 800; font-variant-numeric: tabular-nums; }
      .status-badge { font-size: 0.55rem; font-weight: 800; letter-spacing: 1.2px; padding: 2px 8px; border-radius: 6px; margin-top: 4px; }
      .status-badge.on { background: rgba(16, 185, 129, 0.2); color: var(--jc-success); }
      .status-badge.off { background: rgba(255,255,255,0.05); color: var(--jc-dim); }

      .hero-controls { display: flex; flex-direction: column; gap: 8px; flex: 1; }
      .action-btn {
        height: 38px; border-radius: 12px; border: 1px solid var(--jc-border);
        background: var(--jc-glass); color: white; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 700;
      }
      .action-btn.start { background: var(--jc-success); border: none; }
      .action-btn.stop { background: var(--jc-danger); border: none; }
      .action-btn.mode.ho-active { border-color: var(--jc-primary); color: var(--jc-primary); background: rgba(99, 102, 241, 0.1); }

      .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px; }
      .stat { background: var(--jc-glass); padding: 10px 4px; border-radius: 14px; border: 1px solid var(--jc-border); display: flex; flex-direction: column; align-items: center; }
      .sv { font-size: 1rem; font-weight: 800; }
      .sl { font-size: 0.55rem; color: var(--jc-dim); font-weight: 700; text-transform: uppercase; }
      .pos { color: var(--jc-success); }
      .neg { color: var(--jc-danger); }

      .calendar { background: var(--jc-glass); border-radius: 18px; padding: 14px; border: 1px solid var(--jc-border); }
      .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .cal-title { font-size: 0.9rem; font-weight: 800; }
      .nav-btn { background: none; border: none; color: white; cursor: pointer; }
      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
      .cal-hdr { text-align: center; font-size: 0.65rem; color: var(--jc-dim); font-weight: 800; }
      .cal-cell {
        aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        border-radius: 10px; background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s;
      }
      .cal-cell:hover { background: rgba(255,255,255,0.08); }
      .cal-cell.today { border: 2px solid var(--jc-primary); background: rgba(99, 102, 241, 0.1); }
      .dn { font-weight: 700; font-size: 0.9rem; }
      .dt { font-size: 0.6rem; font-weight: 600; }
      .clr-good { color: var(--jc-success); }
      .clr-bad { color: var(--jc-danger); }

      /* Modal */
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .modal-content { background: #1e293b; padding: 24px; border-radius: 24px; width: 92%; max-width: 440px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
      .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .close-btn { background: none; border: none; color: var(--jc-dim); cursor: pointer; }
      
      .session-section { margin-bottom: 20px; }
      .section-label { font-size: 0.7rem; color: var(--jc-dim); text-transform: uppercase; font-weight: 800; margin-bottom: 10px; }
      .session-list { display: flex; flex-direction: column; gap: 8px; }
      .session-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--jc-border); }
      .session-num { font-size: 0.7rem; color: var(--jc-primary); font-weight: 800; width: 24px; }
      .session-time { flex: 1; font-weight: 600; font-size: 0.9rem; }
      .session-dur { font-size: 0.8rem; color: var(--jc-dim); }
      
      .session-edit-group { display: flex; align-items: center; gap: 4px; flex: 1; }
      .session-edit-group input { background: #0f172a; border: 1px solid var(--jc-border); color: white; border-radius: 8px; padding: 4px; font-size: 0.85rem; width: 75px; }

      .row-action { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; }
      .row-action.del { color: var(--jc-danger); }
      .row-action.add { color: var(--jc-success); }
      .btn-add-line { width: 100%; border: 1px dashed var(--jc-border); background: none; color: var(--jc-dim); padding: 10px; border-radius: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; }
      .btn-add-line:hover { color: white; border-color: var(--jc-primary); }

      .add-row select { background: #0f172a; color: white; border: 1px solid var(--jc-border); border-radius: 8px; padding: 4px; font-size: 0.8rem; }

      .day-summary { border-top: 1px solid var(--jc-border); margin-top: 15px; padding-top: 15px; }
      .sum-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; }
      .sum-val { font-weight: 800; }
      .type-badge { padding: 2px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
      .type-badge.work { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
      .type-badge.vacation { background: rgba(16, 185, 129, 0.2); color: var(--jc-success); }
      .type-badge.sick { background: rgba(239, 68, 68, 0.2); color: var(--jc-danger); }

      .type-sel { background: #0f172a; color: white; border: 1px solid var(--jc-border); border-radius: 8px; padding: 4px 8px; }

      .modal-footer { margin-top: 20px; display: flex; gap: 12px; }
      .btn-full { width: 100%; background: var(--jc-glass); border: 1px solid var(--jc-border); color: white; padding: 12px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .btn-full:hover { background: rgba(255,255,255,0.08); }
      .btn { flex: 1; padding: 12px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; }
      .btn.primary { background: var(--jc-primary); color: white; }
      .btn.secondary { background: none; border: 1px solid var(--jc-border); color: var(--jc-dim); }
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
