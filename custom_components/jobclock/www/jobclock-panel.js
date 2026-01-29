
const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace") || customElements.get("hc-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// Import the card logic/styles if possible, or simpler: 
// Since we used customElements.define in jobclock-card.js, we assume it's loaded.
// BUT: The panel loads its own module. We need to ensure jobclock-card is available.
// We can import it here if it's an ES module.
// Import the card logic/styles
import "/jobclock_static/jobclock-card.js?v=1.2.3";

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
    // Find all sensors that are JobClock sensors
    // We look for entities with integration 'jobclock' 
    // OR we look for the unique_id structure?
    // Best: look for attributes.entry_id + domain sensor + starting with jobclock?

    const instances = [];
    Object.values(this.hass.states).forEach(stateObj => {
      if (stateObj.entity_id.startsWith("sensor.jobclock_") &&
        stateObj.entity_id.endsWith("_today") &&
        stateObj.attributes.entry_id) {

        // Nice Name: "JobClock X Today" -> "X"
        const name = stateObj.attributes.friendly_name.replace("JobClock ", "").replace(" Today", "");

        instances.push({
          id: stateObj.attributes.entry_id,
          name: name,
          entity_id: stateObj.entity_id
        });
      }
    });

    // Sort
    instances.sort((a, b) => a.name.localeCompare(b.name));

    // Check if diff (simple check)
    if (JSON.stringify(instances) !== JSON.stringify(this._instances)) {
      this._instances = instances;
      if (!this._selectedInstance && instances.length > 0) {
        this._selectedInstance = instances[0].id;
      }
    }
  }

  render() {
    if (!this.hass) return html`Loading...`;

    return html`
      <div class="panel">
        <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="title">JobClock</div>
            
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
        
        <div class="content">
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
    if (!current) return html`Select an instance`;

    // Pass a fake config object to satisfy the card's expectation
    const cardConfig = { entity: current.entity_id };

    return html`
        <jobclock-card .hass=${this.hass} .config=${cardConfig}></jobclock-card>
      `;
  }

  static get styles() {
    return css`
      :host {
        background-color: var(--primary-background-color);
        display: block;
        height: 100vh;
        overflow: hidden;
      }
      .panel {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .toolbar {
        background-color: var(--app-header-background-color, #03a9f4);
        color: var(--app-header-text-color, white);
        height: 64px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 10;
        gap: 16px;
      }
      .title {
        font-size: 20px;
        font-weight: 500;
        margin-right: auto;
      }
      
      .tabs {
        display: flex;
        gap: 0;
        height: 100%;
        align-items: flex-end;
      }
      .tab {
        padding: 0 16px;
        height: 48px;
        display: flex;
        align-items: center;
        cursor: pointer;
        opacity: 0.7;
        font-weight: 500;
        text-transform: uppercase;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }
      .tab.active {
        opacity: 1;
        border-bottom-color: var(--app-header-text-color, white);
      }
      .tab:hover {
        opacity: 1;
        background: rgba(255,255,255,0.1);
      }

      .content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        justify-content: center;
        background: var(--primary-background-color);
      }
      jobclock-card {
        width: 100%;
        max-width: 800px;
        display: block;
      }
      .empty {
        margin-top: 40px;
        color: var(--secondary-text-color);
        font-size: 1.2rem;
      }
    `;
  }
}

customElements.define("jobclock-panel", JobClockPanel);
