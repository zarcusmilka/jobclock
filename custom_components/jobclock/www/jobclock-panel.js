
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace") || customElements.get("hc-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

import "/jobclock_static/jobclock-card.js?v=2.1.5";

class JobClockPanel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      panel: { type: Object },
      _instances: { type: Array },
      _selectedInstance: { type: String }
    };
  }

  constructor() {
    super();
    this._instances = [];
    this._selectedInstance = null;
  }

  updated(changedProps) {
    if (changedProps.has("hass")) {
      this._findInstances();
    }
  }

  _findInstances() {
    const instances = [];
    Object.values(this.hass.states).forEach(stateObj => {
      if (stateObj.entity_id.startsWith("sensor.jobclock_") &&
        stateObj.entity_id.endsWith("_today") &&
        stateObj.attributes.entry_id) {

        const name = stateObj.attributes.friendly_name.replace("JobClock ", "").replace(" Today", "");
        instances.push({
          id: stateObj.attributes.entry_id,
          name: name,
          entity_id: stateObj.entity_id
        });
      }
    });

    instances.sort((a, b) => a.name.localeCompare(b.name));

    if (JSON.stringify(instances) !== JSON.stringify(this._instances)) {
      this._instances = instances;
      if (!this._selectedInstance && instances.length > 0) {
        this._selectedInstance = instances[0].id;
      }
    }
  }

  get _todayFormatted() {
    const d = new Date();
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${d.getDate()}. ${months[d.getMonth()]}`;
  }

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="panel-root">
        <div class="main-content">
          <div class="card-wrapper">
            <!-- Header with HA menu button -->
            <div class="integrated-header">
              <div class="header-left-group">
                <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
                <div class="header-left">
                  <div class="title-row">
                    <h1 class="title">JobClock</h1>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pin-icon">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <p class="date">Heute, ${this._todayFormatted}</p>
                </div>
              </div>
              ${this._instances.length > 1 ? html`
                <div class="tabs">
                  ${this._instances.map(i => html`
                    <div class="tab ${this._selectedInstance === i.id ? 'active' : ''}"
                         @click=${() => this._selectedInstance = i.id}>
                      ${i.name}
                    </div>
                  `)}
                </div>
              ` : ""}
            </div>

            ${this._renderContent()}
          </div>
        </div>
      </div>
    `;
  }

  _renderContent() {
    if (this._instances.length === 0) {
      return html`<div class="empty">No JobClock instances found. Please add one in Integrations.</div>`;
    }

    const current = this._instances.find(i => i.id === this._selectedInstance);
    if (!current) return html`<div class="empty">Select an instance</div>`;

    if (!this._cardConfig || this._cardConfig.entity !== current.entity_id) {
      this._cardConfig = { entity: current.entity_id };
    }

    return html`
      <jobclock-card .hass=${this.hass} .config=${this._cardConfig}></jobclock-card>
    `;
  }

  static get styles() {
    return css`
      :host {
        background-color: #0f172a;
        color: #f8fafc;
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .panel-root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .main-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px 16px;
        display: flex;
        justify-content: center;
        background: #0f172a;
        background-image: 
          radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(192, 132, 252, 0.05) 0px, transparent 50%);
      }
      .card-wrapper {
        width: 100%;
        max-width: 36rem;
      }

      /* Integrated header */
      .integrated-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
      }
      .header-left-group {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      ha-menu-button {
        color: #9ca3af;
        --mdc-icon-size: 24px;
        margin-left: -8px;
      }
      .header-left {
        display: flex;
        flex-direction: column;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .title {
        font-size: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        color: #ffffff;
        margin: 0;
      }
      .pin-icon {
        color: #6b7280;
        margin-top: 2px;
      }
      .date {
        color: #9ca3af;
        font-size: 0.875rem;
        margin: 2px 0 0 0;
        font-weight: 500;
      }

      .tabs {
        display: flex;
        gap: 8px;
      }
      .tab {
        padding: 6px 20px;
        border-radius: 9999px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.875rem;
        color: #9ca3af;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(38, 38, 38, 0.4);
        border: 1px solid rgba(64, 64, 64, 0.3);
      }
      .tab:hover {
        color: #f8fafc;
        background: rgba(255, 255, 255, 0.05);
      }
      .tab.active {
        background: #9333ea;
        color: white;
        border-color: transparent;
        box-shadow: 0 0 12px rgba(168, 85, 247, 0.4);
      }

      .empty {
        margin-top: 64px;
        text-align: center;
        color: #94a3b8;
        font-size: 1.125rem;
      }
      
      @media (max-width: 480px) {
        .main-content { padding: 12px 8px; }
        .integrated-header { flex-wrap: wrap; gap: 12px; }
        .tabs { gap: 6px; }
        .tab { padding: 4px 14px; font-size: 0.8rem; }
      }
    `;
  }
}

customElements.define("jobclock-panel", JobClockPanel);
