
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
    if (!this.hass || !this.config) {
      return html`<ha-card>Configuration error</ha-card>`;
    }

    // Header
    const monthName = this._currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

    // Stats
    let totalSeconds = 0;
    let totalDelta = 0;
    Object.values(this._data).forEach(d => {
      totalSeconds += d.duration;
      totalDelta += d.delta;
    });
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const deltaHours = (totalDelta / 3600);
    const deltaStr = (deltaHours > 0 ? "+" : "") + deltaHours.toFixed(2) + " h";
    const deltaClass = deltaHours >= 0 ? "delta-pos" : "delta-neg";

    // State of Home Office Switch
    const stateObj = this.hass.states[this.config.entity];
    const switchEntity = stateObj?.attributes?.switch_entity;
    const switchState = switchEntity ? this.hass.states[switchEntity] : null;
    const isHO = switchState?.state === 'on';

    return html`
      <ha-card>
        <div class="card-title">
            JobClock: ${stateObj?.attributes?.friendly_name || "Integration"}
            ${switchEntity ? html`
                <ha-icon-button 
                    class="ho-toggle ${isHO ? 'ho-on' : ''}" 
                    icon="mdi:home-clock"
                    @click=${() => this.hass.callService("homeassistant", "toggle", { entity_id: switchEntity })}
                    title="Home Office Ein/Aus"
                ></ha-icon-button>
            ` : ""}
            <ha-icon-button 
                icon="mdi:export" 
                @click=${() => this.exportToCSV()}
                title="Export (CSV)"
            ></ha-icon-button>
        </div>

        <div class="header">
            <ha-icon-button icon="mdi:chevron-left" @click=${() => this.changeMonth(-1)}></ha-icon-button>
            <div class="month-title">
                ${monthName}
                <div class="stats">
                    ${totalHours} h <span class="${deltaClass}">(${deltaStr})</span>
                </div>
            </div>
            <ha-icon-button icon="mdi:chevron-right" @click=${() => this.changeMonth(1)}></ha-icon-button>
        </div>

        <div class="calendar-grid">
            ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => html`<div class="day-name">${d}</div>`)}
            ${this.renderCalendarDays()}
        </div>

        ${this._editorOpen ? this.renderEditor() : ""}
      </ha-card>
    `;
  }

  renderCalendarDays() {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Shift so Mon=0, Sun=6
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];

    // Empty cells
    for (let i = 0; i < startDay; i++) {
      days.push(html`<div class="day empty"></div>`);
    }

    // Days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = new Date(year, month, d, 12).toISOString().split('T')[0];
      const dayData = this._data[dateStr];
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      let content = html`<span>${d}</span>`;
      let classes = "day" + (isToday ? " today" : "");

      if (dayData) {
        const h = (dayData.duration / 3600).toFixed(1);
        const deltaH = (dayData.delta / 3600);
        const deltaBadge = deltaH !== 0 ? ((deltaH > 0 ? "+" : "") + deltaH.toFixed(1)) : null;
        const badgeClass = deltaH >= 0 ? "badge-pos" : "badge-neg";
        const isVacation = dayData.type === 'vacation';
        const isSick = dayData.type === 'sick';

        if (isVacation) classes += " vacation";
        if (isSick) classes += " sick";
        if (dayData.duration > 0 && !isVacation && !isSick) classes += " work";

        content = html`
                <span class="day-num">${d}</span>
                ${isVacation ? html`<ha-icon icon="mdi:beach" class="icon"></ha-icon>` :
            isSick ? html`<ha-icon icon="mdi:medical-bag" class="icon"></ha-icon>` :
              html`<div class="hours">${h}h</div>`}
                
                ${(!isVacation && !isSick && deltaBadge) ? html`<div class="badge ${badgeClass}">${deltaBadge}</div>` : ""}
            `;
      } else {
        content = html`<span class="day-num">${d}</span>`;
      }

      days.push(html`<div class="${classes}" @click=${() => this.openEditor(dateStr, dayData)}>${content}</div>`);
    }

    return days;
  }

  renderEditor() {
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
