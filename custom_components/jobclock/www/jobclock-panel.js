
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace") || customElements.get("hc-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

import "/jobclock_static/jobclock-card.js?v=1.5.3";

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

  render() {
    if (!this.hass) return html``;

    return html`
      <div class="panel-root">
        <div class="header">
          <div class="header-content">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="title">JobClock</div>
            ${this._instances.length > 1 ? html`
              <div class="tabs-container">
                <div class="tabs">
                  ${this._instances.map(i => html`
                    <div class="tab ${this._selectedInstance === i.id ? 'active' : ''}"
                         @click=${() => this._selectedInstance = i.id}>
                      ${i.name}
                    </div>
                  `)}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
        
        <div class="main-content">
          ${this._renderContent()}
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
      <div class="card-wrapper">
        <jobclock-card .hass=${this.hass} .config=${this._cardConfig}></jobclock-card>
      </div>
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
      .header {
        background-color: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 100;
        padding: 4px 0;
      }
      .header-content {
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }
      .title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-left: 8px;
        background: linear-gradient(to right, #818cf8, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        flex: 1;
      }
      
      .tabs-container {
        display: flex;
        height: 100%;
        align-items: center;
      }
      .tabs {
        display: flex;
        gap: 12px;
        background: rgba(0,0,0,0.2);
        padding: 6px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .tab {
        padding: 0 20px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
        font-size: 0.9rem;
        color: #94a3b8;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .tab:hover { color: #f8fafc; background: rgba(255,255,255,0.05); }
      .tab.active {
        background: #6366f1;
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
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
        max-width: 800px;
      }
      .empty {
        margin-top: 64px;
        text-align: center;
        color: #94a3b8;
        font-size: 1.125rem;
      }
      
      @media (max-width: 600px) {
        .header-content { padding: 0 8px; justify-content: space-between; }
        .title { display: none; }
        .main-content { padding: 12px 8px; }
        .tabs { gap: 6px; padding: 4px; }
        .tab { padding: 0 12px; height: 32px; font-size: 0.8rem; }
      }
    `;
  }
}

customElements.define("jobclock-panel", JobClockPanel);
