/* @ds-bundle: {"namespace":"FortyPixelsDS","components":[{"name":"Arrow","sourcePath":"components/general/Arrow/Arrow.jsx"},{"name":"BrowserFrame","sourcePath":"components/general/BrowserFrame/BrowserFrame.jsx"},{"name":"Button","sourcePath":"components/general/Button/Button.jsx"},{"name":"ContactBand","sourcePath":"components/general/ContactBand/ContactBand.jsx"},{"name":"FaqAccordion","sourcePath":"components/general/FaqAccordion/FaqAccordion.jsx"},{"name":"Field","sourcePath":"components/general/Field/Field.jsx"},{"name":"LineLink","sourcePath":"components/general/LineLink/LineLink.jsx"},{"name":"MetricGrid","sourcePath":"components/general/MetricGrid/MetricGrid.jsx"},{"name":"PriceRow","sourcePath":"components/general/PriceRow/PriceRow.jsx"},{"name":"ProcessVisual","sourcePath":"components/general/ProcessVisual/ProcessVisual.jsx"},{"name":"ProjectCard","sourcePath":"components/general/ProjectCard/ProjectCard.jsx"},{"name":"Words","sourcePath":"components/general/Words/Words.jsx"}],"sourceHashes":{"components/general/Arrow/Arrow.jsx":"ee6218bc9370","components/general/Arrow/Arrow.d.ts":"97cd61f713f2","components/general/Arrow/Arrow.prompt.md":"c1561781a3a1","components/general/BrowserFrame/BrowserFrame.jsx":"e3970d06b876","components/general/BrowserFrame/BrowserFrame.d.ts":"ebb7662dd215","components/general/BrowserFrame/BrowserFrame.prompt.md":"48b99a5e4adb","components/general/Button/Button.jsx":"a6b83575f30f","components/general/Button/Button.d.ts":"372b155a6a23","components/general/Button/Button.prompt.md":"ece3eb9484e0","components/general/ContactBand/ContactBand.jsx":"0faf1e6de3e0","components/general/ContactBand/ContactBand.d.ts":"51969b1559ff","components/general/ContactBand/ContactBand.prompt.md":"feecec71ff8e","components/general/FaqAccordion/FaqAccordion.jsx":"2e5ef4178968","components/general/FaqAccordion/FaqAccordion.d.ts":"e4d65fcab3d0","components/general/FaqAccordion/FaqAccordion.prompt.md":"ae5d5230e11f","components/general/Field/Field.jsx":"057829d1c75d","components/general/Field/Field.d.ts":"ddb3e42896e2","components/general/Field/Field.prompt.md":"bdf6589d96e6","components/general/LineLink/LineLink.jsx":"56919758268e","components/general/LineLink/LineLink.d.ts":"120d87566190","components/general/LineLink/LineLink.prompt.md":"65f53ea143c0","components/general/MetricGrid/MetricGrid.jsx":"49d6f9ae676b","components/general/MetricGrid/MetricGrid.d.ts":"7a4cd868d850","components/general/MetricGrid/MetricGrid.prompt.md":"d82830546861","components/general/PriceRow/PriceRow.jsx":"e4150e7c6392","components/general/PriceRow/PriceRow.d.ts":"3b700c04186b","components/general/PriceRow/PriceRow.prompt.md":"6aced5adad34","components/general/ProcessVisual/ProcessVisual.jsx":"cde8e2b0efb8","components/general/ProcessVisual/ProcessVisual.d.ts":"bade59c8b24f","components/general/ProcessVisual/ProcessVisual.prompt.md":"2b30b4c653b8","components/general/ProjectCard/ProjectCard.jsx":"bb7615940832","components/general/ProjectCard/ProjectCard.d.ts":"82ea8705bdd8","components/general/ProjectCard/ProjectCard.prompt.md":"79b9139c3f70","components/general/Words/Words.jsx":"37b979bec562","components/general/Words/Words.d.ts":"cba844b1647b","components/general/Words/Words.prompt.md":"3bcf496ea69f"},"inlinedExternals":[],"builtBy":"cc-design-sync" */
"use strict";
var FortyPixelsDS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // <define:import.meta.env>
  var init_define_import_meta_env = __esm({
    "<define:import.meta.env>"() {
    }
  });

  // shim:react-shim
  var require_react_shim = __commonJS({
    "shim:react-shim"(exports, module) {
      init_define_import_meta_env();
      var R = window.React;
      function np(p, k) {
        var o = {};
        for (var x in p) if (x !== "children") o[x] = p[x];
        if (k !== void 0) o.key = k;
        return o;
      }
      function jsx13(t, p, k) {
        var c = p && p.children;
        return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
      }
      function jsxs12(t, p, k) {
        return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
      }
      module.exports = R;
      module.exports.jsx = jsx13;
      module.exports.jsxs = jsxs12;
      module.exports.jsxDEV = function(t, p, k, s) {
        return (s ? jsxs12 : jsx13)(t, p, k);
      };
      module.exports.Fragment = R.Fragment;
    }
  });

  // packages/design-system/dist/index.js
  var index_exports = {};
  __export(index_exports, {
    Arrow: () => Arrow,
    BrowserFrame: () => BrowserFrame,
    Button: () => Button,
    ContactBand: () => ContactBand,
    FaqAccordion: () => FaqAccordion,
    Field: () => Field,
    LineLink: () => LineLink,
    MetricGrid: () => MetricGrid,
    PriceRow: () => PriceRow,
    ProcessVisual: () => ProcessVisual,
    ProjectCard: () => ProjectCard,
    Words: () => Words
  });
  init_define_import_meta_env();
  var import_jsx_runtime = __toESM(require_react_shim(), 1);
  var import_jsx_runtime2 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime3 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime4 = __toESM(require_react_shim(), 1);
  var import_react = __toESM(require_react_shim(), 1);
  var import_jsx_runtime5 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime6 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime7 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime8 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime9 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime10 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime11 = __toESM(require_react_shim(), 1);
  var import_jsx_runtime12 = __toESM(require_react_shim(), 1);
  function Arrow() {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ui-arrow", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}) });
  }
  function Words({ children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-words": true, "aria-label": children, children: children.split(" ").map((word, i) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "clip", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "word", children: [
      word,
      "\xA0"
    ] }) }, i)) });
  }
  function LineLink({ href, children, hideArrow = false, className = "", target, rel }) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("a", { href, className: `line-link ${className}`.trim(), target, rel, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children }),
      !hideArrow && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Arrow, {})
    ] });
  }
  function Button({ children, href, variant = "outline", arrow = true, type = "button", disabled, onClick, className = "" }) {
    const cls = `fp-button fp-button-${variant} ${className}`.trim();
    const inner = /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
      children,
      arrow && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Arrow, {})
    ] });
    if (href) return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { href, className: cls, onClick, children: inner });
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type, className: cls, disabled, onClick, children: inner });
  }
  function FaqAccordion({ items, defaultOpen }) {
    const [open, setOpen] = (0, import_react.useState)(defaultOpen ?? null);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "faq-accordion", children: items.map(([question, answer], i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "faq-item" + (open === i ? " is-open" : ""), children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "faq-trigger", "aria-expanded": open === i, onClick: () => setOpen(open === i ? null : i), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: question }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "faq-plus", children: "+" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "faq-answer", "aria-hidden": open !== i, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: answer }) }) })
    ] }, question)) });
  }
  function BrowserFrame({ url, children, className = "" }) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: `browser-frame ${className}`.trim(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", {}),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", {}),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("i", {}),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: url })
      ] }),
      children
    ] });
  }
  function ProjectCard({ name, tag, url, summary, href, image, tone = "lime", large = false, showWebsite = false }) {
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("article", { className: `project-card ${tone}${large ? " is-large" : ""}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "project-card-top", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { children: [
          "// ",
          tag
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: url })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "project-stage", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(BrowserFrame, { url, children: image && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("img", { src: image, alt: `${name} logo` }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "project-card-bottom", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("h3", { children: name }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: summary })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "project-actions", children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("a", { href, className: "project-link", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "View case" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Arrow, {})
          ] }),
          showWebsite && /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("a", { href: `https://${url}`, className: "project-link project-site-link", target: "_blank", rel: "noopener noreferrer", children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: "Visit website" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Arrow, {})
          ] })
        ] })
      ] })
    ] });
  }
  function PriceRow({ index, name, description, price, timeline, monthly = false }) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("article", { className: `pricing-row ${price ? "" : "is-custom"}`, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "pricing-row-index", children: String(index).padStart(2, "0") }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: name }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "pricing-row-copy", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: description }),
        timeline && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: timeline })
      ] }),
      price ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "pricing-price", children: [
        price,
        monthly && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("small", { children: "/mo" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "pricing-quote", children: "Quoted" })
    ] });
  }
  function MetricGrid({ items, className = "" }) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `case-metrics ${className}`.trim(), children: items.map((m) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("article", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("strong", { children: m.value }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: m.label })
    ] }, m.label)) });
  }
  function Field({ label, name, type = "text", placeholder, required = false, rows = 6, options, full = false }) {
    const control = type === "textarea" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("textarea", { name, required, rows, placeholder }) : type === "select" ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("select", { name, required, defaultValue: "", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("option", { value: "", disabled: true, children: placeholder || "Select an option" }),
      (options || []).map((o) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("option", { children: o }, o))
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("input", { name, type, required, placeholder });
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("label", { className: full ? "full" : void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
        label,
        required && " *"
      ] }),
      control
    ] });
  }
  function ContactBand({ title = "Let's build something that earns attention.", eyebrow = "// NEXT STEP", children }) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "contact-band", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: eyebrow }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Words, { children: title }) }),
      children
    ] });
  }
  function ProcessVisual({ kind, className = "" }) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: `process-visual visual-${kind} ${className}`.trim(), "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { viewBox: "0 0 240 120", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
      kind === "discovery" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-a", cx: "120", cy: "60", r: "17" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-b", cx: "120", cy: "60", r: "34" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-c", cx: "120", cy: "60", r: "51" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-accent pv-dot", cx: "120", cy: "60", r: "4" })
      ] }),
      kind === "direction" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-a", d: "M24 28H78C98 28 98 60 120 60H216" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-b", d: "M24 92H78C98 92 98 60 120 60" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-c", d: "M24 60H216" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-accent pv-dot", cx: "120", cy: "60", r: "4" })
      ] }),
      kind === "design" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-a", x: "34", y: "24", width: "76", height: "72" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-b", x: "130", y: "24", width: "76", height: "30" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-c", x: "130", y: "66", width: "76", height: "30" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-accent", d: "M46 38H98M46 49H82M142 38H191M142 80H184" })
      ] }),
      kind === "build" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-build-frame", x: "42", y: "22", width: "156", height: "76" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-build-header", d: "M42 40H198" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-build-light pv-a", cx: "54", cy: "31", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-build-light pv-b", cx: "64", cy: "31", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-build-light pv-c", cx: "74", cy: "31", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-build-row pv-row-1", x: "58", y: "52", width: "80", height: "7" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-build-row pv-row-2", x: "58", y: "66", width: "116", height: "7" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-build-row pv-row-3 pv-accent", x: "58", y: "80", width: "66", height: "7" })
      ] }),
      kind === "quality" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-quality-sheet", x: "54", y: "20", width: "132", height: "80" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-quality-line", d: "M80 42H164M80 60H164M80 78H164" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-quality-check pv-a pv-accent", d: "M62 42L68 48L77 36" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-quality-check pv-b pv-accent", d: "M62 60L68 66L77 54" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-quality-check pv-c pv-accent", d: "M62 78L68 84L77 72" })
      ] }),
      kind === "release" && /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-live-window", x: "38", y: "22", width: "164", height: "76" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { className: "pv-live-header", d: "M38 42H202" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-live-dot", cx: "51", cy: "32", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-live-dot", cx: "61", cy: "32", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("circle", { className: "pv-live-dot", cx: "71", cy: "32", r: "3" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-live-track", x: "56", y: "55", width: "128", height: "5" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-live-progress pv-accent", x: "56", y: "55", width: "128", height: "5" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("rect", { className: "pv-live-badge", x: "126", y: "70", width: "58", height: "17" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("text", { className: "pv-live-text", x: "155", y: "82", children: "LIVE" })
      ] })
    ] }) });
  }
  return __toCommonJS(index_exports);
})();
window.FortyPixelsDS=FortyPixelsDS.__dsMainNs?Object.assign({},FortyPixelsDS,FortyPixelsDS.__dsMainNs,{__dsMainNs:undefined}):FortyPixelsDS;
