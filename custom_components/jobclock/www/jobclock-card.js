
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace") || customElements.get("hc-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class JobClockCard extends LitElement {
  static get properties() {
    console.info("%c JobClock Card v1.2.3 Loaded ", "color: white; background: #34c759; font-weight: bold;");
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
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Please define a JobClock sensor entity");
    }
    this.config = config;
  }

  getCardSize() {
    return 8;
  }

  updated(changedProps) {
    if (changedProps.has("config")) {
      // Reset ONLY if entity changed (Fix infinite loop/flickering)
      const oldConfig = changedProps.get("config");
      if (oldConfig?.entity !== this.config?.entity) {
        this._entry_id = null;
        this._data = {};
        this.fetchData();
      }
    }
    if (changedProps.has("hass") && this.config.entity) {
      // Check if we need to load initial data
      if (!this._entry_id) {
        const stateObj = this.hass.states[this.config.entity];
        if (stateObj && stateObj.attributes.entry_id) {
          this._entry_id = stateObj.attributes.entry_id;
          this.fetchData();
        }
      }
    }
  }

  async fetchData() {
    if (!this._entry_id) return;
    this._loading = true;

    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();

    const startDate = new Date(year, month, 1, 12).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0, 12).toISOString().split('T')[0]; // Last day of month

    try {
      const result = await this.hass.callWS({
        type: "jobclock/get_data",
        entry_id: this._entry_id,
        start_date: startDate,
        end_date: endDate
      });

      // Map list to object for easier lookup
      const map = {};
      result.forEach(d => map[d.date] = d);
      this._data = map;
    } catch (e) {
      console.error("JobClock Error", e);
    } finally {
      this._loading = false;
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

    // Also force entity update if today
    // Not easily possible without trigger
  }

  exportToCSV() {
    const rows = [["Date", "Duration (sec)", "Duration (hours)", "Type", "Start", "End"]];

    // Flatten data including sessions
    const sortedDates = Object.keys(this._data).sort();
    sortedDates.forEach(date => {
      const day = this._data[date];
      if (day.sessions && day.sessions.length > 0) {
        day.sessions.forEach(s => {
          rows.push([
            date,
            s.duration.toFixed(0),
            (s.duration / 3600).toFixed(2),
            day.type,
            s.start,
            s.end
          ]);
        });
      } else if (day.duration > 0) {
        rows.push([
          date,
          day.duration.toFixed(0),
          (day.duration / 3600).toFixed(2),
          day.type,
          "",
          ""
        ]);
      }
    });

    const csvContent = "data:text/csv;charset=utf-8,"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jobclock_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  render() {
    if (!this._data || !this.config) return html``;

    const { _currentMonth: currentMonth, entity } = this;
    const today = new Date();
    const stateObj = this.hass.states[this.config.entity];
    const friendlyName = stateObj?.attributes?.friendly_name || "JobClock";

    // Configured Switch for HO
    const switchEntity = stateObj?.attributes?.switch_entity;
    const switchStateObj = switchEntity ? this.hass.states[switchEntity] : null;
    const isHO = switchStateObj?.state === 'on';

    const monthStr = currentMonth.toISOString().slice(0, 7);
    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Calculate Monthly Stats
    let totalSeconds = 0;
    let totalTarget = 0;

    Object.keys(this._data).forEach(k => {
      if (k.startsWith(monthStr)) {
        totalSeconds += this._data[k].duration;
        totalTarget += this._data[k].target;
      }
    });

    const deltaSeconds = totalSeconds - totalTarget;
    const displayHours = (totalSeconds / 3600).toFixed(1);
    const displayDelta = (deltaSeconds / 3600).toFixed(1);
    const deltaClass = deltaSeconds >= 0 ? "val-pos" : "val-neg";
    const deltaSign = deltaSeconds >= 0 ? "+" : "";

    // Timer / Active State
    const isWorking = stateObj?.state === "working";
    const sessionStart = stateObj?.attributes?.session_start;

    let timerDisplay = "00:00";
    let subText = "Geplant: 8h";

    if (isWorking && sessionStart) {
      // Calculate dynamic time
      const start = new Date(sessionStart).getTime();
      const now = new Date().getTime(); // Needs periodic refresh
      const diff = Math.floor((now - start) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      // Add previously stored duration for today to show TOTAL worked today?
      // Ideally we show session time in ring, and total today below.
      // For simplicity, let's show SESSION time in big letters.
      subText = "Aktive Sitzung";
    } else {
      // Show today's total if not working?
      const todayStr = today.toISOString().slice(0, 10);
      const todayData = this._data[todayStr];
      if (todayData) {
        const h = Math.floor(todayData.duration / 3600);
        const m = Math.floor((todayData.duration % 3600) / 60);
        timerDisplay = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        subText = "Heute gearbeitet";
      } else {
        timerDisplay = "Start";
        subText = "Bereit zur Arbeit";
      }
    }

    return html`
      <ha-card>
        <!-- HEADER -->
        <div class="header-row">
            <div class="app-title">
                <ha-icon icon="mdi:briefcase-clock-outline"></ha-icon>
                ${friendlyName.replace("JobClock ", "")}
            </div>
            <div style="display:flex; gap: 8px;">
                 <ha-icon-button class="icon-btn" icon="mdi:export-variant" @click=${() => this.exportToCSV()} title="Export"></ha-icon-button>
                 <ha-icon-button class="icon-btn" icon="mdi:dots-vertical" @click=${() => this._showSettings()}></ha-icon-button>
            </div>
        </div>

        <!-- HERO SECTION -->
        <div class="hero-section">
            <div class="timer-ring ${isWorking ? 'pulse' : ''}" @click=${this._toggleWork}>
                <div class="timer-time">${timerDisplay}</div>
                <div class="timer-status">${isWorking ? "Im Dienst" : "Abwesend"}</div>
                <div class="time-sub">${subText}</div>
            </div>
            
            <div class="actions-container">
                <button class="btn-pill ${isWorking ? 'btn-danger' : 'btn-success'}" @click=${this._toggleWork}>
                    <ha-icon icon="${isWorking ? 'mdi:stop-circle-outline' : 'mdi:play-circle-outline'}"></ha-icon>
                    ${isWorking ? "Stop" : "Start"}
                </button>
                
                ${switchEntity ? html`
                <button class="btn-pill" style="background: var(--jc-glass); border-color: ${isHO ? 'var(--jc-primary)' : 'var(--jc-glass-border)'}" 
                        @click=${() => this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity })}>
                    <ha-icon icon="mdi:home-city-outline" style="color: ${isHO ? 'var(--jc-primary)' : 'inherit'}"></ha-icon>
                    ${isHO ? "Home" : "Office"}
                </button>
                ` : ''}
            </div>
        </div>
        
        <!-- STATS STRIP -->
         <div class="stats-strip">
            <div class="stat-card">
                <div class="stat-val">${totalTarget ? (totalTarget / 3600).toFixed(1) + 'h' : '-'}</div>
                <div class="stat-label">Soll</div>
            </div>
            <div class="stat-card">
                <div class="stat-val">${displayHours}h</div>
                <div class="stat-label">Ist</div>
            </div>
            <div class="stat-card">
                <div class="stat-val ${deltaClass}">${deltaSign}${displayDelta}h</div>
                <div class="stat-label">Saldo</div>
            </div>
         </div>

        <!-- CALENDAR -->
        <div class="calendar-container">
            <div class="cal-nav">
                <ha-icon-button class="icon-btn" icon="mdi:chevron-left" @click=${() => this.changeMonth(-1)}></ha-icon-button>
                <div class="cal-title">${monthName}</div>
                <ha-icon-button class="icon-btn" icon="mdi:chevron-right" @click=${() => this.changeMonth(1)}></ha-icon-button>
            </div>
            
            <div class="cal-grid">
                ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="cal-day-header">${d}</div>`)}
                ${this.renderCalendarDays(currentMonth)}
            </div>
        </div>

        ${this._editorOpen ? this._renderEditor() : ""}
      </ha-card>
    `;
  }

  _toggleWork() {
    // We can't directly toggle "work" because it's state based on zone/switch.
    // BUT user asked for "Clock In" button.
    // If we have a switch entity configured as "Office Switch", we should toggle that?
    // OR if we are using Zone presence, we can't toggle that easily.
    // Let's assume the "Switch" is the master control if present.
    const stateObj = this.hass.states[this.config.entity];
    const switchEntity = stateObj?.attributes?.switch_entity;

    if (switchEntity) {
      this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity });
    } else {
      // Fallback or show toast
      alert("Bitte konfiguriere einen 'Schalter' in den Integrationseinstellungen, um manuelles Stempeln zu ermöglichen.");
    }
  }

  // Helper for calendar rendering (Refactored for new classes)
  renderCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Monday = 1, Sunday = 0. We want Monday first.
    // 0(Sun) -> 6, 1(Mon) -> 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      days.push(html`<div class="cal-day empty"></div>`);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = d.toISOString().slice(0, 10);
      const dayData = this._data[dStr];

      let durStr = "-";
      let deltaHtml = html``;
      let classes = "cal-day";

      if (dStr === todayStr) classes += " today";

      if (dayData) {
        const h = (dayData.duration / 3600).toFixed(1);
        durStr = `${h}h`;

        if (dayData.type === 'vacation') classes += " type-vacation";
        if (dayData.type === 'sick') classes += " type-sick";

        const delta = dayData.delta / 3600;
        if (delta !== 0) {
          const dClass = delta > 0 ? "stat-delta-pos" : "stat-delta-neg";
          const dSign = delta > 0 ? "+" : "";
          deltaHtml = html`<div class="day-delta ${dClass}">${dSign}${delta.toFixed(1)}</div>`;
        }
      }

      days.push(html`
            <div class="${classes}" @click=${() => this.openEditor(dStr, dayData)}>
                <div class="day-num">${i}</div>
                <div class="day-dur">${dayData?.type === 'vacation' ? html`<ha-icon icon="mdi:beach" style="--mdc-icon-size: 16px"></ha-icon>` : durStr}</div>
                ${deltaHtml}
            </div>
        `);
    }
    return days;
  }

  _showSettings() {
    const event = new Event("hass-more-info", {
      bubbles: true,
      composed: true,
    });
    event.detail = { entityId: this.config.entity };
    this.dispatchEvent(event);
  }

  _renderEditor() {
    const dayData = this._data[this._editDate];
    const sessions = dayData?.sessions || [];

    return html`
        <div class="editor-overlay">
            <div class="editor-dialog">
                <h3>Edit ${this._editDate}</h3>
                
                <div class="input-group">
                    <label>Stunden</label>
                    <input type="number" step="0.1" .value=${this._editDuration} 
                        @input=${(e) => this._editDuration = e.target.value}>
                </div>
                
                <div class="input-group">
                    <label>Typ</label>
                    <select .value=${this._editType} @change=${(e) => this._editType = e.target.value}>
                        <option value="work">Arbeit</option>
                        <option value="vacation">Urlaub</option>
                        <option value="sick">Krank</option>
                    </select>
                </div>

                ${sessions.length > 0 ? html`
                    <div class="sessions-list">
                        <label>Erfasste Sessions</label>
                        ${sessions.map(s => {
      const start = new Date(s.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(s.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      return html`
                                <div class="session-item">
                                    <span>${start} - ${end}</span>
                                    <span>${(s.duration / 3600).toFixed(2)}h</span>
                                </div>
                            `;
    })}
                    </div>
                ` : ""}
                
                <div class="actions">
                    <button class="cancel" @click=${() => this.closeEditor()}>Cancel</button>
                    <button class="save" @click=${() => this.saveEntry()}>Save</button>
                </div>
            </div>
        </div>
      `;
  }

  static get styles() {
    return css`
      :host {
        --jc-bg: #1c1c1e;
        --jc-card: #2c2c2e;
        --jc-text: #ffffff;
        --jc-green: #34c759;
        --jc-red: #ff3b30;
        --jc-blue: #007aff;
        --jc-gray: #8e8e93;
      }
      ha-card {
        background: var(--jc-bg);
        color: var(--jc-text);
        padding: 16px;
        font-family: 'Roboto', sans-serif;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        background: var(--jc-card);
        padding: 8px;
        border-radius: 8px;
      }
      .card-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        font-weight: bold;
        color: var(--jc-blue);
        border-bottom: 1px solid var(--jc-card);
        margin-bottom: 12px;
      }
      .ho-toggle {
        --mdc-icon-size: 24px;
        color: var(--jc-gray);
      }
      .ho-toggle.ho-on {
        color: var(--jc-green);
      }
      .month-title {
        text-align: center;
        font-size: 1.2rem;
        font-weight: 500;
      }
      .stats {
        font-size: 0.9rem;
        color: var(--jc-gray);
        margin-top: 4px;
      }
      .delta-pos { color: var(--jc-green); }
      .delta-neg { color: var(--jc-red); }
      
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
      }
      .day-name {
        text-align: center;
        font-size: 0.8rem;
        color: var(--jc-gray);
        margin-bottom: 8px;
      }
      .day {
        background: var(--jc-card);
        border-radius: 8px;
        min-height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        padding: 4px;
      }
      .day:hover {
        filter: brightness(1.2);
      }
      .day.today {
        border: 1px solid var(--jc-blue);
      }
      .day.empty {
        background: transparent;
        cursor: default;
      }
      
      .day-num {
        font-size: 0.8rem;
        color: var(--jc-gray);
        position: absolute;
        top: 4px;
        left: 6px;
      }
      
      .hours {
        font-size: 1rem;
        font-weight: bold;
        margin-top: 10px;
      }
      
      .badge {
        font-size: 0.7rem;
        padding: 2px 4px;
        border-radius: 4px;
        margin-top: 2px;
      }
      .badge-pos { color: var(--jc-green); background: rgba(52, 199, 89, 0.1); }
      .badge-neg { color: var(--jc-red); background: rgba(255, 59, 48, 0.1); }
      
      .vacation { background: rgba(0, 122, 255, 0.1); }
      .sick { background: rgba(255, 149, 0, 0.1); }
      .work { } /* Default */
      
      .icon {
        margin-top: 12px;
        --mdc-icon-size: 20px;
      }
      
      /* Editor */
      .editor-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        border-radius: inherit;
      }
      .editor-dialog {
        background: var(--jc-card);
        padding: 20px;
        border-radius: 12px;
        width: 80%;
        max-width: 300px;
      }
      .input-group {
        margin-bottom: 16px;
      }
      .input-group label {
        display: block;
        margin-bottom: 4px;
        font-size: 0.9rem;
        color: var(--jc-gray);
      }
      input, select {
        width: 100%;
        padding: 8px;
        background: var(--jc-bg);
        border: 1px solid var(--jc-gray);
        color: white;
        border-radius: 4px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      }
      .save { background: var(--jc-green); color: white; }
      .cancel { background: transparent; color: var(--jc-gray); }

      .sessions-list {
        margin: 16px 0;
        border-top: 1px solid var(--jc-bg);
        padding-top: 8px;
        max-height: 150px;
        overflow-y: auto;
      }
      .sessions-list label {
        display: block;
        font-size: 0.8rem;
        color: var(--jc-gray);
        margin-bottom: 8px;
      }
      .session-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
    `;
  }
}

customElements.define("jobclock-card", JobClockCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "jobclock-card",
  name: "JobClock Dashboard",
  description: "Time, Stats, and History for JobClock"
});
