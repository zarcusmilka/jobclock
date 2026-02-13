
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace") || customElements.get("hc-main") || document.createElement("div"));
const html = LitElement.prototype.html || ((strings, ...values) => strings[0]);
const css = LitElement.prototype.css || ((strings, ...values) => strings[0]);

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class JobClockCard extends (customElements.get("ha-panel-lovelace") ? LitElement : HTMLElement) {
  static get properties() {
    console.info("%c JobClock Card v1.3.6 Loaded ", "color: white; background: #6366f1; font-weight: bold;");
    return {
      hass: {},
      config: {},
      _data: { state: true },
      _currentMonth: { state: true },
      _loading: { state: true },
      _editorOpen: { state: true },
      _editDate: { state: true },
      _editDuration: { state: true },
      _editType: { state: true },
    };
  }

  constructor() {
    super();
    this._data = {};
    this._currentMonth = new Date();
    this._loading = false;
    this._editorOpen = false;
    this._entry_id = null;
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    this._timer = setInterval(() => {
      if (this.config?.entity && this.hass?.states[this.config.entity]?.state === 'working') {
        this.requestUpdate();
      }
    }, 1000);
  }

  disconnectedCallback() {
    if (this._timer) clearInterval(this._timer);
    if (super.disconnectedCallback) super.disconnectedCallback();
  }

  setConfig(config) { this.config = config; }
  getCardSize() { return 10; }

  updated(changedProps) {
    if (changedProps.has("config")) {
      this._entry_id = null;
      this._data = {};
      this.requestUpdate();
    }
    if (changedProps.has("config") || changedProps.has("hass")) {
      if (!this._entry_id && this.config?.entity && this.hass?.states[this.config.entity]) {
        const stateObj = this.hass.states[this.config.entity];
        if (stateObj.attributes?.entry_id) {
          this._entry_id = stateObj.attributes.entry_id;
          this.fetchData();
        }
      }
    }
  }

  async fetchData() {
    if (!this._entry_id || !this.hass) return;
    this._loading = true;
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const startDate = formatDateLocal(new Date(year, month, 1));
    const endDate = formatDateLocal(new Date(year, month + 1, 0));
    try {
      const result = await this.hass.callWS({
        type: "jobclock/get_data", entry_id: this._entry_id,
        start_date: startDate, end_date: endDate
      });
      const map = {};
      if (Array.isArray(result)) result.forEach(d => map[d.date] = d);
      this._data = map;
    } catch (e) { console.error("JobClock Error", e); }
    finally { this._loading = false; this.requestUpdate(); }
  }

  changeMonth(delta) {
    const d = new Date(this._currentMonth);
    d.setMonth(d.getMonth() + delta);
    this._currentMonth = d;
    this.fetchData();
  }

  openEditor(dateStr, currentData) {
    this._editDate = dateStr;
    this._editDuration = currentData ? (currentData.duration / 3600).toFixed(2) : "0.00";
    this._editType = currentData ? currentData.type : "work";
    this._editorOpen = true;
  }

  closeEditor() { this._editorOpen = false; this._editDate = null; }

  async saveEntry() {
    if (!this._editDate || !this._entry_id) return;
    await this.hass.callWS({
      type: "jobclock/update_entry", entry_id: this._entry_id,
      date: this._editDate, duration: parseFloat(this._editDuration) * 3600,
      status_type: this._editType
    });
    this.closeEditor();
    this.fetchData();
  }

  exportToCSV() {
    const rows = [["Date", "Duration (sec)", "Duration (hours)", "Type", "Start", "End"]];
    Object.keys(this._data).sort().forEach(date => {
      const day = this._data[date];
      if (day.sessions?.length > 0) day.sessions.forEach(s => rows.push([date, s.duration.toFixed(0), (s.duration / 3600).toFixed(2), day.type, s.start, s.end]));
      else if (day.duration > 0) rows.push([date, day.duration.toFixed(0), (day.duration / 3600).toFixed(2), day.type, "", ""]);
    });
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n"));
    link.download = `jobclock_export_${formatDateLocal(new Date())}.csv`;
    link.click();
  }

  _toggleWork() {
    const stateObj = this.config?.entity ? this.hass.states[this.config.entity] : null;
    const sw = stateObj?.attributes?.switch_entity;
    if (sw) this.hass.callService("homeassistant", "toggle", { entity_id: sw });
    else alert("Bitte konfiguriere einen Schalter in den Einstellungen.");
  }

  _showSettings() {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: this.config.entity };
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass) return html`<div>Loading...</div>`;
    const stateObj = this.config?.entity ? this.hass.states[this.config.entity] : null;
    const friendlyName = stateObj?.attributes?.friendly_name || "JobClock";
    const switchEntity = stateObj?.attributes?.switch_entity;
    const isWorking = stateObj?.state === "working";
    const isHO = switchEntity ? this.hass.states[switchEntity]?.state === 'on' : false;

    const monthName = this._currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthStr = formatDateLocal(this._currentMonth).slice(0, 7);

    let totalSeconds = 0, totalTarget = 0;
    Object.keys(this._data).forEach(k => {
      if (k.startsWith(monthStr)) {
        totalSeconds += this._data[k].duration || 0;
        totalTarget += this._data[k].target || 0;
      }
    });

    const sessionStart = stateObj?.attributes?.session_start;
    let timerDisplay = "00:00";
    let subText = "Bereit";

    if (isWorking && sessionStart) {
      const diff = Math.floor((Date.now() - new Date(sessionStart).getTime()) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      subText = "Läuft...";
    } else {
      const todayData = this._data[formatDateLocal(new Date())];
      if (todayData?.duration) {
        const h = Math.floor(todayData.duration / 3600);
        const m = Math.floor((todayData.duration % 3600) / 60);
        timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        subText = "Heute";
      }
    }

    return html`
      <ha-card class="${isWorking ? 'is-working' : ''}">
        <!-- Compact Header -->
        <div class="card-header">
          <div class="brand">
            <ha-icon icon="mdi:briefcase-clock"></ha-icon>
            <span>${friendlyName.replace("JobClock ", "")}</span>
          </div>
          <div class="header-actions">
            <ha-icon-button icon="mdi:export-variant" @click=${this.exportToCSV}></ha-icon-button>
            <ha-icon-button icon="mdi:cog" @click=${this._showSettings}></ha-icon-button>
          </div>
        </div>

        <!-- Horizontal Hero: Timer left, Controls right -->
        <div class="hero">
          <div class="glass-orb ${isWorking ? 'active' : ''}">
            <div class="orb-content">
              <span class="timer">${timerDisplay}</span>
              <span class="status-badge ${isWorking ? 'working' : 'idle'}">${isWorking ? "● REC" : "PAUSE"}</span>
            </div>
          </div>

          <div class="hero-controls">
            <button class="action-btn ${isWorking ? 'stop' : 'start'}" @click=${this._toggleWork}>
              <ha-icon icon="${isWorking ? 'mdi:stop' : 'mdi:play'}"></ha-icon>
              ${isWorking ? "Stop" : "Start"}
            </button>
            ${switchEntity ? html`
              <button class="action-btn mode ${isHO ? 'ho-active' : ''}" @click=${() => this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity })}>
                <ha-icon icon="${isHO ? 'mdi:home' : 'mdi:office-building'}"></ha-icon>
                ${isHO ? "Home" : "Office"}
              </button>
            ` : ''}
            <span class="sub-label">${subText}</span>
          </div>
        </div>

        <!-- Inline Stats Row -->
        <div class="stats-row">
          <div class="stat"><span class="sv">${(totalTarget / 3600).toFixed(1)}h</span><span class="sl">SOLL</span></div>
          <div class="stat"><span class="sv">${(totalSeconds / 3600).toFixed(1)}h</span><span class="sl">IST</span></div>
          <div class="stat"><span class="sv ${(totalSeconds - totalTarget) >= 0 ? 'pos' : 'neg'}">${(totalSeconds - totalTarget) >= 0 ? '+' : ''}${((totalSeconds - totalTarget) / 3600).toFixed(1)}h</span><span class="sl">SALDO</span></div>
        </div>

        <!-- Calendar -->
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

        ${this._editorOpen ? this._renderEditor() : ""}
      </ha-card>
    `;
  }

  renderCalendarDays(date) {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const total = new Date(year, month + 1, 0).getDate();
    const days = [];
    const todayStr = formatDateLocal(new Date());

    for (let i = 0; i < offset; i++) days.push(html`<div class="cal-cell empty"></div>`);

    for (let i = 1; i <= total; i++) {
      const dStr = formatDateLocal(new Date(year, month, i));
      const dd = this._data[dStr];
      let cls = "cal-cell";
      if (dStr === todayStr) cls += " today";
      if (dd?.type === 'vacation') cls += " vacation";
      if (dd?.type === 'sick') cls += " sick";
      if (dd?.duration > 0) cls += " has-data";

      days.push(html`
        <div class="${cls}" @click=${() => this.openEditor(dStr, dd)}>
          <span class="dn">${i}</span>
          ${dd?.duration > 0 || (dd?.type && dd?.type !== 'work') ? html`
            <span class="dt">${dd?.type === 'vacation' ? '🏝️' : dd?.type === 'sick' ? '🤒' : (dd?.duration / 3600).toFixed(1) + 'h'}</span>
          ` : ""}
        </div>
      `);
    }
    return days;
  }

  _renderEditor() {
    return html`
      <div class="modal-overlay" @click=${this.closeEditor}>
        <div class="modal-content" @click=${e => e.stopPropagation()}>
          <h3>Eintrag bearbeiten (${this._editDate})</h3>
          <div class="input-field">
            <label>Dauer (Stunden)</label>
            <input type="number" step="0.1" .value=${this._editDuration} @input=${e => this._editDuration = e.target.value}>
          </div>
          <div class="input-field">
            <label>Typ</label>
            <select .value=${this._editType} @change=${e => this._editType = e.target.value}>
              <option value="work">Arbeit</option>
              <option value="vacation">Urlaub</option>
              <option value="sick">Krank</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn secondary" @click=${this.closeEditor}>Abbrechen</button>
            <button class="btn primary" @click=${this.saveEntry}>Speichern</button>
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
        border: 1px solid var(--jc-border);
        box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
        overflow: hidden;
        transition: border-color 0.4s ease;
      }

      /* Visual feedback: glowing border when working */
      ha-card.is-working {
        border-color: var(--jc-success);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.15), 0 20px 40px -12px rgba(0,0,0,0.5);
      }

      /* Header */
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .brand { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; font-weight: 700; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .brand ha-icon { --mdc-icon-size: 22px; color: #818cf8; -webkit-text-fill-color: initial; }
      .header-actions ha-icon-button { color: var(--jc-dim); }

      /* Hero: horizontal layout */
      .hero {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 12px;
        padding: 12px;
        background: var(--jc-glass);
        border: 1px solid var(--jc-border);
        border-radius: 16px;
      }

      .glass-orb {
        width: 100px; height: 100px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.08);
        border: 2px solid var(--jc-border);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: all 0.4s ease;
      }
      .glass-orb.active {
        border-color: var(--jc-success);
        background: rgba(16, 185, 129, 0.1);
        animation: pulse-green 2s infinite;
      }

      @keyframes pulse-green {
        0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
        70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
        100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }

      .orb-content { display: flex; flex-direction: column; align-items: center; }
      .timer { font-size: 1.4rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.5px; }
      .status-badge {
        font-size: 0.55rem; font-weight: 700; letter-spacing: 1.5px;
        padding: 2px 8px; border-radius: 6px; margin-top: 2px;
      }
      .status-badge.working { background: rgba(16, 185, 129, 0.2); color: var(--jc-success); }
      .status-badge.idle { background: rgba(148, 163, 184, 0.15); color: var(--jc-dim); }

      .hero-controls {
        display: flex; flex-direction: column; gap: 8px; flex: 1;
      }
      .action-btn {
        height: 40px; border-radius: 12px;
        border: 1px solid var(--jc-border);
        background: var(--jc-glass); color: var(--jc-text);
        font-weight: 600; font-size: 0.85rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.2s ease;
      }
      .action-btn.start { background: var(--jc-success); border: none; color: white; }
      .action-btn.start:hover { background: #059669; transform: scale(1.02); }
      .action-btn.stop { background: var(--jc-danger); border: none; color: white; animation: btn-pulse 1.5s infinite; }
      .action-btn.stop:hover { background: #dc2626; }
      .action-btn.mode { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); }
      .action-btn.ho-active { background: rgba(99,102,241,0.2); border-color: var(--jc-primary); color: #a5b4fc; }
      .sub-label { font-size: 0.7rem; color: var(--jc-dim); text-align: center; }

      @keyframes btn-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
        50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      }

      /* Stats Row */
      .stats-row {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        margin-bottom: 12px;
      }
      .stat {
        background: var(--jc-glass); padding: 8px 4px;
        border-radius: 12px; border: 1px solid var(--jc-border);
        display: flex; flex-direction: column; align-items: center;
      }
      .sv { font-size: 1rem; font-weight: 700; }
      .sl { font-size: 0.6rem; color: var(--jc-dim); text-transform: uppercase; letter-spacing: 1px; }
      .pos { color: var(--jc-success); }
      .neg { color: var(--jc-danger); }

      /* Calendar */
      .calendar {
        background: var(--jc-card); border-radius: 14px;
        padding: 12px; border: 1px solid var(--jc-border);
      }
      .cal-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .cal-title { font-size: 0.95rem; font-weight: 700; }
      .nav-btn { background: none; border: none; color: var(--jc-text); cursor: pointer; padding: 4px; border-radius: 8px; }
      .nav-btn:hover { background: rgba(255,255,255,0.05); }
      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
      .cal-hdr { text-align: center; font-size: 0.7rem; color: var(--jc-dim); font-weight: 600; padding: 4px 0; }

      .cal-cell {
        aspect-ratio: 1;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border-radius: 8px;
        background: rgba(255,255,255,0.015);
        cursor: pointer;
        font-size: 0.85rem;
        transition: background 0.15s;
        position: relative;
      }
      .cal-cell:hover { background: rgba(255,255,255,0.08); }
      .cal-cell.today {
        border: 2px solid var(--jc-primary);
        background: rgba(99, 102, 241, 0.12);
        font-weight: 700;
      }
      .cal-cell.has-data { background: rgba(99, 102, 241, 0.06); }
      .cal-cell.vacation { background: rgba(16, 185, 129, 0.1); }
      .cal-cell.sick { background: rgba(239, 68, 68, 0.1); }
      .dn { font-weight: 500; }
      .dt { font-size: 0.55rem; color: var(--jc-dim); line-height: 1; }

      /* Modal */
      .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .modal-content { background: #1e293b; padding: 24px; border-radius: 20px; width: 90%; max-width: 400px; }
      .modal-content h3 { margin-top: 0; }
      .input-field { margin-bottom: 16px; }
      .input-field label { display: block; margin-bottom: 4px; font-size: 0.8rem; color: var(--jc-dim); }
      .input-field input, .input-field select { width: 100%; height: 44px; background: #0f172a; border: 1px solid var(--jc-border); border-radius: 12px; color: white; padding: 0 12px; box-sizing: border-box; }
      .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
      .btn { padding: 10px 20px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }
      .btn.primary { background: var(--jc-primary); color: white; }
      .btn.secondary { background: transparent; color: var(--jc-dim); border: 1px solid var(--jc-border); }

      /* Mobile tweaks */
      @media (max-width: 450px) {
        ha-card { padding: 12px; }
        .hero { gap: 14px; padding: 10px; }
        .glass-orb { width: 85px; height: 85px; }
        .timer { font-size: 1.2rem; }
        .stats-row { gap: 6px; margin-bottom: 10px; }
        .stat { padding: 6px 2px; }
        .sv { font-size: 0.9rem; }
        .calendar { padding: 10px; }
        .cal-cell { font-size: 0.8rem; }
      }
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
