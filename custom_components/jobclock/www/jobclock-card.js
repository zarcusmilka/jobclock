
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
    console.info("%c JobClock Card v1.3.3 Loaded ", "color: white; background: #6366f1; font-weight: bold;");
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

  setConfig(config) {
    this.config = config;
  }

  getCardSize() { return 10; }

  updated(changedProps) {
    if (changedProps.has("config")) {
      // Reset state for new entity to ensure data isolation
      this._entry_id = null;
      this._data = {};
      this.requestUpdate();
    }

    if (changedProps.has("config") || changedProps.has("hass")) {
      if (!this._entry_id && this.config?.entity && this.hass?.states[this.config.entity]) {
        const stateObj = this.hass.states[this.config.entity];
        if (stateObj.attributes && stateObj.attributes.entry_id) {
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
        type: "jobclock/get_data",
        entry_id: this._entry_id,
        start_date: startDate,
        end_date: endDate
      });
      const map = {};
      if (Array.isArray(result)) {
        result.forEach(d => map[d.date] = d);
      }
      this._data = map;
    } catch (e) {
      console.error("JobClock Error", e);
    } finally {
      this._loading = false;
      this.requestUpdate();
    }
  }

  changeMonth(delta) {
    const newDate = new Date(this._currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    this._currentMonth = newDate;
    this.fetchData();
  }

  openEditor(dateStr, currentData) {
    this._editDate = dateStr;
    this._editDuration = currentData ? (currentData.duration / 3600).toFixed(2) : "0.00";
    this._editType = currentData ? currentData.type : "work";
    this._editorOpen = true;
  }

  closeEditor() {
    this._editorOpen = false;
    this._editDate = null;
  }

  async saveEntry() {
    if (!this._editDate || !this._entry_id) return;
    const duration = parseFloat(this._editDuration) * 3600;
    await this.hass.callWS({
      type: "jobclock/update_entry",
      entry_id: this._entry_id,
      date: this._editDate,
      duration: duration,
      status_type: this._editType
    });
    this.closeEditor();
    this.fetchData();
  }

  exportToCSV() {
    const rows = [["Date", "Duration (sec)", "Duration (hours)", "Type", "Start", "End"]];
    const sortedDates = Object.keys(this._data).sort();
    sortedDates.forEach(date => {
      const day = this._data[date];
      if (day.sessions?.length > 0) {
        day.sessions.forEach(s => rows.push([date, s.duration.toFixed(0), (s.duration / 3600).toFixed(2), day.type, s.start, s.end]));
      } else if (day.duration > 0) {
        rows.push([date, day.duration.toFixed(0), (day.duration / 3600).toFixed(2), day.type, "", ""]);
      }
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `jobclock_export_${formatDateLocal(new Date())}.csv`;
    link.click();
  }

  render() {
    if (!this.hass) return html`<div>Loading Hass...</div>`;
    const stateObj = this.config?.entity ? this.hass.states[this.config.entity] : null;
    const friendlyName = stateObj?.attributes?.friendly_name || "JobClock";
    const switchEntity = stateObj?.attributes?.switch_entity;
    const isWorking = stateObj?.state === "working";
    const isHO = switchEntity ? this.hass.states[switchEntity]?.state === 'on' : false;

    const monthName = this._currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
    const monthStr = formatDateLocal(this._currentMonth).slice(0, 7);

    let totalSeconds = 0;
    let totalTarget = 0;
    Object.keys(this._data).forEach(k => {
      if (k.startsWith(monthStr)) {
        totalSeconds += this._data[k].duration || 0;
        totalTarget += this._data[k].target || 0;
      }
    });

    const sessionStart = stateObj?.attributes?.session_start;
    let timerDisplay = "00:00";
    let subText = "Bereit zur Arbeit";

    if (isWorking && sessionStart) {
      const start = new Date(sessionStart).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      subText = "Aktive Sitzung";
    } else {
      const todayStr = formatDateLocal(new Date());
      const todayData = this._data[todayStr];
      if (todayData) {
        const h = Math.floor(todayData.duration / 3600);
        const m = Math.floor((todayData.duration % 3600) / 60);
        timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        subText = "Heute gearbeitet";
      }
    }

    return html`
      <ha-card>
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

        <div class="hero">
          <div class="glass-orb ${isWorking ? 'active' : ''}" @click=${this._toggleWork}>
            <div class="orb-content">
              <span class="timer">${timerDisplay}</span>
              <span class="status-label">${isWorking ? "IM DIENST" : "ABWESEND"}</span>
              <span class="sub-label">${subText}</span>
            </div>
          </div>
          
          <div class="hero-actions">
            <button class="action-btn ${isWorking ? 'stop' : 'start'}" @click=${this._toggleWork}>
              <ha-icon icon="${isWorking ? 'mdi:stop' : 'mdi:play'}"></ha-icon>
              ${isWorking ? "Stop" : "Start"}
            </button>
            ${switchEntity ? html`
              <button class="action-btn mode ${isHO ? 'ho' : ''}" @click=${() => this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity })}>
                <ha-icon icon="mdi:home-city"></ha-icon>
                ${isHO ? "Home" : "Office"}
              </button>
            ` : ''}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <span class="val">${(totalTarget / 3600).toFixed(1)}h</span>
            <span class="lbl">Soll</span>
          </div>
          <div class="stat-item">
            <span class="val">${(totalSeconds / 3600).toFixed(1)}h</span>
            <span class="lbl">Ist</span>
          </div>
          <div class="stat-item">
            <span class="val ${(totalSeconds - totalTarget) >= 0 ? 'pos' : 'neg'}">
              ${(totalSeconds - totalTarget) >= 0 ? '+' : ''}${((totalSeconds - totalTarget) / 3600).toFixed(1)}h
            </span>
            <span class="lbl">Saldo</span>
          </div>
        </div>

        <div class="calendar-section">
          <div class="cal-header">
            <button class="nav-btn" @click=${() => this.changeMonth(-1)}><ha-icon icon="mdi:chevron-left"></ha-icon></button>
            <span class="cal-title">${monthName}</span>
            <button class="nav-btn" @click=${() => this.changeMonth(1)}><ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </div>
          <div class="cal-grid">
            ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="cal-day-name">${d}</div>`)}
            ${this.renderCalendarDays(this._currentMonth)}
          </div>
        </div>

        ${this._editorOpen ? this._renderEditor() : ""}
      </ha-card>
    `;
  }

  renderCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < startOffset; i++) days.push(html`<div class="cal-day empty"></div>`);

    const todayStr = formatDateLocal(new Date());
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = formatDateLocal(d);
      const dayData = this._data[dStr];
      let classes = "cal-day";
      if (dStr === todayStr) classes += " today";
      if (dayData?.type === 'vacation') classes += " vacation";
      if (dayData?.type === 'sick') classes += " sick";

      days.push(html`
          <div class="${classes}" @click=${() => this.openEditor(dStr, dayData)}>
            <span class="day-num">${i}</span>
            ${dayData?.duration > 0 || dayData?.type !== 'work' ? html`
              <span class="day-time">
                ${dayData?.type === 'vacation' ? '🏝️' : dayData?.type === 'sick' ? '🤒' : (dayData?.duration / 3600).toFixed(1) + 'h'}
              </span>
            ` : ""}
          </div>
        `);
    }
    return days;
  }

  _toggleWork() {
    const stateObj = this.config?.entity ? this.hass.states[this.config.entity] : null;
    const switchEntity = stateObj?.attributes?.switch_entity;
    if (switchEntity) this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity });
    else alert("Bitte konfiguriere einen Schalter in den Einstellungen.");
  }

  _showSettings() {
    const event = new Event("hass-more-info", { bubbles: true, composed: true });
    event.detail = { entityId: this.config.entity };
    this.dispatchEvent(event);
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
        --jc-glass-border: rgba(255, 255, 255, 0.1);
        --jc-text: #f8fafc;
        --jc-text-dim: #94a3b8;
      }

      ha-card {
        background: var(--jc-bg);
        background-image: radial-gradient(circle at 50% -20%, #312e81 0%, transparent 60%);
        color: var(--jc-text);
        border-radius: 24px;
        padding: 24px;
        font-family: 'Inter', -apple-system, sans-serif;
        border: 1px solid var(--jc-glass-border);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
      }

      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
      .brand { display: flex; align-items: center; gap: 12px; font-size: 1.25rem; font-weight: 700; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .brand ha-icon { --mdc-icon-size: 28px; color: #818cf8; -webkit-text-fill-color: initial; }
      .header-actions ha-icon-button { color: var(--jc-text-dim); }

      .hero { display: flex; flex-direction: column; align-items: center; gap: 32px; margin-bottom: 40px; }
      .glass-orb { width: 220px; height: 220px; border-radius: 50%; background: var(--jc-glass); border: 1px solid var(--jc-glass-border); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; transition: transform 0.3s; }
      .glass-orb.active { border-color: var(--jc-primary); animation: pulse 2s infinite; }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
        70% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
        100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      }

      .orb-content { display: flex; flex-direction: column; align-items: center; }
      .timer { font-size: 3rem; font-weight: 800; }
      .status-label { font-size: 0.75rem; color: var(--jc-primary); font-weight: 700; letter-spacing: 2px; }
      .sub-label { font-size: 0.875rem; color: var(--jc-text-dim); }

      .hero-actions { display: flex; gap: 16px; width: 100%; max-width: 320px; }
      .action-btn { flex: 1; height: 48px; border-radius: 16px; border: 1px solid var(--jc-glass-border); background: var(--jc-glass); color: var(--jc-text); font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
      .action-btn.start { background: var(--jc-success); border: none; }
      .action-btn.stop { background: var(--jc-danger); border: none; }
      .action-btn.ho { border-color: var(--jc-primary); color: var(--jc-primary); }

      .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
      .stat-item { background: var(--jc-glass); padding: 16px; border-radius: 20px; border: 1px solid var(--jc-glass-border); display: flex; flex-direction: column; align-items: center; }
      .stat-item .val { font-size: 1.25rem; font-weight: 700; }
      .stat-item .lbl { font-size: 0.75rem; color: var(--jc-text-dim); text-transform: uppercase; }
      .stat-item .pos { color: var(--jc-success); }
      .stat-item .neg { color: var(--jc-danger); }

      .calendar-section { background: var(--jc-card); border-radius: 20px; padding: 20px; border: 1px solid var(--jc-glass-border); }
      .cal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
      .cal-day-name { text-align: center; font-size: 0.75rem; color: var(--jc-text-dim); }
      .cal-day { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; background: rgba(255,255,255,0.02); cursor: pointer; }
      .cal-day:hover { background: rgba(255,255,255,0.08); }
      .cal-day.today { border: 1px solid var(--jc-primary); background: rgba(99, 102, 241, 0.1); }
      .cal-day.vacation { color: var(--jc-success); }
      .cal-day.sick { color: var(--jc-danger); }
      .day-time { font-size: 0.65rem; color: var(--jc-text-dim); }

      .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .modal-content { background: #1e293b; padding: 24px; border-radius: 20px; width: 90%; max-width: 400px; }
      .input-field { margin-bottom: 20px; }
      .input-field input, .input-field select { width: 100%; height: 44px; background: #0f172a; border: 1px solid var(--jc-glass-border); border-radius: 12px; color: white; padding: 0 12px; }
      .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
      .btn { padding: 10px 20px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }
      .btn.primary { background: var(--jc-primary); color: white; }
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
