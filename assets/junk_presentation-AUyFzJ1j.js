import"./modulepreload-polyfill-B5Qt9EMX.js";(()=>{const h="no_overflowing_text,no_overlapping_text,slide_sized_text",c=d=>String(d).padStart(2,"0"),p=`
    :host {
      position: fixed;
      inset: 0;
      display: block;
      background: var(--bg, #000);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif;
      overflow: hidden;
    }

    .stage {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .canvas {
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      background: #fff;
      will-change: transform;
    }

    /* Slides live in light DOM (via <slot>) so authored CSS still applies.
       We absolutely position each slotted child to stack them. */
    ::slotted(*) {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      visibility: hidden;
    }
    ::slotted([data-deck-active]) {
      opacity: 1;
      pointer-events: auto;
      visibility: visible;
    }

    /* Tap zones for mobile — back/forward thirds like Stories.
       Transparent, no visible UI, don't block the overlay. */
    .tapzones {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2147482000;
      pointer-events: none;
    }
    .tapzone {
      flex: 1;
      pointer-events: auto;
      -webkit-tap-highlight-color: transparent;
    }
    /* Only activate tap zones on coarse pointers (touch devices). */
    @media (hover: hover) and (pointer: fine) {
      .tapzones { display: none; }
    }

    .overlay {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translate(-50%, 6px) scale(0.92);
      filter: blur(6px);
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      background: #000;
      color: #fff;
      border-radius: 999px;
      font-size: 12px;
      font-feature-settings: "tnum" 1;
      letter-spacing: 0.01em;
      opacity: 0;
      pointer-events: none;
      transition: opacity 260ms ease, transform 260ms cubic-bezier(.2,.8,.2,1), filter 260ms ease;
      transform-origin: center bottom;
      z-index: 2147483000;
      user-select: none;
    }
    .overlay[data-visible] {
      opacity: 1;
      pointer-events: auto;
      transform: translate(-50%, 0) scale(1);
      filter: blur(0);
    }

    .btn {
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: 0;
      margin: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: default;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 28px;
      border-radius: 999px;
      color: rgba(255,255,255,0.72);
      transition: background 140ms ease, color 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
    .btn:active { background: rgba(255,255,255,0.18); }
    .btn:focus { outline: none; }
    .btn:focus-visible { outline: none; }
    .btn::-moz-focus-inner { border: 0; }
    .btn svg { width: 14px; height: 14px; display: block; }

    .count {
      font-variant-numeric: tabular-nums;
      color: #fff;
      font-weight: 500;
      padding: 0 8px;
      min-width: 42px;
      text-align: center;
      font-size: 12px;
    }
    .count .sep { color: rgba(255,255,255,0.45); margin: 0 3px; font-weight: 400; }
    .count .total { color: rgba(255,255,255,0.55); }

    /* ── Print: one page per slide, no chrome ────────────────────────────
       The screen layout stacks every slide at inset:0 inside a scaled
       canvas; for print we want them in document flow at the authored
       design size so the browser paginates one slide per sheet. The
       @page size is set from the width/height attributes via the inline
       <style id="deck-stage-print-page"> that connectedCallback injects
       into <head> (the @page at-rule has no effect inside shadow DOM). */
    @media print {
      :host {
        position: static;
        inset: auto;
        background: none;
        overflow: visible;
        color: inherit;
      }
      .stage { position: static; display: block; }
      .canvas {
        transform: none !important;
        width: auto !important;
        height: auto !important;
        background: none;
        will-change: auto;
      }
      ::slotted(*) {
        position: relative !important;
        inset: auto !important;
        width: var(--deck-design-w) !important;
        height: var(--deck-design-h) !important;
        box-sizing: border-box !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto;
        break-after: page;
        page-break-after: always;
        break-inside: avoid;
        overflow: hidden;
      }
      ::slotted(*:last-child) {
        break-after: auto;
        page-break-after: auto;
      }
      .overlay, .tapzones { display: none !important; }
    }
  `;class u extends HTMLElement{static get observedAttributes(){return["width","height","noscale"]}constructor(){super(),this._root=this.attachShadow({mode:"open"}),this._index=0,this._slides=[],this._notes=[],this._hideTimer=null,this._mouseIdleTimer=null,this._onKey=this._onKey.bind(this),this._onResize=this._onResize.bind(this),this._onSlotChange=this._onSlotChange.bind(this),this._onMouseMove=this._onMouseMove.bind(this),this._onTapBack=this._onTapBack.bind(this),this._onTapForward=this._onTapForward.bind(this)}get designWidth(){return parseInt(this.getAttribute("width"),10)||1920}get designHeight(){return parseInt(this.getAttribute("height"),10)||1080}connectedCallback(){this._render(),this._loadNotes(),this._syncPrintPageRule(),window.addEventListener("keydown",this._onKey),window.addEventListener("resize",this._onResize),window.addEventListener("mousemove",this._onMouseMove,{passive:!0})}disconnectedCallback(){window.removeEventListener("keydown",this._onKey),window.removeEventListener("resize",this._onResize),window.removeEventListener("mousemove",this._onMouseMove),this._hideTimer&&clearTimeout(this._hideTimer),this._mouseIdleTimer&&clearTimeout(this._mouseIdleTimer)}attributeChangedCallback(){this._canvas&&(this._canvas.style.width=this.designWidth+"px",this._canvas.style.height=this.designHeight+"px",this._canvas.style.setProperty("--deck-design-w",this.designWidth+"px"),this._canvas.style.setProperty("--deck-design-h",this.designHeight+"px"),this._fit(),this._syncPrintPageRule())}_render(){const i=document.createElement("style");i.textContent=p;const t=document.createElement("div");t.className="stage";const e=document.createElement("div");e.className="canvas",e.style.width=this.designWidth+"px",e.style.height=this.designHeight+"px",e.style.setProperty("--deck-design-w",this.designWidth+"px"),e.style.setProperty("--deck-design-h",this.designHeight+"px");const a=document.createElement("slot");a.addEventListener("slotchange",this._onSlotChange),e.appendChild(a),t.appendChild(e);const s=document.createElement("div");s.className="tapzones export-hidden",s.setAttribute("aria-hidden","true"),s.setAttribute("data-noncommentable","");const n=document.createElement("div");n.className="tapzone tapzone--back";const r=document.createElement("div");r.className="tapzone tapzone--mid",r.style.pointerEvents="none";const l=document.createElement("div");l.className="tapzone tapzone--fwd",n.addEventListener("click",this._onTapBack),l.addEventListener("click",this._onTapForward),s.append(n,r,l);const o=document.createElement("div");o.className="overlay export-hidden",o.setAttribute("role","toolbar"),o.setAttribute("aria-label","Deck controls"),o.setAttribute("data-noncommentable",""),o.innerHTML=`
        <button class="btn prev" type="button" aria-label="Previous slide" title="Previous (←)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>
        </button>
        <span class="count" aria-live="polite"><span class="current">1</span><span class="sep">/</span><span class="total">1</span></span>
        <button class="btn next" type="button" aria-label="Next slide" title="Next (→)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>
        </button>
      `,o.querySelector(".prev").addEventListener("click",()=>this._go(this._index-1,"click")),o.querySelector(".next").addEventListener("click",()=>this._go(this._index+1,"click")),this._root.append(i,t,s,o),this._canvas=e,this._slot=a,this._overlay=o,this._countEl=o.querySelector(".current"),this._totalEl=o.querySelector(".total")}_syncPrintPageRule(){const i="deck-stage-print-page";let t=document.getElementById(i);t||(t=document.createElement("style"),t.id=i,document.head.appendChild(t)),t.textContent="@page { size: "+this.designWidth+"px "+this.designHeight+"px; margin: 0; } @media print { html, body { margin: 0 !important; padding: 0 !important; background: none !important; overflow: visible !important; height: auto !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }"}_onSlotChange(){this._collectSlides(),this._restoreIndex(),this._applyIndex({showOverlay:!1,broadcast:!0,reason:"init"}),this._fit()}_collectSlides(){const i=this._slot.assignedElements({flatten:!0});this._slides=i.filter(t=>{const e=t.tagName;return e!=="TEMPLATE"&&e!=="SCRIPT"&&e!=="STYLE"}),this._slides.forEach((t,e)=>{const a=e+1;let s=t.getAttribute("data-label");if(!s){const n=t.getAttribute("data-screen-label");n&&(s=n.replace(/^\s*\d+\s*/,"").trim()||n)}if(!s){const n=t.querySelector("h1, h2, h3, [data-title]");n&&(s=(n.textContent||"").trim().slice(0,40))}s||(s="Slide"),t.setAttribute("data-screen-label",`${c(a)} ${s}`),t.hasAttribute("data-om-validate")||t.setAttribute("data-om-validate",h),t.setAttribute("data-deck-slide",String(e))}),this._totalEl&&(this._totalEl.textContent=String(this._slides.length||1)),this._index>=this._slides.length&&(this._index=Math.max(0,this._slides.length-1))}_loadNotes(){const i=document.getElementById("speaker-notes");if(!i){this._notes=[];return}try{const t=JSON.parse(i.textContent||"[]");Array.isArray(t)&&(this._notes=t)}catch(t){console.warn("[deck-stage] Failed to parse #speaker-notes JSON:",t),this._notes=[]}}_restoreIndex(){const i=(location.hash||"").match(/^#(\d+)$/);if(i){const t=parseInt(i[1],10)-1;t>=0&&t<this._slides.length&&(this._index=t)}}_applyIndex({showOverlay:i=!0,broadcast:t=!0,reason:e="init"}={}){if(!this._slides.length)return;const a=this._prevIndex==null?-1:this._prevIndex,s=this._index;try{history.replaceState(null,"","#"+(s+1))}catch{}if(this._slides.forEach((n,r)=>{r===s?n.setAttribute("data-deck-active",""):n.removeAttribute("data-deck-active")}),this._countEl&&(this._countEl.textContent=String(s+1)),t){try{window.postMessage({slideIndexChanged:s},"*")}catch{}const n={index:s,previousIndex:a,total:this._slides.length,slide:this._slides[s]||null,previousSlide:a>=0&&this._slides[a]||null,reason:e};this.dispatchEvent(new CustomEvent("slidechange",{detail:n,bubbles:!0,composed:!0}))}this._prevIndex=s,i&&this._flashOverlay()}_flashOverlay(){this._overlay&&(this._overlay.setAttribute("data-visible",""),this._hideTimer&&clearTimeout(this._hideTimer),this._hideTimer=setTimeout(()=>{this._overlay.removeAttribute("data-visible")},1800))}_fit(){if(!this._canvas)return;if(this.hasAttribute("noscale")){this._canvas.style.transform="none";return}const i=window.innerWidth,t=window.innerHeight,e=Math.min(i/this.designWidth,t/this.designHeight);this._canvas.style.transform=`scale(${e})`}_onResize(){this._fit()}_onMouseMove(){this._flashOverlay()}_onTapBack(i){i.preventDefault(),this._go(this._index-1,"tap")}_onTapForward(i){i.preventDefault(),this._go(this._index+1,"tap")}_onKey(i){const t=i.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))||i.metaKey||i.ctrlKey||i.altKey)return;const e=i.key;let a=!0;if(e==="ArrowRight"||e==="PageDown"||e===" "||e==="Spacebar")this._go(this._index+1,"keyboard");else if(e==="ArrowLeft"||e==="PageUp")this._go(this._index-1,"keyboard");else if(e==="Home")this._go(0,"keyboard");else if(e==="End")this._go(this._slides.length-1,"keyboard");else if(/^[0-9]$/.test(e)){const s=e==="0"?9:parseInt(e,10)-1;s<this._slides.length&&this._go(s,"keyboard")}else a=!1;a&&(i.preventDefault(),this._flashOverlay())}_go(i,t="api"){if(!this._slides.length)return;const e=Math.max(0,Math.min(this._slides.length-1,i));if(e===this._index){this._flashOverlay();return}this._index=e,this._applyIndex({showOverlay:!0,broadcast:!0,reason:t})}get index(){return this._index}get length(){return this._slides.length}goTo(i){this._go(i,"api")}next(){this._go(this._index+1,"api")}prev(){this._go(this._index-1,"api")}reset(){this._go(0,"api")}}customElements.get("deck-stage")||customElements.define("deck-stage",u)})();
