const R = globalThis, J = R.ShadowRoot && (R.ShadyCSS === void 0 || R.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ht = /* @__PURE__ */ Symbol(), et = /* @__PURE__ */ new WeakMap();
let St = class {
  constructor(t, e, r) {
    if (this._$cssResult$ = !0, r !== ht) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (J && t === void 0) {
      const r = e !== void 0 && e.length === 1;
      r && (t = et.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), r && et.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const ut = (i) => new St(typeof i == "string" ? i : i + "", void 0, ht), At = (i, t) => {
  if (J) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const r = document.createElement("style"), o = R.litNonce;
    o !== void 0 && r.setAttribute("nonce", o), r.textContent = e.cssText, i.appendChild(r);
  }
}, rt = J ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const r of t.cssRules) e += r.cssText;
  return ut(e);
})(i) : i;
const { is: Mt, defineProperty: Et, getOwnPropertyDescriptor: Dt, getOwnPropertyNames: Ct, getOwnPropertySymbols: Tt, getPrototypeOf: Ot } = Object, L = globalThis, ot = L.trustedTypes, zt = ot ? ot.emptyScript : "", jt = L.reactiveElementPolyfillSupport, O = (i, t) => i, Y = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? zt : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, bt = (i, t) => !Mt(i, t), at = { attribute: !0, type: String, converter: Y, reflect: !1, useDefault: !1, hasChanged: bt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), L.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let E = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = at) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const r = /* @__PURE__ */ Symbol(), o = this.getPropertyDescriptor(t, r, e);
      o !== void 0 && Et(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, r) {
    const { get: o, set: s } = Dt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: o, set(a) {
      const l = o?.call(this);
      s?.call(this, a), this.requestUpdate(t, l, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? at;
  }
  static _$Ei() {
    if (this.hasOwnProperty(O("elementProperties"))) return;
    const t = Ot(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(O("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(O("properties"))) {
      const e = this.properties, r = [...Ct(e), ...Tt(e)];
      for (const o of r) this.createProperty(o, e[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [r, o] of e) this.elementProperties.set(r, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, r] of this.elementProperties) {
      const o = this._$Eu(e, r);
      o !== void 0 && this._$Eh.set(o, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const r = new Set(t.flat(1 / 0).reverse());
      for (const o of r) e.unshift(rt(o));
    } else t !== void 0 && e.push(rt(t));
    return e;
  }
  static _$Eu(t, e) {
    const r = e.attribute;
    return r === !1 ? void 0 : typeof r == "string" ? r : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const r of e.keys()) this.hasOwnProperty(r) && (t.set(r, this[r]), delete this[r]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return At(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, r) {
    this._$AK(t, r);
  }
  _$ET(t, e) {
    const r = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, r);
    if (o !== void 0 && r.reflect === !0) {
      const s = (r.converter?.toAttribute !== void 0 ? r.converter : Y).toAttribute(e, r.type);
      this._$Em = t, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const r = this.constructor, o = r._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = r.getPropertyOptions(o), a = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : Y;
      this._$Em = o;
      const l = a.fromAttribute(e, s.type);
      this[o] = l ?? this._$Ej?.get(o) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, r, o = !1, s) {
    if (t !== void 0) {
      const a = this.constructor;
      if (o === !1 && (s = this[t]), r ??= a.getPropertyOptions(t), !((r.hasChanged ?? bt)(s, e) || r.useDefault && r.reflect && s === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, r)))) return;
      this.C(t, e, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: r, reflect: o, wrapped: s }, a) {
    r && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), s !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || r || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [o, s] of this._$Ep) this[o] = s;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [o, s] of r) {
        const { wrapped: a } = s, l = this[o];
        a !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, s, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((r) => r.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
E.elementStyles = [], E.shadowRootOptions = { mode: "open" }, E[O("elementProperties")] = /* @__PURE__ */ new Map(), E[O("finalized")] = /* @__PURE__ */ new Map(), jt?.({ ReactiveElement: E }), (L.reactiveElementVersions ??= []).push("2.1.2");
const K = globalThis, it = (i) => i, F = K.trustedTypes, st = F ? F.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, gt = "$lit$", x = `lit$${Math.random().toFixed(9).slice(2)}$`, wt = "?" + x, Ut = `<${wt}>`, _ = document, j = () => _.createComment(""), U = (i) => i === null || typeof i != "object" && typeof i != "function", G = Array.isArray, Pt = (i) => G(i) || typeof i?.[Symbol.iterator] == "function", V = `[ 	
\f\r]`, T = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, nt = /-->/g, lt = />/g, k = RegExp(`>|${V}(?:([^\\s"'>=/]+)(${V}*=${V}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ct = /'/g, dt = /"/g, vt = /^(?:script|style|textarea|title)$/i, Ht = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), h = Ht(1), D = /* @__PURE__ */ Symbol.for("lit-noChange"), g = /* @__PURE__ */ Symbol.for("lit-nothing"), pt = /* @__PURE__ */ new WeakMap(), $ = _.createTreeWalker(_, 129);
function ft(i, t) {
  if (!G(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return st !== void 0 ? st.createHTML(t) : t;
}
const Nt = (i, t) => {
  const e = i.length - 1, r = [];
  let o, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = T;
  for (let l = 0; l < e; l++) {
    const n = i[l];
    let p, d, c = -1, u = 0;
    for (; u < n.length && (a.lastIndex = u, d = a.exec(n), d !== null); ) u = a.lastIndex, a === T ? d[1] === "!--" ? a = nt : d[1] !== void 0 ? a = lt : d[2] !== void 0 ? (vt.test(d[2]) && (o = RegExp("</" + d[2], "g")), a = k) : d[3] !== void 0 && (a = k) : a === k ? d[0] === ">" ? (a = o ?? T, c = -1) : d[1] === void 0 ? c = -2 : (c = a.lastIndex - d[2].length, p = d[1], a = d[3] === void 0 ? k : d[3] === '"' ? dt : ct) : a === dt || a === ct ? a = k : a === nt || a === lt ? a = T : (a = k, o = void 0);
    const b = a === k && i[l + 1].startsWith("/>") ? " " : "";
    s += a === T ? n + Ut : c >= 0 ? (r.push(p), n.slice(0, c) + gt + n.slice(c) + x + b) : n + x + (c === -2 ? l : b);
  }
  return [ft(i, s + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
};
class P {
  constructor({ strings: t, _$litType$: e }, r) {
    let o;
    this.parts = [];
    let s = 0, a = 0;
    const l = t.length - 1, n = this.parts, [p, d] = Nt(t, e);
    if (this.el = P.createElement(p, r), $.currentNode = this.el.content, e === 2 || e === 3) {
      const c = this.el.content.firstChild;
      c.replaceWith(...c.childNodes);
    }
    for (; (o = $.nextNode()) !== null && n.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const c of o.getAttributeNames()) if (c.endsWith(gt)) {
          const u = d[a++], b = o.getAttribute(c).split(x), w = /([.?@])?(.*)/.exec(u);
          n.push({ type: 1, index: s, name: w[2], strings: b, ctor: w[1] === "." ? Rt : w[1] === "?" ? Ft : w[1] === "@" ? Lt : I }), o.removeAttribute(c);
        } else c.startsWith(x) && (n.push({ type: 6, index: s }), o.removeAttribute(c));
        if (vt.test(o.tagName)) {
          const c = o.textContent.split(x), u = c.length - 1;
          if (u > 0) {
            o.textContent = F ? F.emptyScript : "";
            for (let b = 0; b < u; b++) o.append(c[b], j()), $.nextNode(), n.push({ type: 2, index: ++s });
            o.append(c[u], j());
          }
        }
      } else if (o.nodeType === 8) if (o.data === wt) n.push({ type: 2, index: s });
      else {
        let c = -1;
        for (; (c = o.data.indexOf(x, c + 1)) !== -1; ) n.push({ type: 7, index: s }), c += x.length - 1;
      }
      s++;
    }
  }
  static createElement(t, e) {
    const r = _.createElement("template");
    return r.innerHTML = t, r;
  }
}
function C(i, t, e = i, r) {
  if (t === D) return t;
  let o = r !== void 0 ? e._$Co?.[r] : e._$Cl;
  const s = U(t) ? void 0 : t._$litDirective$;
  return o?.constructor !== s && (o?._$AO?.(!1), s === void 0 ? o = void 0 : (o = new s(i), o._$AT(i, e, r)), r !== void 0 ? (e._$Co ??= [])[r] = o : e._$Cl = o), o !== void 0 && (t = C(i, o._$AS(i, t.values), o, r)), t;
}
class Bt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: r } = this._$AD, o = (t?.creationScope ?? _).importNode(e, !0);
    $.currentNode = o;
    let s = $.nextNode(), a = 0, l = 0, n = r[0];
    for (; n !== void 0; ) {
      if (a === n.index) {
        let p;
        n.type === 2 ? p = new H(s, s.nextSibling, this, t) : n.type === 1 ? p = new n.ctor(s, n.name, n.strings, this, t) : n.type === 6 && (p = new It(s, this, t)), this._$AV.push(p), n = r[++l];
      }
      a !== n?.index && (s = $.nextNode(), a++);
    }
    return $.currentNode = _, o;
  }
  p(t) {
    let e = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(t, r, e), e += r.strings.length - 2) : r._$AI(t[e])), e++;
  }
}
class H {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, r, o) {
    this.type = 2, this._$AH = g, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = r, this.options = o, this._$Cv = o?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = C(this, t, e), U(t) ? t === g || t == null || t === "" ? (this._$AH !== g && this._$AR(), this._$AH = g) : t !== this._$AH && t !== D && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Pt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== g && U(this._$AH) ? this._$AA.nextSibling.data = t : this.T(_.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: r } = t, o = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = P.createElement(ft(r.h, r.h[0]), this.options)), r);
    if (this._$AH?._$AD === o) this._$AH.p(e);
    else {
      const s = new Bt(o, this), a = s.u(this.options);
      s.p(e), this.T(a), this._$AH = s;
    }
  }
  _$AC(t) {
    let e = pt.get(t.strings);
    return e === void 0 && pt.set(t.strings, e = new P(t)), e;
  }
  k(t) {
    G(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let r, o = 0;
    for (const s of t) o === e.length ? e.push(r = new H(this.O(j()), this.O(j()), this, this.options)) : r = e[o], r._$AI(s), o++;
    o < e.length && (this._$AR(r && r._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const r = it(t).nextSibling;
      it(t).remove(), t = r;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class I {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, r, o, s) {
    this.type = 1, this._$AH = g, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = s, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = g;
  }
  _$AI(t, e = this, r, o) {
    const s = this.strings;
    let a = !1;
    if (s === void 0) t = C(this, t, e, 0), a = !U(t) || t !== this._$AH && t !== D, a && (this._$AH = t);
    else {
      const l = t;
      let n, p;
      for (t = s[0], n = 0; n < s.length - 1; n++) p = C(this, l[r + n], e, n), p === D && (p = this._$AH[n]), a ||= !U(p) || p !== this._$AH[n], p === g ? t = g : t !== g && (t += (p ?? "") + s[n + 1]), this._$AH[n] = p;
    }
    a && !o && this.j(t);
  }
  j(t) {
    t === g ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Rt extends I {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === g ? void 0 : t;
  }
}
class Ft extends I {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== g);
  }
}
class Lt extends I {
  constructor(t, e, r, o, s) {
    super(t, e, r, o, s), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = C(this, t, e, 0) ?? g) === D) return;
    const r = this._$AH, o = t === g && r !== g || t.capture !== r.capture || t.once !== r.once || t.passive !== r.passive, s = t !== g && (r === g || o);
    o && this.element.removeEventListener(this.name, this, r), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class It {
  constructor(t, e, r) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    C(this, t);
  }
}
const Wt = K.litHtmlPolyfillSupport;
Wt?.(P, H), (K.litHtmlVersions ??= []).push("3.3.2");
const qt = (i, t, e) => {
  const r = e?.renderBefore ?? t;
  let o = r._$litPart$;
  if (o === void 0) {
    const s = e?.renderBefore ?? null;
    r._$litPart$ = o = new H(t.insertBefore(j(), s), s, void 0, e ?? {});
  }
  return o._$AI(i), o;
};
const Z = globalThis;
class z extends E {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = qt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return D;
  }
}
z._$litElement$ = !0, z.finalized = !0, Z.litElementHydrateSupport?.({ LitElement: z });
const Vt = Z.litElementPolyfillSupport;
Vt?.({ LitElement: z });
(Z.litElementVersions ??= []).push("4.2.2");
const Yt = '@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-space-y-reverse:0;--tw-border-style:solid;--tw-gradient-position:initial;--tw-gradient-from:#0000;--tw-gradient-via:#0000;--tw-gradient-to:#0000;--tw-gradient-stops:initial;--tw-gradient-via-stops:initial;--tw-gradient-from-position:0%;--tw-gradient-via-position:50%;--tw-gradient-to-position:100%;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1}}}@layer theme{:root,:host{--font-sans:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;--color-red-500:oklch(63.7% .237 25.331);--color-amber-300:oklch(87.9% .169 91.605);--color-amber-400:oklch(82.8% .189 84.429);--color-amber-500:oklch(76.9% .188 70.08);--color-amber-600:oklch(66.6% .179 58.318);--color-emerald-400:oklch(76.5% .177 163.223);--color-emerald-500:oklch(69.6% .17 162.48);--color-blue-400:oklch(70.7% .165 254.624);--color-blue-500:oklch(62.3% .214 259.815);--color-purple-300:oklch(82.7% .119 306.383);--color-purple-400:oklch(71.4% .203 305.504);--color-purple-500:oklch(62.7% .265 303.9);--color-purple-600:oklch(55.8% .288 302.321);--color-rose-300:oklch(81% .117 11.638);--color-rose-400:oklch(71.2% .194 13.428);--color-rose-500:oklch(64.5% .246 16.439);--color-rose-600:oklch(58.6% .253 17.585);--color-neutral-100:oklch(97% 0 0);--color-neutral-300:oklch(87% 0 0);--color-neutral-400:oklch(70.8% 0 0);--color-neutral-500:oklch(55.6% 0 0);--color-neutral-600:oklch(43.9% 0 0);--color-neutral-700:oklch(37.1% 0 0);--color-neutral-800:oklch(26.9% 0 0);--color-neutral-900:oklch(20.5% 0 0);--color-black:#000;--color-white:#fff;--spacing:.25rem;--container-sm:24rem;--container-md:28rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-base:1rem;--text-base--line-height: 1.5 ;--text-lg:1.125rem;--text-lg--line-height:calc(1.75 / 1.125);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--font-weight-light:300;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--tracking-wide:.025em;--tracking-wider:.05em;--tracking-widest:.1em;--radius-md:.375rem;--radius-lg:.5rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--drop-shadow-xl:0 9px 7px #0000001a;--ease-out:cubic-bezier(0, 0, .2, 1);--animate-ping:ping 1s cubic-bezier(0, 0, .2, 1) infinite;--blur-md:12px;--blur-xl:24px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}}@layer components;@layer utilities{.pointer-events-none{pointer-events:none}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.inset-0{inset:calc(var(--spacing) * 0)}.inset-1\\.5{inset:calc(var(--spacing) * 1.5)}.start{inset-inline-start:var(--spacing)}.end{inset-inline-end:var(--spacing)}.-top-8{top:calc(var(--spacing) * -8)}.-top-16{top:calc(var(--spacing) * -16)}.-left-16{left:calc(var(--spacing) * -16)}.left-1\\/2{left:50%}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-50{z-index:50}.mx-1{margin-inline:calc(var(--spacing) * 1)}.mx-auto{margin-inline:auto}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1{margin-top:calc(var(--spacing) * 1)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-4{margin-top:calc(var(--spacing) * 4)}.mt-6{margin-top:calc(var(--spacing) * 6)}.mt-auto{margin-top:auto}.mb-0\\.5{margin-bottom:calc(var(--spacing) * .5)}.mb-1{margin-bottom:calc(var(--spacing) * 1)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-4{margin-bottom:calc(var(--spacing) * 4)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.flex{display:flex}.grid{display:grid}.aspect-square{aspect-ratio:1}.h-1\\.5{height:calc(var(--spacing) * 1.5)}.h-6{height:calc(var(--spacing) * 6)}.h-8{height:calc(var(--spacing) * 8)}.h-10{height:calc(var(--spacing) * 10)}.h-12{height:calc(var(--spacing) * 12)}.h-20{height:calc(var(--spacing) * 20)}.h-28{height:calc(var(--spacing) * 28)}.h-36{height:calc(var(--spacing) * 36)}.h-64{height:calc(var(--spacing) * 64)}.h-full{height:100%}.max-h-\\[60vh\\]{max-height:60vh}.w-10{width:calc(var(--spacing) * 10)}.w-12{width:calc(var(--spacing) * 12)}.w-36{width:calc(var(--spacing) * 36)}.w-64{width:calc(var(--spacing) * 64)}.w-full{width:100%}.w-px{width:1px}.max-w-md{max-width:var(--container-md)}.max-w-sm{max-width:var(--container-sm)}.flex-1{flex:1}.flex-shrink-0{flex-shrink:0}.-translate-x-1\\/2{--tw-translate-x: -50% ;translate:var(--tw-translate-x) var(--tw-translate-y)}.-rotate-90{rotate:-90deg}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.animate-ping{animation:var(--animate-ping)}.cursor-default{cursor:default}.cursor-pointer{cursor:pointer}.grid-cols-7{grid-template-columns:repeat(7,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.items-baseline{align-items:baseline}.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-6{gap:calc(var(--spacing) * 6)}:where(.space-y-4>:not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 4) * var(--tw-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 4) * calc(1 - var(--tw-space-y-reverse)))}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.rounded{border-radius:.25rem}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-3xl{border-radius:var(--radius-3xl)}.rounded-\\[2rem\\]{border-radius:2rem}.rounded-full{border-radius:3.40282e38px}.rounded-lg{border-radius:var(--radius-lg)}.rounded-md{border-radius:var(--radius-md)}.rounded-xl{border-radius:var(--radius-xl)}.rounded-b-lg{border-bottom-right-radius:var(--radius-lg);border-bottom-left-radius:var(--radius-lg)}.border{border-style:var(--tw-border-style);border-width:1px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-amber-500\\/20{border-color:#f99c0033}@supports (color:color-mix(in lab,red,red)){.border-amber-500\\/20{border-color:color-mix(in oklab,var(--color-amber-500) 20%,transparent)}}.border-blue-500\\/20{border-color:#3080ff33}@supports (color:color-mix(in lab,red,red)){.border-blue-500\\/20{border-color:color-mix(in oklab,var(--color-blue-500) 20%,transparent)}}.border-blue-500\\/30{border-color:#3080ff4d}@supports (color:color-mix(in lab,red,red)){.border-blue-500\\/30{border-color:color-mix(in oklab,var(--color-blue-500) 30%,transparent)}}.border-blue-500\\/80{border-color:#3080ffcc}@supports (color:color-mix(in lab,red,red)){.border-blue-500\\/80{border-color:color-mix(in oklab,var(--color-blue-500) 80%,transparent)}}.border-emerald-500\\/20{border-color:#00bb7f33}@supports (color:color-mix(in lab,red,red)){.border-emerald-500\\/20{border-color:color-mix(in oklab,var(--color-emerald-500) 20%,transparent)}}.border-neutral-500\\/50{border-color:#73737380}@supports (color:color-mix(in lab,red,red)){.border-neutral-500\\/50{border-color:color-mix(in oklab,var(--color-neutral-500) 50%,transparent)}}.border-neutral-600{border-color:var(--color-neutral-600)}.border-neutral-700\\/30{border-color:#4040404d}@supports (color:color-mix(in lab,red,red)){.border-neutral-700\\/30{border-color:color-mix(in oklab,var(--color-neutral-700) 30%,transparent)}}.border-neutral-700\\/50{border-color:#40404080}@supports (color:color-mix(in lab,red,red)){.border-neutral-700\\/50{border-color:color-mix(in oklab,var(--color-neutral-700) 50%,transparent)}}.border-neutral-800{border-color:var(--color-neutral-800)}.border-neutral-800\\/80{border-color:#262626cc}@supports (color:color-mix(in lab,red,red)){.border-neutral-800\\/80{border-color:color-mix(in oklab,var(--color-neutral-800) 80%,transparent)}}.border-purple-500\\/10{border-color:#ac4bff1a}@supports (color:color-mix(in lab,red,red)){.border-purple-500\\/10{border-color:color-mix(in oklab,var(--color-purple-500) 10%,transparent)}}.border-purple-500\\/20{border-color:#ac4bff33}@supports (color:color-mix(in lab,red,red)){.border-purple-500\\/20{border-color:color-mix(in oklab,var(--color-purple-500) 20%,transparent)}}.border-purple-500\\/30{border-color:#ac4bff4d}@supports (color:color-mix(in lab,red,red)){.border-purple-500\\/30{border-color:color-mix(in oklab,var(--color-purple-500) 30%,transparent)}}.border-purple-500\\/80{border-color:#ac4bffcc}@supports (color:color-mix(in lab,red,red)){.border-purple-500\\/80{border-color:color-mix(in oklab,var(--color-purple-500) 80%,transparent)}}.border-rose-500\\/20{border-color:#ff235733}@supports (color:color-mix(in lab,red,red)){.border-rose-500\\/20{border-color:color-mix(in oklab,var(--color-rose-500) 20%,transparent)}}.border-transparent{border-color:#0000}.bg-\\[\\#1a1f2b\\]{background-color:#1a1f2b}.bg-\\[\\#2a1a3e\\]{background-color:#2a1a3e}.bg-\\[\\#13161f\\]{background-color:#13161f}.bg-\\[\\#151923\\]{background-color:#151923}.bg-amber-500\\/15{background-color:#f99c0026}@supports (color:color-mix(in lab,red,red)){.bg-amber-500\\/15{background-color:color-mix(in oklab,var(--color-amber-500) 15%,transparent)}}.bg-amber-600{background-color:var(--color-amber-600)}.bg-black\\/60{background-color:#0009}@supports (color:color-mix(in lab,red,red)){.bg-black\\/60{background-color:color-mix(in oklab,var(--color-black) 60%,transparent)}}.bg-blue-400{background-color:var(--color-blue-400)}.bg-blue-500{background-color:var(--color-blue-500)}.bg-blue-500\\/10{background-color:#3080ff1a}@supports (color:color-mix(in lab,red,red)){.bg-blue-500\\/10{background-color:color-mix(in oklab,var(--color-blue-500) 10%,transparent)}}.bg-emerald-500\\/5{background-color:#00bb7f0d}@supports (color:color-mix(in lab,red,red)){.bg-emerald-500\\/5{background-color:color-mix(in oklab,var(--color-emerald-500) 5%,transparent)}}.bg-emerald-500\\/10{background-color:#00bb7f1a}@supports (color:color-mix(in lab,red,red)){.bg-emerald-500\\/10{background-color:color-mix(in oklab,var(--color-emerald-500) 10%,transparent)}}.bg-neutral-800{background-color:var(--color-neutral-800)}.bg-neutral-800\\/40{background-color:#26262666}@supports (color:color-mix(in lab,red,red)){.bg-neutral-800\\/40{background-color:color-mix(in oklab,var(--color-neutral-800) 40%,transparent)}}.bg-neutral-800\\/50{background-color:#26262680}@supports (color:color-mix(in lab,red,red)){.bg-neutral-800\\/50{background-color:color-mix(in oklab,var(--color-neutral-800) 50%,transparent)}}.bg-neutral-900{background-color:var(--color-neutral-900)}.bg-neutral-900\\/80{background-color:#171717cc}@supports (color:color-mix(in lab,red,red)){.bg-neutral-900\\/80{background-color:color-mix(in oklab,var(--color-neutral-900) 80%,transparent)}}.bg-purple-400{background-color:var(--color-purple-400)}.bg-purple-500{background-color:var(--color-purple-500)}.bg-purple-500\\/10{background-color:#ac4bff1a}@supports (color:color-mix(in lab,red,red)){.bg-purple-500\\/10{background-color:color-mix(in oklab,var(--color-purple-500) 10%,transparent)}}.bg-purple-500\\/15{background-color:#ac4bff26}@supports (color:color-mix(in lab,red,red)){.bg-purple-500\\/15{background-color:color-mix(in oklab,var(--color-purple-500) 15%,transparent)}}.bg-purple-600{background-color:var(--color-purple-600)}.bg-rose-500\\/10{background-color:#ff23571a}@supports (color:color-mix(in lab,red,red)){.bg-rose-500\\/10{background-color:color-mix(in oklab,var(--color-rose-500) 10%,transparent)}}.bg-rose-500\\/15{background-color:#ff235726}@supports (color:color-mix(in lab,red,red)){.bg-rose-500\\/15{background-color:color-mix(in oklab,var(--color-rose-500) 15%,transparent)}}.bg-rose-600{background-color:var(--color-rose-600)}.bg-transparent{background-color:#0000}.bg-gradient-to-b{--tw-gradient-position:to bottom in oklab;background-image:linear-gradient(var(--tw-gradient-stops))}.from-neutral-800\\/80{--tw-gradient-from:#262626cc}@supports (color:color-mix(in lab,red,red)){.from-neutral-800\\/80{--tw-gradient-from:color-mix(in oklab, var(--color-neutral-800) 80%, transparent)}}.from-neutral-800\\/80{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))}.to-neutral-900\\/80{--tw-gradient-to:#171717cc}@supports (color:color-mix(in lab,red,red)){.to-neutral-900\\/80{--tw-gradient-to:color-mix(in oklab, var(--color-neutral-900) 80%, transparent)}}.to-neutral-900\\/80{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))}.stroke-\\[\\#444455\\]{stroke:#445}.stroke-blue-500{stroke:var(--color-blue-500)}.stroke-neutral-800{stroke:var(--color-neutral-800)}.stroke-purple-500{stroke:var(--color-purple-500)}.p-1{padding:calc(var(--spacing) * 1)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.p-5{padding:calc(var(--spacing) * 5)}.p-6{padding:calc(var(--spacing) * 6)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-2\\.5{padding-inline:calc(var(--spacing) * 2.5)}.px-6{padding-inline:calc(var(--spacing) * 6)}.py-0\\.5{padding-block:calc(var(--spacing) * .5)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-3\\.5{padding-block:calc(var(--spacing) * 3.5)}.py-4{padding-block:calc(var(--spacing) * 4)}.py-8{padding-block:calc(var(--spacing) * 8)}.pt-1{padding-top:calc(var(--spacing) * 1)}.pt-6{padding-top:calc(var(--spacing) * 6)}.pb-4{padding-bottom:calc(var(--spacing) * 4)}.text-center{text-align:center}.font-mono{font-family:var(--font-mono)}.font-sans{font-family:var(--font-sans)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-base{font-size:var(--text-base);line-height:var(--tw-leading,var(--text-base--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[8px\\]{font-size:8px}.text-\\[10px\\]{font-size:10px}.text-\\[11px\\]{font-size:11px}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-light{--tw-font-weight:var(--font-weight-light);font-weight:var(--font-weight-light)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-wide{--tw-tracking:var(--tracking-wide);letter-spacing:var(--tracking-wide)}.tracking-wider{--tw-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.tracking-widest{--tw-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.whitespace-nowrap{white-space:nowrap}.text-amber-300{color:var(--color-amber-300)}.text-amber-400{color:var(--color-amber-400)}.text-amber-500{color:var(--color-amber-500)}.text-blue-400{color:var(--color-blue-400)}.text-emerald-400{color:var(--color-emerald-400)}.text-neutral-100{color:var(--color-neutral-100)}.text-neutral-300{color:var(--color-neutral-300)}.text-neutral-400{color:var(--color-neutral-400)}.text-neutral-500{color:var(--color-neutral-500)}.text-purple-300{color:var(--color-purple-300)}.text-purple-400{color:var(--color-purple-400)}.text-red-500{color:var(--color-red-500)}.text-rose-300{color:var(--color-rose-300)}.text-rose-400{color:var(--color-rose-400)}.text-rose-500{color:var(--color-rose-500)}.text-white{color:var(--color-white)}.uppercase{text-transform:uppercase}.opacity-0{opacity:0}.opacity-20{opacity:.2}.opacity-70{opacity:.7}.opacity-\\[0\\.15\\]{opacity:.15}.shadow{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-2xl{--tw-shadow:0 25px 50px -12px var(--tw-shadow-color,#00000040);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_0_15px_rgba\\(59\\,130\\,246\\,0\\.15\\)\\]{--tw-shadow:0 0 15px var(--tw-shadow-color,#3b82f626);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_0_15px_rgba\\(168\\,85\\,247\\,0\\.15\\)\\]{--tw-shadow:0 0 15px var(--tw-shadow-color,#a855f726);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_4px_20px_rgba\\(0\\,0\\,0\\,0\\.2\\)\\]{--tw-shadow:0 4px 20px var(--tw-shadow-color,#0003);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_4px_20px_rgba\\(147\\,51\\,234\\,0\\.3\\)\\]{--tw-shadow:0 4px 20px var(--tw-shadow-color,#9333ea4d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_4px_20px_rgba\\(217\\,119\\,6\\,0\\.3\\)\\]{--tw-shadow:0 4px 20px var(--tw-shadow-color,#d977064d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_4px_20px_rgba\\(225\\,29\\,72\\,0\\.3\\)\\]{--tw-shadow:0 4px 20px var(--tw-shadow-color,#e11d484d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_8px_30px_rgba\\(0\\,0\\,0\\,0\\.2\\)\\]{--tw-shadow:0 8px 30px var(--tw-shadow-color,#0003);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-inner{--tw-shadow:inset 0 2px 4px 0 var(--tw-shadow-color,#0000000d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.blur-\\[80px\\]{--tw-blur:blur(80px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow-xl{--tw-drop-shadow-size:drop-shadow(0 9px 7px var(--tw-drop-shadow-color,#0000001a));--tw-drop-shadow:drop-shadow(var(--drop-shadow-xl));filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur-md{--tw-backdrop-blur:blur(var(--blur-md));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-blur-xl{--tw-backdrop-blur:blur(var(--blur-xl));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-1000{--tw-duration:1s;transition-duration:1s}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.outline-none{--tw-outline-style:none;outline-style:none}@media(hover:hover){.group-hover\\:text-purple-400:is(:where(.group):hover *){color:var(--color-purple-400)}.group-hover\\:opacity-100:is(:where(.group):hover *){opacity:1}}.selection\\:bg-purple-500\\/30 ::selection{background-color:#ac4bff4d}@supports (color:color-mix(in lab,red,red)){.selection\\:bg-purple-500\\/30 ::selection{background-color:color-mix(in oklab,var(--color-purple-500) 30%,transparent)}}.selection\\:bg-purple-500\\/30::selection{background-color:#ac4bff4d}@supports (color:color-mix(in lab,red,red)){.selection\\:bg-purple-500\\/30::selection{background-color:color-mix(in oklab,var(--color-purple-500) 30%,transparent)}}@media(hover:hover){.hover\\:scale-\\[1\\.02\\]:hover{scale:1.02}.hover\\:border-neutral-500:hover{border-color:var(--color-neutral-500)}.hover\\:border-purple-500\\/20:hover{border-color:#ac4bff33}@supports (color:color-mix(in lab,red,red)){.hover\\:border-purple-500\\/20:hover{border-color:color-mix(in oklab,var(--color-purple-500) 20%,transparent)}}.hover\\:bg-amber-500:hover{background-color:var(--color-amber-500)}.hover\\:bg-emerald-500\\/10:hover{background-color:#00bb7f1a}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-emerald-500\\/10:hover{background-color:color-mix(in oklab,var(--color-emerald-500) 10%,transparent)}}.hover\\:bg-neutral-700\\/80:hover{background-color:#404040cc}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-neutral-700\\/80:hover{background-color:color-mix(in oklab,var(--color-neutral-700) 80%,transparent)}}.hover\\:bg-neutral-800:hover{background-color:var(--color-neutral-800)}.hover\\:bg-neutral-800\\/30:hover{background-color:#2626264d}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-neutral-800\\/30:hover{background-color:color-mix(in oklab,var(--color-neutral-800) 30%,transparent)}}.hover\\:bg-purple-500:hover{background-color:var(--color-purple-500)}.hover\\:bg-rose-500:hover{background-color:var(--color-rose-500)}.hover\\:bg-rose-500\\/10:hover{background-color:#ff23571a}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-rose-500\\/10:hover{background-color:color-mix(in oklab,var(--color-rose-500) 10%,transparent)}}.hover\\:text-neutral-400:hover{color:var(--color-neutral-400)}.hover\\:text-rose-400:hover{color:var(--color-rose-400)}.hover\\:text-white:hover{color:var(--color-white)}}.focus\\:outline-none:focus{--tw-outline-style:none;outline-style:none}.active\\:scale-95:active{--tw-scale-x:95%;--tw-scale-y:95%;--tw-scale-z:95%;scale:var(--tw-scale-x) var(--tw-scale-y)}@media(min-width:40rem){.sm\\:gap-2{gap:calc(var(--spacing) * 2)}.sm\\:gap-3{gap:calc(var(--spacing) * 3)}.sm\\:p-6{padding:calc(var(--spacing) * 6)}}.\\[\\&\\:\\:-webkit-calendar-picker-indicator\\]\\:absolute::-webkit-calendar-picker-indicator{position:absolute}.\\[\\&\\:\\:-webkit-calendar-picker-indicator\\]\\:inset-0::-webkit-calendar-picker-indicator{inset:calc(var(--spacing) * 0)}.\\[\\&\\:\\:-webkit-calendar-picker-indicator\\]\\:h-full::-webkit-calendar-picker-indicator{height:100%}.\\[\\&\\:\\:-webkit-calendar-picker-indicator\\]\\:w-full::-webkit-calendar-picker-indicator{width:100%}.\\[\\&\\:\\:-webkit-calendar-picker-indicator\\]\\:opacity-0::-webkit-calendar-picker-indicator{opacity:0}}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-space-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-gradient-position{syntax:"*";inherits:false}@property --tw-gradient-from{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-via{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-to{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-stops{syntax:"*";inherits:false}@property --tw-gradient-via-stops{syntax:"*";inherits:false}@property --tw-gradient-from-position{syntax:"<length-percentage>";inherits:false;initial-value:0%}@property --tw-gradient-via-position{syntax:"<length-percentage>";inherits:false;initial-value:50%}@property --tw-gradient-to-position{syntax:"<length-percentage>";inherits:false;initial-value:100%}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-tracking{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-backdrop-blur{syntax:"*";inherits:false}@property --tw-backdrop-brightness{syntax:"*";inherits:false}@property --tw-backdrop-contrast{syntax:"*";inherits:false}@property --tw-backdrop-grayscale{syntax:"*";inherits:false}@property --tw-backdrop-hue-rotate{syntax:"*";inherits:false}@property --tw-backdrop-invert{syntax:"*";inherits:false}@property --tw-backdrop-opacity{syntax:"*";inherits:false}@property --tw-backdrop-saturate{syntax:"*";inherits:false}@property --tw-backdrop-sepia{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@property --tw-ease{syntax:"*";inherits:false}@property --tw-scale-x{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-y{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-z{syntax:"*";inherits:false;initial-value:1}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}', M = (i) => {
  const t = i.getFullYear(), e = String(i.getMonth() + 1).padStart(2, "0"), r = String(i.getDate()).padStart(2, "0");
  return `${t}-${e}-${r}`;
}, Jt = (i) => {
  if (!i) return "";
  const [t, e, r] = i.split("-");
  return `${r}.${e}.${t}`;
};
class Kt extends (customElements.get("ha-panel-lovelace") ? z : HTMLElement) {
  static get properties() {
    return console.info("%c JobClock Card v2.0.0 Loaded (Tailwind) ", "color: white; background: #6366f1; font-weight: bold;"), {
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
      _addFormOpen: { type: Boolean }
    };
  }
  constructor() {
    super(), this._data = {}, this._currentMonth = /* @__PURE__ */ new Date(), this._detailOpen = !1, this._editorOpen = !1, this._addFormOpen = !1, this._editSessions = [], this._editType = "work";
  }
  setConfig(t) {
    this.config = t;
  }
  updated(t) {
    t.has("hass") && this.hass && this.config?.entity && this.fetchData();
  }
  async fetchData() {
    const t = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), 1), e = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth() + 1, 0);
    try {
      const r = await this.hass.callWS({
        type: "jobclock/get_data",
        entry_id: this.hass.states[this.config.entity].attributes.entry_id,
        start_date: M(t),
        end_date: M(e)
      }), o = {};
      r.forEach((s) => o[s.date] = s), this._data = o, this._detailOpen && this._detailDate && (this._detailData = this._data[this._detailDate]);
    } catch (r) {
      console.error("Fetch failed", r);
    }
  }
  changeMonth(t) {
    const e = new Date(this._currentMonth.getFullYear(), this._currentMonth.getMonth(), 1);
    e.setMonth(e.getMonth() + t), this._currentMonth = e, this.fetchData();
  }
  openDayDetail(t, e) {
    this._detailDate = t, this._detailData = e || { duration: 0, type: "work", sessions: [] }, this._editSessions = JSON.parse(JSON.stringify(this._detailData.sessions || [])), this._editType = this._detailData.type || "work", this._detailOpen = !0, this._editorOpen = !0, this._addFormOpen = !1;
  }
  closeDayDetail() {
    this._detailOpen = !1;
  }
  async _manualToggle() {
    const t = this.hass.states[this.config.entity], e = t.attributes.is_working;
    await this.hass.callWS({
      type: "jobclock/manual_toggle",
      entry_id: t.attributes.entry_id,
      action: e ? "stop" : "start"
    }), this.fetchData();
  }
  async _handleModeChange(t) {
    const r = this.hass.states[this.config.entity].attributes.switch_entity;
    if (!r) return;
    const o = this.hass.states[r]?.state === "on";
    (t === "home" && !o || t === "office" && o) && await this.hass.callService("homeassistant", "toggle", { entity_id: r });
  }
  async _autoSave() {
    const t = this.hass.states[this.config.entity];
    await this.hass.callWS({
      type: "jobclock/update_sessions",
      entry_id: t.attributes.entry_id,
      date: this._detailDate,
      sessions: this._editSessions.map((e) => ({
        ...e,
        duration: (new Date(e.end).getTime() - new Date(e.start).getTime()) / 1e3
      })).filter((e) => e.duration >= 0),
      status_type: this._editType
    }), this.fetchData();
  }
  deleteSession(t) {
    this._editSessions = this._editSessions.filter((e, r) => r !== t), this._autoSave();
  }
  addSession(t, e, r) {
    const o = this._detailDate, s = /* @__PURE__ */ new Date(`${o}T${t}:00`), a = /* @__PURE__ */ new Date(`${o}T${e}:00`);
    if (isNaN(s.getTime()) || isNaN(a.getTime())) {
      alert("Ungültige Zeit");
      return;
    }
    const l = (a.getTime() - s.getTime()) / 1e3;
    this._editSessions.push({
      start: s.toISOString(),
      end: a.toISOString(),
      duration: l,
      location: r || "office"
    }), this._addFormOpen = !1, this.requestUpdate(), this._autoSave();
  }
  exportToCSV() {
    const t = [["Datum", "Dauer (Sek)", "Dauer (h)", "Typ"]];
    Object.values(this._data).forEach((a) => {
      t.push([a.date, a.duration, (a.duration / 3600).toFixed(2), a.type]);
    });
    const e = t.map((a) => a.join(",")).join(`
`), r = new Blob([e], { type: "text/csv" }), o = URL.createObjectURL(r), s = document.createElement("a");
    s.href = o, s.download = `jobclock_export_${M(/* @__PURE__ */ new Date())}.csv`, s.click();
  }
  formatTime(t) {
    const e = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), o = Math.floor(t % 60);
    return e > 0 ? `${e.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}:${o.toString().padStart(2, "0")}` : `${r.toString().padStart(2, "0")}:${o.toString().padStart(2, "0")}`;
  }
  formatShortTime(t) {
    return (t / 3600).toFixed(1) + "h";
  }
  _showSettings() {
    const t = this.config.entity, e = new CustomEvent("hass-more-info", {
      detail: { entityId: t },
      bubbles: !0,
      composed: !0
    });
    this.dispatchEvent(e);
  }
  render() {
    if (!this.hass || !this.config) return h`<div class="p-4 text-white">Lade Home Assistant Daten...</div>`;
    const t = this.hass.states[this.config.entity];
    if (!t) return h`<div class="p-4 text-red-500">Sensor nicht gefunden</div>`;
    const e = t.attributes.is_working, r = t.attributes.session_start, o = t.attributes.switch_entity, a = (o ? this.hass.states[o]?.state === "on" : !1) ? "home" : "office";
    let l = 0;
    e && r && (l = Math.floor((Date.now() - new Date(r).getTime()) / 1e3));
    const n = this._data[M(/* @__PURE__ */ new Date())] || { duration: 0, target: 0 }, p = (n.duration || 0) + l, d = n.target || 8 * 3600;
    let c = 0, u = 0;
    Object.values(this._data).forEach((v) => {
      c += v.duration || 0, u += v.target || 0;
    }), e && (c += l);
    const b = {
      ist: c / 3600,
      soll: u / 3600,
      saldo: (c - u) / 3600
    }, w = e, N = Math.min(p / d * 100, 100), m = 64, y = 2 * Math.PI * m, B = y - N / 100 * y;
    (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE", { day: "numeric", month: "long" });
    const W = this._currentMonth.toLocaleDateString("de-DE", { month: "short" }).toUpperCase(), S = this._currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" }), A = 40, f = 40, xt = [
      { label: "Mo", duration: 8, target: 8, type: "work" },
      { label: "Di", duration: 6, target: 8, type: "work" },
      { label: "Mi", duration: 4, target: 8, type: "work" },
      { label: "Do", duration: 8, target: 8, type: "work" },
      { label: "Fr", duration: 8, target: 8, type: "work" },
      { label: "Sa", duration: 0, target: 0, type: "weekend" },
      { label: "So", duration: 0, target: 0, type: "weekend" }
    ], mt = a === "home" ? "bg-purple-500" : "bg-blue-500", yt = a === "home" ? "bg-purple-400" : "bg-blue-400", kt = a === "home" ? "stroke-purple-500" : "stroke-blue-500";
    return h`
      <div class="w-full max-w-md mx-auto space-y-4 font-sans text-neutral-100 selection:bg-purple-500/30">
          


          <!-- TIMER CARD -->
          <div class="bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-neutral-700/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-row items-center gap-6">
            <!-- Ambient Glow -->
            <div class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${mt}"></div>
                
                <!-- ORB -->
                <button 
                  @click="${this._manualToggle}"
                  class="relative w-36 h-36 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none group z-10"
                >
                  <div class="absolute inset-0 bg-[#13161f] rounded-full shadow-inner border border-neutral-700/30"></div>

                  ${w ? h`<div class="absolute inset-1.5 rounded-full animate-ping opacity-[0.15] ${yt}"></div>` : ""}

                  ${w ? h`
                  <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                    <defs>
                      <filter id="glowTimer" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <circle cx="80" cy="80" r="${m}" class="stroke-neutral-800" stroke-width="8" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="${m}"
                      class="transition-all duration-1000 ease-out ${kt}"
                      stroke-width="8" stroke-linecap="round" fill="transparent" stroke-dasharray="${y}" stroke-dashoffset="${B}"
                      filter="url(#glowTimer)"
                    />
                  </svg>

                  ` : h`
                  <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                    <circle cx="80" cy="80" r="${m}" class="stroke-neutral-800" stroke-width="8" fill="transparent" />
                    <circle
                      cx="80" cy="80" r="${m}"
                      class="transition-all duration-1000 ease-out stroke-[#444455]"
                      stroke-width="8" stroke-linecap="round" fill="transparent" stroke-dasharray="${y}" stroke-dashoffset="${B}"
                    />
                  </svg>
                  `}

                  <div class="absolute flex flex-col items-center justify-center text-center mt-1 z-30">
                    <div class="mb-1 transition-colors duration-300 ${w ? a === "home" ? "text-purple-400" : "text-blue-400" : "text-neutral-400 group-hover:text-purple-400"}">
                       ${w ? h`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>` : h`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`}
                    </div>
                    <span class="text-2xl font-light mb-0.5 font-mono transition-colors duration-300 ${w ? "text-white" : "text-neutral-300"}">
                      ${this.formatTime(p)}
                    </span>
                    <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-0.5">
                      Soll: ${Math.floor(d / 3600)}h ${d % 3600 / 60}m
                    </div>
                  </div>
                </button>

                <!-- RIGHT SIDE (MODE & STATS) -->
                <div class="flex flex-col flex-1 h-36 relative w-full pt-1">
                    
                    ${o ? h`
                    <div class="relative flex w-full bg-neutral-900/80 rounded-xl p-1 border border-neutral-700/50 shadow-inner">
                        <button 
                        @click="${() => this._handleModeChange("home")}"
                        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${a === "home" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" : "text-neutral-500 hover:text-neutral-400 border border-transparent"}"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            Home
                        </button>
                        <button 
                        @click="${() => this._handleModeChange("office")}"
                        class="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${a === "office" ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" : "text-neutral-500 hover:text-neutral-400 border border-transparent"}"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>
                            Büro
                        </button>
                    </div>
                    ` : ""}

                    <div class="mt-auto pb-4">
                        <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                            Monat (${W})
                        </div>
                        <div class="flex justify-between items-end mb-2">
                            <div class="flex items-baseline gap-1">
                                <span class="text-2xl font-light text-white font-mono">${b.ist.toFixed(1)}h</span>
                                <span class="text-[11px] font-medium text-neutral-500">/ ${b.soll.toFixed(1)}h</span>
                            </div>
                            <div class="flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${b.saldo >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}">
                                ${b.saldo > 0 ? "+" : ""}${b.saldo.toFixed(1)}h
                            </div>
                        </div>
                        <div class="w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden shadow-inner border border-neutral-700/30">
                            <div 
                                class="h-full rounded-full transition-all duration-1000 ${a === "home" ? "bg-purple-400" : "bg-blue-400"}"
                                style="width: ${Math.min(b.ist / Math.max(b.soll, 1) * 100, 100)}%"
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
                    ${A.toFixed(1)} / ${f.toFixed(1)}h
                </div>
            </div>

            <div class="flex justify-between items-end h-28 gap-2 mt-6">
                ${xt.map((v) => {
      const $t = v.type === "weekend", Q = v.target, X = v.duration, tt = v.label === ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][(/* @__PURE__ */ new Date()).getDay()];
      let q = "";
      if ($t || Q === 0)
        q = h`<div class="relative w-full h-20 bg-neutral-800 rounded-lg border border-neutral-700/30 overflow-hidden group"></div>`;
      else {
        const _t = Math.min(X / Math.max(Q, 1) * 100, 100);
        q = h`
                        <div class="relative w-full flex flex-col justify-end h-20 bg-neutral-800 rounded-lg border ${tt ? "border-neutral-500/50" : "border-neutral-700/30"} overflow-hidden group">
                            <div class="w-full ${a === "home" ? "bg-purple-500" : "bg-blue-500"} rounded-b-lg transition-all duration-1000 ease-out" style="height: ${_t}%"></div>
                            <div class="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-xs px-2 py-1 rounded border border-neutral-600 whitespace-nowrap text-white font-mono z-10">
                                ${X.toFixed(1)}h
                            </div>
                        </div>
                       `;
      }
      return h`
                    <div class="flex flex-col items-center gap-2 flex-1 h-full">
                        <div class="w-full flex-1 flex flex-col justify-end">
                            ${q}
                        </div>
                        <span class="text-[11px] font-semibold ${tt ? "text-white" : "text-neutral-500"}">${v.label}</span>
                    </div>
                   `;
    })}
            </div>
          </div>

          <!-- CALENDAR -->
          <div class="calendar bg-neutral-800/50 rounded-3xl p-6 border border-purple-500/10 hover:border-purple-500/20 transition-colors">
            <div class="cal-nav flex justify-between items-center mb-6 px-2">
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span class="cal-title font-bold text-white">${S}</span>
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(1)}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="cal-grid grid grid-cols-7 gap-1.5 sm:gap-2">
              ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((v) => h`<div class="cal-hdr text-center text-[10px] font-bold text-neutral-500 mb-2">${v}</div>`)}
              ${this.renderCalendarDays(this._currentMonth, a)}
            </div>
          </div>

        ${this._detailOpen ? this._renderDayDetail() : ""}

      </div>
    `;
  }
  renderCalendarDays(t, e) {
    const r = [], o = new Date(t.getFullYear(), t.getMonth(), 1), s = new Date(t.getFullYear(), t.getMonth() + 1, 0), a = M(/* @__PURE__ */ new Date());
    let l = o.getDay() - 1;
    l === -1 && (l = 6);
    for (let d = 0; d < l; d++) r.push(h`<div class="cal-empty aspect-square rounded-xl opacity-0 cursor-default"></div>`);
    for (let d = 1; d <= s.getDate(); d++) {
      const c = M(new Date(t.getFullYear(), t.getMonth(), d)), u = this._data[c], b = c === a, w = u?.target || 0, N = u?.duration || 0;
      let m = "bg-neutral-800/40 hover:bg-neutral-700/80", y = "border border-neutral-700/30";
      b && (y = e === "home" ? "border border-purple-500/80 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "border border-blue-500/80 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]");
      let B = "text-sm", W = "font-bold", S = "text-neutral-400", A = "text-neutral-500", f = "";
      u?.type === "sick" ? (S = "text-rose-400", A = "text-rose-500", f = "Krank") : u?.type === "vacation" ? (S = "text-amber-400", A = "text-amber-500", f = "Urlaub") : N > 0 ? (f = (N / 3600).toFixed(1) + "h", S = e === "home" ? "text-purple-400" : "text-blue-400", A = e === "home" ? "text-purple-400" : "text-blue-400") : w > 0 && (f = (w / 3600).toFixed(1) + "h"), r.push(h`
          <div class="cal-cell aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-colors ${m} ${y}" @click=${() => this.openDayDetail(c, u)}>
            <span class="${B} ${W} ${S}">${d}</span>
            ${f ? h`<span class="text-[10px] font-bold tracking-wider ${A} mt-0.5">
              ${f}
            </span>` : ""}
          </div>
        `);
    }
    const p = 42 - r.length;
    for (let d = 0; d < p; d++)
      r.push(h`<div class="cal-empty aspect-square rounded-xl opacity-0 cursor-default"></div>`);
    return r;
  }
  _renderDayDetail() {
    const t = this._detailData, e = this._editSessions, o = (e.reduce((a, l) => {
      const n = new Date(l.start).getTime(), p = new Date(l.end).getTime();
      return a + (isNaN(n) || isNaN(p) ? 0 : (p - n) / 1e3);
    }, 0) / 3600).toFixed(2), s = ((t?.target || 0) / 3600).toFixed(1);
    return h`
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all" @click=${this.closeDayDetail}>
        <div class="bg-[#1a1f2b] border border-neutral-700/50 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" @click=${(a) => a.stopPropagation()}>
          
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex justify-between items-center relative">
            <h3 class="text-lg font-bold text-white">${Jt(this._detailDate)}</h3>
            <button class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition" @click=${this.closeDayDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-2 overflow-y-auto max-h-[60vh] custom-scrollbar">
            
            <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Typ</div>
            <div class="relative flex w-full bg-[#13161f] rounded-xl p-1 border border-neutral-800 shadow-inner mb-4">
                <button @click=${() => {
      this._editType = "work", this._autoSave();
    }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === "work" ? "bg-purple-500/15 text-purple-300 border border-purple-500/20 shadow-sm" : "text-neutral-500 hover:text-neutral-400 border border-transparent"}">
                    Arbeit
                </button>
                <button @click=${() => {
      this._editType = "vacation", this._autoSave();
    }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === "vacation" ? "bg-amber-500/15 text-amber-300 border border-amber-500/20 shadow-sm" : "text-neutral-500 hover:text-neutral-400 border border-transparent"}">
                    Urlaub
                </button>
                <button @click=${() => {
      this._editType = "sick", this._autoSave();
    }} class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${this._editType === "sick" ? "bg-rose-500/15 text-rose-300 border border-rose-500/20 shadow-sm" : "text-neutral-500 hover:text-neutral-400 border border-transparent"}">
                    Krank
                </button>
            </div>

            ${this._editType === "work" ? h`
            <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-4 mb-2">Aufgezeichnete Zeiten</div>
            
            <div class="flex flex-col gap-2">
              ${e.map((a, l) => h`
                <div class="relative flex items-center gap-2 sm:gap-3 p-2 bg-neutral-800/40 border border-neutral-700/50 rounded-2xl group transition-all">
                  
                  <!-- Modus Button (Links als großes Icon Quadrat) -->
                  <button @click=${() => {
      a.location = (a.location || "office") === "home" ? "office" : "home", this.requestUpdate(), this._autoSave();
    }}
                          class="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all ${a.location === "home" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}">
                    ${a.location === "home" ? h`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` : h`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`}
                  </button>
                  
                  <!-- Zeit-Pille (Mitte) -->
                  <div class="flex-1 flex items-center bg-[#13161f] rounded-xl border border-neutral-800 p-1 shadow-inner">
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Von</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" 
                             .value=${new Date(a.start).toTimeString().slice(0, 5)} 
                             @change=${(n) => {
      a.start = `${this._detailDate}T${n.target.value}:00`, this.requestUpdate(), this._autoSave();
    }}>
                    </div>
                    <div class="w-px h-8 bg-neutral-800 mx-1"></div>
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                      <span class="text-[8px] uppercase tracking-widest text-neutral-500 font-bold mb-0.5">Bis</span>
                      <input type="time" class="w-full bg-transparent text-white font-mono text-sm text-center outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full" 
                             .value=${new Date(a.end).toTimeString().slice(0, 5)} 
                             @change=${(n) => {
      a.end = `${this._detailDate}T${n.target.value}:00`, this.requestUpdate(), this._autoSave();
    }}>
                    </div>
                  </div>

                  <!-- Löschen Button (Rechts) -->
                  <button class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                          @click=${() => this.deleteSession(l)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              `)}
              ${e.length === 0 && !this._addFormOpen ? h`<div class="text-neutral-500 text-sm text-center py-4">Keine Einträge</div>` : ""}
              
              ${this._addFormOpen ? h`
                <div class="relative flex items-center gap-2 sm:gap-3 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mt-2">
                  <button class="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all bg-blue-500/10 text-blue-400 border border-blue-500/20" id="new-loc-btn" @click=${(a) => {
      const l = a.currentTarget, n = l.dataset.loc === "home";
      l.dataset.loc = n ? "office" : "home", this.requestUpdate();
    }}>
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
                  <button class="w-10 h-10 flex-shrink-0 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors" @click=${() => {
      const l = this.renderRoot.querySelector("#new-loc-btn")?.dataset.loc === "home" ? "home" : "office";
      this.addSession(this.renderRoot.querySelector("#new-start").value, this.renderRoot.querySelector("#new-end").value, l);
    }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                  </button>
                </div>
              ` : h`
                <button class="w-full border border-dashed border-neutral-700/50 text-neutral-400 p-3 rounded-xl text-sm font-semibold hover:text-white hover:border-neutral-500 hover:bg-neutral-800/30 transition flex items-center justify-center gap-2 mt-2" @click=${() => this._addFormOpen = !0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Eintrag hinzufügen
                </button>
              `}
            </div>
            ` : h`
            <div class="py-8 mt-6 text-center flex flex-col items-center justify-center opacity-70 border border-dashed border-neutral-800 rounded-xl">
                <p class="text-xs text-neutral-400">
                    Der Tag ist als <strong class="${this._editType === "vacation" ? "text-amber-400" : "text-rose-400"}">${this._editType === "vacation" ? "Urlaub" : "Krank"}</strong> markiert. <br/>
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
                     <span class="text-2xl font-light text-white font-mono">${o}h</span>
                 </div>
                 <div class="h-8 w-px bg-neutral-800"></div>
                 <div class="flex flex-col items-start">
                     <span class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Soll</span>
                     <span class="text-2xl font-light text-neutral-400 font-mono">${s}h</span>
                 </div>
              </div>
              
              <button class="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${this._editType === "work" ? "bg-purple-600 hover:bg-purple-500 shadow-[0_4px_20px_rgba(147,51,234,0.3)]" : this._editType === "vacation" ? "bg-amber-600 hover:bg-amber-500 shadow-[0_4px_20px_rgba(217,119,6,0.3)]" : "bg-rose-600 hover:bg-rose-500 shadow-[0_4px_20px_rgba(225,29,72,0.3)]"}" @click=${this.closeDayDetail}>
                  Speichern
              </button>
          </div>

        </div>
      </div>
    `;
  }
  static get styles() {
    return [ut(Yt)];
  }
}
customElements.define("jobclock-card", Kt);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
