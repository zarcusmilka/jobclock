const H = globalThis, I = H.ShadowRoot && (H.ShadyCSS === void 0 || H.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, at = /* @__PURE__ */ Symbol(), J = /* @__PURE__ */ new WeakMap();
let gt = class {
  constructor(t, e, r) {
    if (this._$cssResult$ = !0, r !== at) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (I && t === void 0) {
      const r = e !== void 0 && e.length === 1;
      r && (t = J.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), r && J.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const st = (a) => new gt(typeof a == "string" ? a : a + "", void 0, at), bt = (a, t) => {
  if (I) a.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const r = document.createElement("style"), o = H.litNonce;
    o !== void 0 && r.setAttribute("nonce", o), r.textContent = e.cssText, a.appendChild(r);
  }
}, Z = I ? (a) => a : (a) => a instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const r of t.cssRules) e += r.cssText;
  return st(e);
})(a) : a;
const { is: wt, defineProperty: ft, getOwnPropertyDescriptor: vt, getOwnPropertyNames: mt, getOwnPropertySymbols: xt, getPrototypeOf: yt } = Object, R = globalThis, K = R.trustedTypes, kt = K ? K.emptyScript : "", $t = R.reactiveElementPolyfillSupport, E = (a, t) => a, F = { toAttribute(a, t) {
  switch (t) {
    case Boolean:
      a = a ? kt : null;
      break;
    case Object:
    case Array:
      a = a == null ? a : JSON.stringify(a);
  }
  return a;
}, fromAttribute(a, t) {
  let e = a;
  switch (t) {
    case Boolean:
      e = a !== null;
      break;
    case Number:
      e = a === null ? null : Number(a);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(a);
      } catch {
        e = null;
      }
  }
  return e;
} }, nt = (a, t) => !wt(a, t), G = { attribute: !0, type: String, converter: F, reflect: !1, useDefault: !1, hasChanged: nt };
Symbol.metadata ??= /* @__PURE__ */ Symbol("metadata"), R.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let $ = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = G) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const r = /* @__PURE__ */ Symbol(), o = this.getPropertyDescriptor(t, r, e);
      o !== void 0 && ft(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, e, r) {
    const { get: o, set: s } = vt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(i) {
      this[e] = i;
    } };
    return { get: o, set(i) {
      const d = o?.call(this);
      s?.call(this, i), this.requestUpdate(t, d, r);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? G;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const t = yt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const e = this.properties, r = [...mt(e), ...xt(e)];
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
      for (const o of r) e.unshift(Z(o));
    } else t !== void 0 && e.push(Z(t));
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
    return bt(t, this.constructor.elementStyles), t;
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
      const s = (r.converter?.toAttribute !== void 0 ? r.converter : F).toAttribute(e, r.type);
      this._$Em = t, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const r = this.constructor, o = r._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = r.getPropertyOptions(o), i = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : F;
      this._$Em = o;
      const d = i.fromAttribute(e, s.type);
      this[o] = d ?? this._$Ej?.get(o) ?? d, this._$Em = null;
    }
  }
  requestUpdate(t, e, r, o = !1, s) {
    if (t !== void 0) {
      const i = this.constructor;
      if (o === !1 && (s = this[t]), r ??= i.getPropertyOptions(t), !((r.hasChanged ?? nt)(s, e) || r.useDefault && r.reflect && s === this._$Ej?.get(t) && !this.hasAttribute(i._$Eu(t, r)))) return;
      this.C(t, e, r);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: r, reflect: o, wrapped: s }, i) {
    r && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, i ?? e ?? this[t]), s !== !0 || i !== void 0) || (this._$AL.has(t) || (this.hasUpdated || r || (e = void 0), this._$AL.set(t, e)), o === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
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
        const { wrapped: i } = s, d = this[o];
        i !== !0 || this._$AL.has(o) || d === void 0 || this.C(o, void 0, s, d);
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
$.elementStyles = [], $.shadowRootOptions = { mode: "open" }, $[E("elementProperties")] = /* @__PURE__ */ new Map(), $[E("finalized")] = /* @__PURE__ */ new Map(), $t?.({ ReactiveElement: $ }), (R.reactiveElementVersions ??= []).push("2.1.2");
const q = globalThis, Q = (a) => a, P = q.trustedTypes, X = P ? P.createPolicy("lit-html", { createHTML: (a) => a }) : void 0, lt = "$lit$", v = `lit$${Math.random().toFixed(9).slice(2)}$`, ct = "?" + v, _t = `<${ct}>`, y = document, M = () => y.createComment(""), D = (a) => a === null || typeof a != "object" && typeof a != "function", W = Array.isArray, St = (a) => W(a) || typeof a?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, A = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, tt = /-->/g, et = />/g, m = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), rt = /'/g, ot = /"/g, dt = /^(?:script|style|textarea|title)$/i, At = (a) => (t, ...e) => ({ _$litType$: a, strings: t, values: e }), p = At(1), _ = /* @__PURE__ */ Symbol.for("lit-noChange"), b = /* @__PURE__ */ Symbol.for("lit-nothing"), it = /* @__PURE__ */ new WeakMap(), x = y.createTreeWalker(y, 129);
function ht(a, t) {
  if (!W(a) || !a.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return X !== void 0 ? X.createHTML(t) : t;
}
const Et = (a, t) => {
  const e = a.length - 1, r = [];
  let o, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", i = A;
  for (let d = 0; d < e; d++) {
    const n = a[d];
    let c, h, l = -1, w = 0;
    for (; w < n.length && (i.lastIndex = w, h = i.exec(n), h !== null); ) w = i.lastIndex, i === A ? h[1] === "!--" ? i = tt : h[1] !== void 0 ? i = et : h[2] !== void 0 ? (dt.test(h[2]) && (o = RegExp("</" + h[2], "g")), i = m) : h[3] !== void 0 && (i = m) : i === m ? h[0] === ">" ? (i = o ?? A, l = -1) : h[1] === void 0 ? l = -2 : (l = i.lastIndex - h[2].length, c = h[1], i = h[3] === void 0 ? m : h[3] === '"' ? ot : rt) : i === ot || i === rt ? i = m : i === tt || i === et ? i = A : (i = m, o = void 0);
    const u = i === m && a[d + 1].startsWith("/>") ? " " : "";
    s += i === A ? n + _t : l >= 0 ? (r.push(c), n.slice(0, l) + lt + n.slice(l) + v + u) : n + v + (l === -2 ? d : u);
  }
  return [ht(a, s + (a[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
};
class O {
  constructor({ strings: t, _$litType$: e }, r) {
    let o;
    this.parts = [];
    let s = 0, i = 0;
    const d = t.length - 1, n = this.parts, [c, h] = Et(t, e);
    if (this.el = O.createElement(c, r), x.currentNode = this.el.content, e === 2 || e === 3) {
      const l = this.el.content.firstChild;
      l.replaceWith(...l.childNodes);
    }
    for (; (o = x.nextNode()) !== null && n.length < d; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const l of o.getAttributeNames()) if (l.endsWith(lt)) {
          const w = h[i++], u = o.getAttribute(l).split(v), g = /([.?@])?(.*)/.exec(w);
          n.push({ type: 1, index: s, name: g[2], strings: u, ctor: g[1] === "." ? Mt : g[1] === "?" ? Dt : g[1] === "@" ? Ot : B }), o.removeAttribute(l);
        } else l.startsWith(v) && (n.push({ type: 6, index: s }), o.removeAttribute(l));
        if (dt.test(o.tagName)) {
          const l = o.textContent.split(v), w = l.length - 1;
          if (w > 0) {
            o.textContent = P ? P.emptyScript : "";
            for (let u = 0; u < w; u++) o.append(l[u], M()), x.nextNode(), n.push({ type: 2, index: ++s });
            o.append(l[w], M());
          }
        }
      } else if (o.nodeType === 8) if (o.data === ct) n.push({ type: 2, index: s });
      else {
        let l = -1;
        for (; (l = o.data.indexOf(v, l + 1)) !== -1; ) n.push({ type: 7, index: s }), l += v.length - 1;
      }
      s++;
    }
  }
  static createElement(t, e) {
    const r = y.createElement("template");
    return r.innerHTML = t, r;
  }
}
function S(a, t, e = a, r) {
  if (t === _) return t;
  let o = r !== void 0 ? e._$Co?.[r] : e._$Cl;
  const s = D(t) ? void 0 : t._$litDirective$;
  return o?.constructor !== s && (o?._$AO?.(!1), s === void 0 ? o = void 0 : (o = new s(a), o._$AT(a, e, r)), r !== void 0 ? (e._$Co ??= [])[r] = o : e._$Cl = o), o !== void 0 && (t = S(a, o._$AS(a, t.values), o, r)), t;
}
class Ct {
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
    const { el: { content: e }, parts: r } = this._$AD, o = (t?.creationScope ?? y).importNode(e, !0);
    x.currentNode = o;
    let s = x.nextNode(), i = 0, d = 0, n = r[0];
    for (; n !== void 0; ) {
      if (i === n.index) {
        let c;
        n.type === 2 ? c = new T(s, s.nextSibling, this, t) : n.type === 1 ? c = new n.ctor(s, n.name, n.strings, this, t) : n.type === 6 && (c = new Tt(s, this, t)), this._$AV.push(c), n = r[++d];
      }
      i !== n?.index && (s = x.nextNode(), i++);
    }
    return x.currentNode = y, o;
  }
  p(t) {
    let e = 0;
    for (const r of this._$AV) r !== void 0 && (r.strings !== void 0 ? (r._$AI(t, r, e), e += r.strings.length - 2) : r._$AI(t[e])), e++;
  }
}
class T {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, r, o) {
    this.type = 2, this._$AH = b, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = r, this.options = o, this._$Cv = o?.isConnected ?? !0;
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
    t = S(this, t, e), D(t) ? t === b || t == null || t === "" ? (this._$AH !== b && this._$AR(), this._$AH = b) : t !== this._$AH && t !== _ && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : St(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== b && D(this._$AH) ? this._$AA.nextSibling.data = t : this.T(y.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: r } = t, o = typeof r == "number" ? this._$AC(t) : (r.el === void 0 && (r.el = O.createElement(ht(r.h, r.h[0]), this.options)), r);
    if (this._$AH?._$AD === o) this._$AH.p(e);
    else {
      const s = new Ct(o, this), i = s.u(this.options);
      s.p(e), this.T(i), this._$AH = s;
    }
  }
  _$AC(t) {
    let e = it.get(t.strings);
    return e === void 0 && it.set(t.strings, e = new O(t)), e;
  }
  k(t) {
    W(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let r, o = 0;
    for (const s of t) o === e.length ? e.push(r = new T(this.O(M()), this.O(M()), this, this.options)) : r = e[o], r._$AI(s), o++;
    o < e.length && (this._$AR(r && r._$AB.nextSibling, o), e.length = o);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const r = Q(t).nextSibling;
      Q(t).remove(), t = r;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class B {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, r, o, s) {
    this.type = 1, this._$AH = b, this._$AN = void 0, this.element = t, this.name = e, this._$AM = o, this.options = s, r.length > 2 || r[0] !== "" || r[1] !== "" ? (this._$AH = Array(r.length - 1).fill(new String()), this.strings = r) : this._$AH = b;
  }
  _$AI(t, e = this, r, o) {
    const s = this.strings;
    let i = !1;
    if (s === void 0) t = S(this, t, e, 0), i = !D(t) || t !== this._$AH && t !== _, i && (this._$AH = t);
    else {
      const d = t;
      let n, c;
      for (t = s[0], n = 0; n < s.length - 1; n++) c = S(this, d[r + n], e, n), c === _ && (c = this._$AH[n]), i ||= !D(c) || c !== this._$AH[n], c === b ? t = b : t !== b && (t += (c ?? "") + s[n + 1]), this._$AH[n] = c;
    }
    i && !o && this.j(t);
  }
  j(t) {
    t === b ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Mt extends B {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === b ? void 0 : t;
  }
}
class Dt extends B {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== b);
  }
}
class Ot extends B {
  constructor(t, e, r, o, s) {
    super(t, e, r, o, s), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = S(this, t, e, 0) ?? b) === _) return;
    const r = this._$AH, o = t === b && r !== b || t.capture !== r.capture || t.once !== r.once || t.passive !== r.passive, s = t !== b && (r === b || o);
    o && this.element.removeEventListener(this.name, this, r), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Tt {
  constructor(t, e, r) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = r;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    S(this, t);
  }
}
const zt = q.litHtmlPolyfillSupport;
zt?.(O, T), (q.litHtmlVersions ??= []).push("3.3.2");
const jt = (a, t, e) => {
  const r = e?.renderBefore ?? t;
  let o = r._$litPart$;
  if (o === void 0) {
    const s = e?.renderBefore ?? null;
    r._$litPart$ = o = new T(t.insertBefore(M(), s), s, void 0, e ?? {});
  }
  return o._$AI(a), o;
};
const V = globalThis;
class C extends $ {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = jt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return _;
  }
}
C._$litElement$ = !0, C.finalized = !0, V.litElementHydrateSupport?.({ LitElement: C });
const Ut = V.litElementPolyfillSupport;
Ut?.({ LitElement: C });
(V.litElementVersions ??= []).push("4.2.2");
const Nt = '@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-translate-x:0;--tw-translate-y:0;--tw-translate-z:0;--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-space-y-reverse:0;--tw-border-style:solid;--tw-gradient-position:initial;--tw-gradient-from:#0000;--tw-gradient-via:#0000;--tw-gradient-to:#0000;--tw-gradient-stops:initial;--tw-gradient-via-stops:initial;--tw-gradient-from-position:0%;--tw-gradient-via-position:50%;--tw-gradient-to-position:100%;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-backdrop-blur:initial;--tw-backdrop-brightness:initial;--tw-backdrop-contrast:initial;--tw-backdrop-grayscale:initial;--tw-backdrop-hue-rotate:initial;--tw-backdrop-invert:initial;--tw-backdrop-opacity:initial;--tw-backdrop-saturate:initial;--tw-backdrop-sepia:initial;--tw-duration:initial;--tw-ease:initial;--tw-scale-x:1;--tw-scale-y:1;--tw-scale-z:1}}}@layer theme{:root,:host{--font-sans:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";--font-mono:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;--color-red-500:oklch(63.7% .237 25.331);--color-amber-400:oklch(82.8% .189 84.429);--color-emerald-400:oklch(76.5% .177 163.223);--color-emerald-500:oklch(69.6% .17 162.48);--color-blue-300:oklch(80.9% .105 251.813);--color-blue-400:oklch(70.7% .165 254.624);--color-blue-500:oklch(62.3% .214 259.815);--color-indigo-400:oklch(67.3% .182 276.935);--color-indigo-500:oklch(58.5% .233 277.117);--color-purple-300:oklch(82.7% .119 306.383);--color-purple-400:oklch(71.4% .203 305.504);--color-purple-500:oklch(62.7% .265 303.9);--color-rose-400:oklch(71.2% .194 13.428);--color-rose-500:oklch(64.5% .246 16.439);--color-neutral-100:oklch(97% 0 0);--color-neutral-300:oklch(87% 0 0);--color-neutral-400:oklch(70.8% 0 0);--color-neutral-500:oklch(55.6% 0 0);--color-neutral-600:oklch(43.9% 0 0);--color-neutral-700:oklch(37.1% 0 0);--color-neutral-800:oklch(26.9% 0 0);--color-neutral-900:oklch(20.5% 0 0);--color-black:#000;--color-white:#fff;--spacing:.25rem;--container-sm:24rem;--container-md:28rem;--text-xs:.75rem;--text-xs--line-height:calc(1 / .75);--text-sm:.875rem;--text-sm--line-height:calc(1.25 / .875);--text-lg:1.125rem;--text-lg--line-height:calc(1.75 / 1.125);--text-xl:1.25rem;--text-xl--line-height:calc(1.75 / 1.25);--text-2xl:1.5rem;--text-2xl--line-height:calc(2 / 1.5);--font-weight-light:300;--font-weight-medium:500;--font-weight-semibold:600;--font-weight-bold:700;--tracking-tighter:-.05em;--tracking-tight:-.025em;--tracking-wider:.05em;--tracking-widest:.1em;--radius-lg:.5rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.5rem;--drop-shadow-xl:0 9px 7px #0000001a;--ease-out:cubic-bezier(0, 0, .2, 1);--animate-ping:ping 1s cubic-bezier(0, 0, .2, 1) infinite;--blur-sm:8px;--blur-xl:24px;--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4, 0, .2, 1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}::-webkit-calendar-picker-indicator{line-height:1}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}}@layer components;@layer utilities{.pointer-events-none{pointer-events:none}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.inset-0{inset:calc(var(--spacing) * 0)}.inset-1\\.5{inset:calc(var(--spacing) * 1.5)}.inset-3{inset:calc(var(--spacing) * 3)}.start{inset-inline-start:var(--spacing)}.end{inset-inline-end:var(--spacing)}.-top-16{top:calc(var(--spacing) * -16)}.top-1{top:calc(var(--spacing) * 1)}.bottom-1{bottom:calc(var(--spacing) * 1)}.-left-16{left:calc(var(--spacing) * -16)}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-\\[1000\\]{z-index:1000}.mt-0\\.5{margin-top:calc(var(--spacing) * .5)}.mt-1\\.5{margin-top:calc(var(--spacing) * 1.5)}.mt-2{margin-top:calc(var(--spacing) * 2)}.mt-6{margin-top:calc(var(--spacing) * 6)}.mb-0\\.5{margin-bottom:calc(var(--spacing) * .5)}.mb-1{margin-bottom:calc(var(--spacing) * 1)}.mb-2{margin-bottom:calc(var(--spacing) * 2)}.mb-3{margin-bottom:calc(var(--spacing) * 3)}.mb-4{margin-bottom:calc(var(--spacing) * 4)}.mb-6{margin-bottom:calc(var(--spacing) * 6)}.ml-auto{margin-left:auto}.flex{display:flex}.grid{display:grid}.aspect-square{aspect-ratio:1}.h-1\\.5{height:calc(var(--spacing) * 1.5)}.h-40{height:calc(var(--spacing) * 40)}.h-64{height:calc(var(--spacing) * 64)}.h-full{height:100%}.min-h-screen{min-height:100vh}.w-4{width:calc(var(--spacing) * 4)}.w-40{width:calc(var(--spacing) * 40)}.w-64{width:calc(var(--spacing) * 64)}.w-\\[72px\\]{width:72px}.w-\\[calc\\(50\\%-4px\\)\\]{width:calc(50% - 4px)}.w-full{width:100%}.max-w-md{max-width:var(--container-md)}.max-w-sm{max-width:var(--container-sm)}.flex-1{flex:1}.flex-shrink-0{flex-shrink:0}.translate-x-0{--tw-translate-x:calc(var(--spacing) * 0);translate:var(--tw-translate-x) var(--tw-translate-y)}.translate-x-\\[calc\\(100\\%\\+4px\\)\\]{--tw-translate-x: calc(100% + 4px) ;translate:var(--tw-translate-x) var(--tw-translate-y)}.-rotate-90{rotate:-90deg}.transform{transform:var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,)}.animate-ping{animation:var(--animate-ping)}.cursor-pointer{cursor:pointer}.grid-cols-7{grid-template-columns:repeat(7,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.items-baseline{align-items:baseline}.items-center{align-items:center}.items-end{align-items:flex-end}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.gap-1{gap:calc(var(--spacing) * 1)}.gap-1\\.5{gap:calc(var(--spacing) * 1.5)}.gap-2{gap:calc(var(--spacing) * 2)}.gap-3{gap:calc(var(--spacing) * 3)}.gap-3\\.5{gap:calc(var(--spacing) * 3.5)}.gap-6{gap:calc(var(--spacing) * 6)}:where(.space-y-6>:not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(calc(var(--spacing) * 6) * var(--tw-space-y-reverse));margin-block-end:calc(calc(var(--spacing) * 6) * calc(1 - var(--tw-space-y-reverse)))}.overflow-hidden{overflow:hidden}.rounded-2xl{border-radius:var(--radius-2xl)}.rounded-3xl{border-radius:var(--radius-3xl)}.rounded-full{border-radius:3.40282e38px}.rounded-lg{border-radius:var(--radius-lg)}.rounded-xl{border-radius:var(--radius-xl)}.border{border-style:var(--tw-border-style);border-width:1px}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-t{border-top-style:var(--tw-border-style);border-top-width:1px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.border-none{--tw-border-style:none;border-style:none}.border-blue-500\\/30{border-color:#3080ff4d}@supports (color:color-mix(in lab,red,red)){.border-blue-500\\/30{border-color:color-mix(in oklab,var(--color-blue-500) 30%,transparent)}}.border-emerald-500\\/20{border-color:#00bb7f33}@supports (color:color-mix(in lab,red,red)){.border-emerald-500\\/20{border-color:color-mix(in oklab,var(--color-emerald-500) 20%,transparent)}}.border-indigo-500{border-color:var(--color-indigo-500)}.border-indigo-500\\/30{border-color:#625fff4d}@supports (color:color-mix(in lab,red,red)){.border-indigo-500\\/30{border-color:color-mix(in oklab,var(--color-indigo-500) 30%,transparent)}}.border-neutral-700{border-color:var(--color-neutral-700)}.border-neutral-700\\/30{border-color:#4040404d}@supports (color:color-mix(in lab,red,red)){.border-neutral-700\\/30{border-color:color-mix(in oklab,var(--color-neutral-700) 30%,transparent)}}.border-neutral-700\\/50{border-color:#40404080}@supports (color:color-mix(in lab,red,red)){.border-neutral-700\\/50{border-color:color-mix(in oklab,var(--color-neutral-700) 50%,transparent)}}.border-purple-500\\/30{border-color:#ac4bff4d}@supports (color:color-mix(in lab,red,red)){.border-purple-500\\/30{border-color:color-mix(in oklab,var(--color-purple-500) 30%,transparent)}}.border-rose-500\\/20{border-color:#ff235733}@supports (color:color-mix(in lab,red,red)){.border-rose-500\\/20{border-color:color-mix(in oklab,var(--color-rose-500) 20%,transparent)}}.border-transparent{border-color:#0000}.border-white\\/5{border-color:#ffffff0d}@supports (color:color-mix(in lab,red,red)){.border-white\\/5{border-color:color-mix(in oklab,var(--color-white) 5%,transparent)}}.border-white\\/10{border-color:#ffffff1a}@supports (color:color-mix(in lab,red,red)){.border-white\\/10{border-color:color-mix(in oklab,var(--color-white) 10%,transparent)}}.bg-black\\/80{background-color:#000c}@supports (color:color-mix(in lab,red,red)){.bg-black\\/80{background-color:color-mix(in oklab,var(--color-black) 80%,transparent)}}.bg-blue-400{background-color:var(--color-blue-400)}.bg-blue-500{background-color:var(--color-blue-500)}.bg-blue-500\\/20{background-color:#3080ff33}@supports (color:color-mix(in lab,red,red)){.bg-blue-500\\/20{background-color:color-mix(in oklab,var(--color-blue-500) 20%,transparent)}}.bg-emerald-500\\/10{background-color:#00bb7f1a}@supports (color:color-mix(in lab,red,red)){.bg-emerald-500\\/10{background-color:color-mix(in oklab,var(--color-emerald-500) 10%,transparent)}}.bg-indigo-500\\/10{background-color:#625fff1a}@supports (color:color-mix(in lab,red,red)){.bg-indigo-500\\/10{background-color:color-mix(in oklab,var(--color-indigo-500) 10%,transparent)}}.bg-neutral-500{background-color:var(--color-neutral-500)}.bg-neutral-800{background-color:var(--color-neutral-800)}.bg-neutral-900{background-color:var(--color-neutral-900)}.bg-neutral-900\\/80{background-color:#171717cc}@supports (color:color-mix(in lab,red,red)){.bg-neutral-900\\/80{background-color:color-mix(in oklab,var(--color-neutral-900) 80%,transparent)}}.bg-purple-400{background-color:var(--color-purple-400)}.bg-purple-500{background-color:var(--color-purple-500)}.bg-purple-500\\/20{background-color:#ac4bff33}@supports (color:color-mix(in lab,red,red)){.bg-purple-500\\/20{background-color:color-mix(in oklab,var(--color-purple-500) 20%,transparent)}}.bg-rose-500\\/10{background-color:#ff23571a}@supports (color:color-mix(in lab,red,red)){.bg-rose-500\\/10{background-color:color-mix(in oklab,var(--color-rose-500) 10%,transparent)}}.bg-transparent{background-color:#0000}.bg-white\\/5{background-color:#ffffff0d}@supports (color:color-mix(in lab,red,red)){.bg-white\\/5{background-color:color-mix(in oklab,var(--color-white) 5%,transparent)}}.bg-gradient-to-b{--tw-gradient-position:to bottom in oklab;background-image:linear-gradient(var(--tw-gradient-stops))}.from-neutral-800\\/80{--tw-gradient-from:#262626cc}@supports (color:color-mix(in lab,red,red)){.from-neutral-800\\/80{--tw-gradient-from:color-mix(in oklab, var(--color-neutral-800) 80%, transparent)}}.from-neutral-800\\/80{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))}.to-neutral-900\\/80{--tw-gradient-to:#171717cc}@supports (color:color-mix(in lab,red,red)){.to-neutral-900\\/80{--tw-gradient-to:color-mix(in oklab, var(--color-neutral-900) 80%, transparent)}}.to-neutral-900\\/80{--tw-gradient-stops:var(--tw-gradient-via-stops,var(--tw-gradient-position), var(--tw-gradient-from) var(--tw-gradient-from-position), var(--tw-gradient-to) var(--tw-gradient-to-position))}.stroke-amber-400{stroke:var(--color-amber-400)}.stroke-blue-500{stroke:var(--color-blue-500)}.stroke-neutral-600{stroke:var(--color-neutral-600)}.stroke-neutral-800{stroke:var(--color-neutral-800)}.stroke-purple-500{stroke:var(--color-purple-500)}.p-1{padding:calc(var(--spacing) * 1)}.p-2{padding:calc(var(--spacing) * 2)}.p-3{padding:calc(var(--spacing) * 3)}.p-4{padding:calc(var(--spacing) * 4)}.p-5{padding:calc(var(--spacing) * 5)}.p-6{padding:calc(var(--spacing) * 6)}.px-1{padding-inline:calc(var(--spacing) * 1)}.px-2{padding-inline:calc(var(--spacing) * 2)}.px-3{padding-inline:calc(var(--spacing) * 3)}.py-1{padding-block:calc(var(--spacing) * 1)}.py-1\\.5{padding-block:calc(var(--spacing) * 1.5)}.py-2{padding-block:calc(var(--spacing) * 2)}.py-4{padding-block:calc(var(--spacing) * 4)}.pt-5{padding-top:calc(var(--spacing) * 5)}.text-center{text-align:center}.font-mono{font-family:var(--font-mono)}.font-sans{font-family:var(--font-sans)}.text-2xl{font-size:var(--text-2xl);line-height:var(--tw-leading,var(--text-2xl--line-height))}.text-lg{font-size:var(--text-lg);line-height:var(--tw-leading,var(--text-lg--line-height))}.text-sm{font-size:var(--text-sm);line-height:var(--tw-leading,var(--text-sm--line-height))}.text-xl{font-size:var(--text-xl);line-height:var(--tw-leading,var(--text-xl--line-height))}.text-xs{font-size:var(--text-xs);line-height:var(--tw-leading,var(--text-xs--line-height))}.text-\\[10px\\]{font-size:10px}.font-bold{--tw-font-weight:var(--font-weight-bold);font-weight:var(--font-weight-bold)}.font-light{--tw-font-weight:var(--font-weight-light);font-weight:var(--font-weight-light)}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.font-semibold{--tw-font-weight:var(--font-weight-semibold);font-weight:var(--font-weight-semibold)}.tracking-tight{--tw-tracking:var(--tracking-tight);letter-spacing:var(--tracking-tight)}.tracking-tighter{--tw-tracking:var(--tracking-tighter);letter-spacing:var(--tracking-tighter)}.tracking-wider{--tw-tracking:var(--tracking-wider);letter-spacing:var(--tracking-wider)}.tracking-widest{--tw-tracking:var(--tracking-widest);letter-spacing:var(--tracking-widest)}.text-blue-300{color:var(--color-blue-300)}.text-blue-400{color:var(--color-blue-400)}.text-emerald-400{color:var(--color-emerald-400)}.text-indigo-400{color:var(--color-indigo-400)}.text-neutral-100{color:var(--color-neutral-100)}.text-neutral-300{color:var(--color-neutral-300)}.text-neutral-400{color:var(--color-neutral-400)}.text-neutral-500{color:var(--color-neutral-500)}.text-purple-300{color:var(--color-purple-300)}.text-purple-400{color:var(--color-purple-400)}.text-red-500{color:var(--color-red-500)}.text-rose-400{color:var(--color-rose-400)}.text-white{color:var(--color-white)}.uppercase{text-transform:uppercase}.opacity-20{opacity:.2}.opacity-50{opacity:.5}.opacity-\\[0\\.15\\]{opacity:.15}.shadow-2xl{--tw-shadow:0 25px 50px -12px var(--tw-shadow-color,#00000040);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-\\[0_8px_30px_rgba\\(0\\,0\\,0\\,0\\.2\\)\\]{--tw-shadow:0 8px 30px var(--tw-shadow-color,#0003);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-inner{--tw-shadow:inset 0 2px 4px 0 var(--tw-shadow-color,#0000000d);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-sm{--tw-shadow:0 1px 3px 0 var(--tw-shadow-color,#0000001a), 0 1px 2px -1px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.blur{--tw-blur:blur(8px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.blur-\\[80px\\]{--tw-blur:blur(80px);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.drop-shadow-xl{--tw-drop-shadow-size:drop-shadow(0 9px 7px var(--tw-drop-shadow-color,#0000001a));--tw-drop-shadow:drop-shadow(var(--drop-shadow-xl));filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.grayscale{--tw-grayscale:grayscale(100%);filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,)}.backdrop-blur-sm{--tw-backdrop-blur:blur(var(--blur-sm));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.backdrop-blur-xl{--tw-backdrop-blur:blur(var(--blur-xl));-webkit-backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,);backdrop-filter:var(--tw-backdrop-blur,) var(--tw-backdrop-brightness,) var(--tw-backdrop-contrast,) var(--tw-backdrop-grayscale,) var(--tw-backdrop-hue-rotate,) var(--tw-backdrop-invert,) var(--tw-backdrop-opacity,) var(--tw-backdrop-saturate,) var(--tw-backdrop-sepia,)}.transition{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to,opacity,box-shadow,transform,translate,scale,rotate,filter,-webkit-backdrop-filter,backdrop-filter,display,content-visibility,overlay,pointer-events;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-colors{transition-property:color,background-color,border-color,outline-color,text-decoration-color,fill,stroke,--tw-gradient-from,--tw-gradient-via,--tw-gradient-to;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.duration-300{--tw-duration:.3s;transition-duration:.3s}.duration-1000{--tw-duration:1s;transition-duration:1s}.ease-out{--tw-ease:var(--ease-out);transition-timing-function:var(--ease-out)}.outline-none{--tw-outline-style:none;outline-style:none}@media(hover:hover){.group-hover\\:text-purple-400:is(:where(.group):hover *){color:var(--color-purple-400)}.hover\\:scale-\\[1\\.02\\]:hover{scale:1.02}.hover\\:border-indigo-400:hover{border-color:var(--color-indigo-400)}.hover\\:bg-emerald-500\\/20:hover{background-color:#00bb7f33}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-emerald-500\\/20:hover{background-color:color-mix(in oklab,var(--color-emerald-500) 20%,transparent)}}.hover\\:bg-neutral-800:hover{background-color:var(--color-neutral-800)}.hover\\:bg-rose-500\\/20:hover{background-color:#ff235733}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-rose-500\\/20:hover{background-color:color-mix(in oklab,var(--color-rose-500) 20%,transparent)}}.hover\\:bg-white\\/10:hover{background-color:#ffffff1a}@supports (color:color-mix(in lab,red,red)){.hover\\:bg-white\\/10:hover{background-color:color-mix(in oklab,var(--color-white) 10%,transparent)}}.hover\\:text-neutral-300:hover{color:var(--color-neutral-300)}.hover\\:text-white:hover{color:var(--color-white)}}.focus\\:outline-none:focus{--tw-outline-style:none;outline-style:none}.active\\:scale-95:active{--tw-scale-x:95%;--tw-scale-y:95%;--tw-scale-z:95%;scale:var(--tw-scale-x) var(--tw-scale-y)}@media(min-width:40rem){.sm\\:p-6{padding:calc(var(--spacing) * 6)}}@media(min-width:48rem){.md\\:p-8{padding:calc(var(--spacing) * 8)}}}@property --tw-translate-x{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-y{syntax:"*";inherits:false;initial-value:0}@property --tw-translate-z{syntax:"*";inherits:false;initial-value:0}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-space-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-gradient-position{syntax:"*";inherits:false}@property --tw-gradient-from{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-via{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-to{syntax:"<color>";inherits:false;initial-value:#0000}@property --tw-gradient-stops{syntax:"*";inherits:false}@property --tw-gradient-via-stops{syntax:"*";inherits:false}@property --tw-gradient-from-position{syntax:"<length-percentage>";inherits:false;initial-value:0%}@property --tw-gradient-via-position{syntax:"<length-percentage>";inherits:false;initial-value:50%}@property --tw-gradient-to-position{syntax:"<length-percentage>";inherits:false;initial-value:100%}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-tracking{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-backdrop-blur{syntax:"*";inherits:false}@property --tw-backdrop-brightness{syntax:"*";inherits:false}@property --tw-backdrop-contrast{syntax:"*";inherits:false}@property --tw-backdrop-grayscale{syntax:"*";inherits:false}@property --tw-backdrop-hue-rotate{syntax:"*";inherits:false}@property --tw-backdrop-invert{syntax:"*";inherits:false}@property --tw-backdrop-opacity{syntax:"*";inherits:false}@property --tw-backdrop-saturate{syntax:"*";inherits:false}@property --tw-backdrop-sepia{syntax:"*";inherits:false}@property --tw-duration{syntax:"*";inherits:false}@property --tw-ease{syntax:"*";inherits:false}@property --tw-scale-x{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-y{syntax:"*";inherits:false;initial-value:1}@property --tw-scale-z{syntax:"*";inherits:false;initial-value:1}@keyframes ping{75%,to{opacity:0;transform:scale(2)}}', k = (a) => {
  const t = a.getFullYear(), e = String(a.getMonth() + 1).padStart(2, "0"), r = String(a.getDate()).padStart(2, "0");
  return `${t}-${e}-${r}`;
}, Ht = (a) => {
  if (!a) return "";
  const [t, e, r] = a.split("-");
  return `${r}.${e}.${t}`;
};
class Pt extends (customElements.get("ha-panel-lovelace") ? C : HTMLElement) {
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
        start_date: k(t),
        end_date: k(e)
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
    const o = this._detailDate, s = /* @__PURE__ */ new Date(`${o}T${t}:00`), i = /* @__PURE__ */ new Date(`${o}T${e}:00`);
    if (isNaN(s.getTime()) || isNaN(i.getTime())) {
      alert("Ungültige Zeit");
      return;
    }
    const d = (i.getTime() - s.getTime()) / 1e3;
    this._editSessions.push({
      start: s.toISOString(),
      end: i.toISOString(),
      duration: d,
      location: r || "office"
    }), this._addFormOpen = !1, this.requestUpdate(), this._autoSave();
  }
  exportToCSV() {
    const t = [["Datum", "Dauer (Sek)", "Dauer (h)", "Typ"]];
    Object.values(this._data).forEach((i) => {
      t.push([i.date, i.duration, (i.duration / 3600).toFixed(2), i.type]);
    });
    const e = t.map((i) => i.join(",")).join(`
`), r = new Blob([e], { type: "text/csv" }), o = URL.createObjectURL(r), s = document.createElement("a");
    s.href = o, s.download = `jobclock_export_${k(/* @__PURE__ */ new Date())}.csv`, s.click();
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
    if (!this.hass || !this.config) return p`<div class="p-4 text-white">Lade Home Assistant Daten...</div>`;
    const t = this.hass.states[this.config.entity];
    if (!t) return p`<div class="p-4 text-red-500">Sensor nicht gefunden</div>`;
    const e = t.attributes.is_working, r = t.attributes.session_start, o = t.attributes.switch_entity, i = (o ? this.hass.states[o]?.state === "on" : !1) ? "home" : "office";
    let d = 0;
    e && r && (d = Math.floor((Date.now() - new Date(r).getTime()) / 1e3));
    const n = this._data[k(/* @__PURE__ */ new Date())] || { duration: 0, target: 0 }, c = (n.duration || 0) + d, h = n.target || 8 * 3600;
    let l = 0, w = 0;
    Object.values(this._data).forEach((N) => {
      l += N.duration || 0, w += N.target || 0;
    }), e && (l += d);
    const u = {
      ist: l / 3600,
      soll: w / 3600,
      saldo: (l - w) / 3600
    }, g = e, z = Math.min(c / h * 100, 100), j = c > h, f = 64, U = 2 * Math.PI * f, Y = U - z / 100 * U, pt = (/* @__PURE__ */ new Date()).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "short" }), ut = this._currentMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    return p`
      <div class="min-h-screen bg-neutral-900 text-neutral-100 p-4 md:p-8 font-sans flex justify-center">
        <div class="w-full max-w-md space-y-6">
          
          <!-- HEADER -->
          <div class="flex justify-between items-center mb-2">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold tracking-tight text-white">JobClock</h1>
              </div>
              <p class="text-neutral-400 text-sm mt-0.5">Heute, ${pt}</p>
            </div>
            <div class="flex gap-2">
                <button @click="${this.exportToCSV}" class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                </button>
                <button @click="${this._showSettings}" class="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
          </div>

          <!-- MAIN CARD (ORB & CONTROLS) -->
          <div class="bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-neutral-700/30 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-row items-center gap-6">
            
            ${g ? p`<div class="absolute -top-16 -left-16 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000 ${i === "office" ? "bg-blue-500" : "bg-purple-500"}"></div>` : ""}

            <!-- LEFT: ORB BUTTON -->
            <button 
              @click="${this._manualToggle}"
              class="relative w-40 h-40 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none group z-10"
            >
              ${g ? p`<div class="absolute inset-1.5 rounded-full animate-ping opacity-[0.15] ${i === "office" ? "bg-blue-400" : "bg-purple-400"}"></div>` : ""}
              <div class="absolute inset-3 bg-neutral-900/80 rounded-full shadow-inner border border-white/5"></div>

              ${g ? p`
              <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="80" cy="80" r="${f}" class="stroke-neutral-800" stroke-width="10" fill="transparent" />
                <circle
                  cx="80" cy="80" r="${f}"
                  class="transition-all duration-1000 ease-out ${j ? "stroke-amber-400" : i === "office" ? "stroke-blue-500" : "stroke-purple-500"}"
                  stroke-width="10" stroke-linecap="round" fill="transparent" stroke-dasharray="${U}" stroke-dashoffset="${Y}"
                  filter="url(#glow)"
                />
              </svg>
              ` : p`
              <svg class="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl z-20" viewBox="0 0 160 160" style="pointer-events: none;">
                <circle cx="80" cy="80" r="${f}" class="stroke-neutral-800" stroke-width="10" fill="transparent" />
                <circle
                  cx="80" cy="80" r="${f}"
                  class="transition-all duration-1000 ease-out stroke-neutral-600"
                  stroke-width="10" stroke-linecap="round" fill="transparent" stroke-dasharray="${U}" stroke-dashoffset="${Y}"
                />
              </svg>
              `}

              <div class="absolute flex flex-col items-center justify-center text-center mt-1.5 z-30">
                <div class="mb-1 transition-colors duration-300 ${g ? i === "office" ? "text-blue-400" : "text-purple-400" : "text-neutral-500 group-hover:text-purple-400"}">
                   ${g ? p`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>` : p`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`}
                </div>
                <span class="text-2xl font-light tracking-tighter mb-0.5 font-mono transition-colors duration-300 ${g ? "text-white" : "text-neutral-300"}">
                  ${this.formatTime(c)}
                </span>
                <div class="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">
                  Soll: ${this.formatShortTime(h)}
                </div>
              </div>
            </button>

            <!-- RIGHT: CONTROLS & STATS -->
            <div class="flex-1 w-full flex flex-col justify-center gap-3.5 z-10">
              
              ${o ? p`
              <div class="relative flex w-full bg-neutral-900/80 rounded-xl p-1 border border-neutral-700/50 shadow-inner">
                <div class="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out shadow-sm ${i === "office" ? "translate-x-[calc(100%+4px)] bg-blue-500/20 border border-blue-500/30" : "translate-x-0 bg-purple-500/20 border border-purple-500/30"} ${g ? "" : "opacity-50 grayscale"}"></div>

                <button 
                  @click="${() => this._handleModeChange("home")}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${i === "home" ? g ? "text-purple-300" : "text-neutral-300" : "text-neutral-500 hover:text-neutral-300"}"
                >
                  Home
                </button>
                <button 
                  @click="${() => this._handleModeChange("office")}"
                  class="flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${i === "office" ? g ? "text-blue-300" : "text-neutral-300" : "text-neutral-500 hover:text-neutral-300"}"
                >
                  Büro
                </button>
              </div>
              ` : ""}

              <!-- MONTHLY SUMMARY -->
              <div class="mt-2 flex flex-col gap-3 px-1">
                <div class="flex justify-between items-end">
                  <div>
                    <div class="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                      Monat
                    </div>
                    <div class="flex items-baseline gap-1.5">
                      <span class="text-xl font-light text-white font-mono">${u.ist.toFixed(1)}h</span>
                      <span class="text-xs font-medium text-neutral-500">/ ${u.soll.toFixed(1)}h</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold ${u.saldo >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}">
                    ${u.saldo > 0 ? "+" : ""}${u.saldo.toFixed(1)}h
                  </div>
                </div>
                <div class="w-full h-1.5 bg-neutral-900/80 rounded-full overflow-hidden shadow-inner border border-neutral-700/30">
                  <div 
                    class="h-full rounded-full transition-all duration-1000 ${g ? i === "office" ? "bg-blue-400" : "bg-purple-400" : "bg-neutral-500"}"
                    style="width: ${Math.min(u.ist / Math.max(u.soll, 1) * 100, 100)}%"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- CALENDAR -->
          <div class="calendar mt-6 bg-gradient-to-b from-neutral-800/80 to-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/30 p-4">
            <div class="cal-nav flex justify-between items-center mb-4">
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span class="cal-title font-bold text-white">${ut}</span>
              <button class="nav-btn p-2 hover:bg-neutral-800 rounded-full transition-colors text-white" @click=${() => this.changeMonth(1)}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="cal-grid grid grid-cols-7 gap-1">
              ${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((N) => p`<div class="cal-hdr text-center text-xs font-bold text-neutral-500 mb-2">${N}</div>`)}
              ${this.renderCalendarDays(this._currentMonth)}
            </div>
          </div>

        </div>
        
        ${this._detailOpen ? this._renderDayDetail() : ""}

      </div>
    `;
  }
  renderCalendarDays(t) {
    const e = [], r = new Date(t.getFullYear(), t.getMonth(), 1), o = new Date(t.getFullYear(), t.getMonth() + 1, 0), s = k(/* @__PURE__ */ new Date());
    let i = r.getDay() - 1;
    i === -1 && (i = 6);
    for (let c = 0; c < i; c++) e.push(p`<div class="cal-empty aspect-square"></div>`);
    for (let c = 1; c <= o.getDate(); c++) {
      const h = k(new Date(t.getFullYear(), t.getMonth(), c)), l = this._data[h], w = h === s;
      l?.type === "work" || l?.type;
      const u = l?.target || 0, g = l?.duration || 0;
      let z = "bg-white/5 hover:bg-white/10", j = w ? "border-2 border-primary" : "border border-transparent";
      w && (z = "bg-indigo-500/10", j = "border-2 border-indigo-500");
      let f = "text-neutral-400";
      g > 0 && (f = g >= u ? "text-emerald-400" : "text-rose-400"), e.push(p`
          <div class="cal-cell aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${z} ${j}" @click=${() => this.openDayDetail(h, l)}>
            <span class="text-sm font-bold ${f}">${c}</span>
            ${l?.duration > 0 || l?.type && l?.type !== "work" ? p`
              <span class="text-[10px] font-semibold ${f}">
                ${l?.type === "vacation" ? p`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 22 20-20"/><path d="m14 22 8-8"/><path d="M4 12a8 8 0 0 0 8 8"/><path d="M8 8a8 8 0 0 0 8 8"/></svg>` : l?.type === "sick" ? p`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>` : ((l?.duration || 0) / 3600).toFixed(1) + "h"}
              </span>
            ` : ""}
          </div>
        `);
    }
    const n = 42 - e.length;
    for (let c = 0; c < n; c++)
      e.push(p`<div class="cal-empty aspect-square"></div>`);
    return e;
  }
  _renderDayDetail() {
    const t = this._detailData, e = this._editSessions, o = (e.reduce((i, d) => {
      const n = new Date(d.start).getTime(), c = new Date(d.end).getTime();
      return i + (isNaN(n) || isNaN(c) ? 0 : (c - n) / 1e3);
    }, 0) / 3600).toFixed(2), s = ((t?.target || 0) / 3600).toFixed(1);
    return p`
      <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4" @click=${this.closeDayDetail}>
        <div class="bg-neutral-900 border border-neutral-700/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl" @click=${(i) => i.stopPropagation()}>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-white">${Ht(this._detailDate)}</h3>
            <button class="text-neutral-400 hover:text-white transition" @click=${this.closeDayDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div class="mb-6">
            <div class="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-3">Aufgezeichnete Zeiten</div>
            <div class="flex flex-col gap-2">
              ${e.map((i, d) => p`
                <div class="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span class="text-[10px] text-indigo-400 font-bold w-4">#${d + 1}</span>
                  <div class="flex items-center gap-1 flex-1">
                      <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" .value=${new Date(i.start).toTimeString().slice(0, 5)} @change=${(n) => {
      i.start = `${this._detailDate}T${n.target.value}:00`, this.requestUpdate(), this._autoSave();
    }}>
                      <span class="text-neutral-500">—</span>
                      <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" .value=${new Date(i.end).toTimeString().slice(0, 5)} @change=${(n) => {
      i.end = `${this._detailDate}T${n.target.value}:00`, this.requestUpdate(), this._autoSave();
    }}>
                  </div>
                  <select class="bg-transparent border-none text-white text-sm cursor-pointer outline-none" .value=${i.location || "office"} @change=${(n) => {
      i.location = n.target.value, this.requestUpdate(), this._autoSave();
    }}>
                    <option class="bg-neutral-800" value="office">Office</option>
                    <option class="bg-neutral-800" value="home">Home</option>
                  </select>
                  <button class="text-rose-400 p-1 hover:bg-rose-500/20 rounded-lg transition" @click=${() => this.deleteSession(d)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              `)}
              ${e.length === 0 && !this._addFormOpen ? p`<div class="text-neutral-500 text-sm text-center py-4">Keine Einträge</div>` : ""}
              
              ${this._addFormOpen ? p`
                <div class="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mt-2">
                    <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" id="new-start" value="08:00">
                    <span class="text-neutral-500">—</span>
                    <input type="time" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm w-[72px]" id="new-end" value="16:00">
                    <select id="new-loc" class="bg-neutral-900 border border-neutral-700 text-white rounded-lg p-1 text-sm"><option value="office">Office</option><option value="home">Home</option></select>
                    <button class="text-emerald-400 p-1 hover:bg-emerald-500/20 rounded-lg transition ml-auto" @click=${() => this.addSession(this.querySelector("#new-start").value, this.querySelector("#new-end").value, this.querySelector("#new-loc").value)}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                    </button>
                </div>
              ` : p`
                <button class="w-full border border-dashed border-neutral-700 text-neutral-400 p-2 rounded-xl text-sm font-semibold hover:text-white hover:border-indigo-400 transition flex items-center justify-center gap-2 mt-2" @click=${() => this._addFormOpen = !0}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Eintrag hinzufügen
                </button>
              `}
            </div>

            <div class="border-t border-neutral-700/50 mt-6 pt-5 flex flex-col gap-3">
              <div class="flex justify-between items-center text-sm">
                 <span class="text-neutral-400">Arbeitszeit</span>
                 <span class="font-bold text-white">${o}h</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                 <span class="text-neutral-400">Soll</span>
                 <span class="font-bold text-white">${s}h</span>
              </div>
              <div class="flex justify-between items-center text-sm mt-2">
                <span class="text-neutral-400">Typ</span>
                <select class="bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-1.5 text-sm font-semibold outline-none" .value=${this._editType} @change=${(i) => {
      this._editType = i.target.value, this._autoSave();
    }}>
                    <option value="work">Arbeit</option>
                    <option value="vacation">Urlaub</option>
                    <option value="sick">Krank</option>
                </select>
              </div>
            </div>
          </div>

          </div>
        </div>
      </div>
    `;
  }
  static get styles() {
    return [st(Nt)];
  }
}
customElements.define("jobclock-card", Pt);
window.customCards = window.customCards || [];
window.customCards.push({ type: "jobclock-card", name: "JobClock Dashboard", description: "Modern Time Tracking" });
