import{S as t}from"./fu-K2kOkDcL.js";import"./modulepreload-polyfill-B5Qt9EMX.js";import"./three.module-CAwrvc93.js";import"https://esm.sh/@supabase/supabase-js@2";function h({changeState:v}){let l=!1,s=null;const d=document.createElement("div");d.id="dev-panel",d.innerHTML=`
        <div id="dev-bar">
            <span>DEV</span>
            <span id="dev-cur" style="margin-left:auto;font-size:11px;opacity:0.6">arrival</span>
            <button id="dev-min" title="Collapse">−</button>
        </div>
        <div id="dev-body">

            <fieldset>
                <legend>State</legend>
                <div class="dr">
                    <button data-s="arrival">arrival</button>
                    <button data-s="draw">draw</button>
                    <button data-s="fortune">fortune</button>
                </div>
            </fieldset>

            <fieldset>
                <legend>Panel</legend>
                <div class="dr">
                    <button id="dev-show-panel">show</button>
                    <button id="dev-hide-panel">hide</button>
                    <label><input type="checkbox" id="dev-wished"> wished</label>
                </div>
            </fieldset>

            <fieldset>
                <legend>NFC Sim</legend>
                <div class="dr">
                    <select id="dev-piece">
                        ${Array.from({length:18},(e,n)=>{const a=String(n+1).padStart(2,"0");return`<option value="${a}">${a}${n<4?" ★":""}</option>`}).join("")}
                    </select>
                    <label><input type="checkbox" id="dev-sealed"> sealed</label>
                    <label><input type="checkbox" id="dev-foreign"> foreign</label>
                </div>
                <div class="dr" style="margin-top:4px">
                    <button id="dev-nfc">Tap NFC</button>
                    <button id="dev-url">URL Visit</button>
                    <button id="dev-reset">Reset</button>
                </div>
                <div id="dev-env-state" style="font-size:10px;opacity:0.5;margin-top:4px;word-break:break-all"></div>
            </fieldset>
        </div>
    `,document.body.appendChild(d);const i=document.createElement("style");i.textContent=`
        #dev-panel {
            position:fixed; top:8px; right:8px; z-index:9999;
            width:280px; background:rgba(10,2,2,0.93);
            border:1px solid rgba(255,215,0,0.25); border-radius:8px;
            backdrop-filter:blur(10px); color:#e8e0d0;
            font:12px 'Courier New',monospace;
            box-shadow:0 4px 20px rgba(0,0,0,0.5); user-select:none;
        }
        #dev-panel.collapsed #dev-body{display:none}
        #dev-panel.collapsed{width:auto}
        #dev-bar {
            display:flex; align-items:center; gap:6px;
            padding:6px 10px; cursor:grab;
            border-bottom:1px solid rgba(255,215,0,0.12);
            font-weight:bold; color:#FFD700; font-size:13px;
        }
        #dev-bar:active{cursor:grabbing}
        #dev-body{padding:4px 8px 8px}
        #dev-panel fieldset {
            border:1px solid rgba(255,215,0,0.1); border-radius:5px;
            padding:5px 7px 7px; margin:5px 0 0;
        }
        #dev-panel legend {
            font-size:10px; color:#FFD700; letter-spacing:0.08em;
            text-transform:uppercase; padding:0 3px;
        }
        .dr{display:flex;align-items:center;flex-wrap:wrap;gap:3px}
        #dev-panel button {
            padding:3px 7px; background:rgba(255,215,0,0.06);
            border:1px solid rgba(255,215,0,0.2); border-radius:3px;
            color:#FFD700; font:11px 'Courier New',monospace;
            cursor:pointer; transition:background 0.12s;
        }
        #dev-panel button:hover{background:rgba(255,215,0,0.15)}
        #dev-panel button:active{transform:scale(0.96)}
        #dev-panel button.on{background:rgba(255,215,0,0.28);border-color:#FFD700}
        #dev-min{margin-left:6px;background:none!important;border:none!important;font-size:14px}
        #dev-panel select {
            padding:3px; background:rgba(0,0,0,0.4);
            border:1px solid rgba(255,215,0,0.18); border-radius:3px;
            color:#e8e0d0; font:11px 'Courier New',monospace;
        }
        #dev-panel input[type=checkbox]{accent-color:#FFD700}
        #dev-panel label{font-size:11px;display:flex;align-items:center;gap:3px}
    `,document.head.appendChild(i),document.getElementById("dev-bar").addEventListener("mousedown",e=>{if(e.target.tagName==="BUTTON")return;const n=d.getBoundingClientRect();s={x:e.clientX-n.left,y:e.clientY-n.top};const a=r=>{d.style.left=r.clientX-s.x+"px",d.style.top=r.clientY-s.y+"px",d.style.right="auto"};document.addEventListener("mousemove",a),document.addEventListener("mouseup",()=>{s=null,document.removeEventListener("mousemove",a)},{once:!0})}),document.getElementById("dev-min").addEventListener("click",()=>{l=!l,d.classList.toggle("collapsed",l),document.getElementById("dev-min").textContent=l?"+":"−"});const u=document.getElementById("dev-cur");d.querySelectorAll("[data-s]").forEach(e=>{e.addEventListener("click",()=>{v(e.dataset.s),c()})});function c(){d.querySelectorAll("[data-s]").forEach(e=>e.classList.toggle("on",e.dataset.s===t.state)),u.textContent=t.state,o()}t.envelopeManager&&(t.envelopeManager.enableDevMode(),t.envelopeManager._loadWishHistory()),document.getElementById("dev-show-panel").addEventListener("click",()=>{t.envelopeManager&&t.envelopeManager.show()}),document.getElementById("dev-hide-panel").addEventListener("click",()=>{t.envelopeManager&&t.envelopeManager.hide()}),document.getElementById("dev-wished").addEventListener("change",e=>{if(!t.envelopeManager)return;const n=t.envelopeManager;n.state.wished=e.target.checked,n.state.sealed=e.target.checked,n.state.challengePassed=!1,n._updateSections(),o()}),document.getElementById("dev-nfc").addEventListener("click",()=>{if(!t.envelopeManager)return;const e=t.envelopeManager,n=document.getElementById("dev-piece").value,a=document.getElementById("dev-sealed").checked,r=document.getElementById("dev-foreign").checked;e.state.pieceId=n,e.state.isNfcTap=!0,e.state.validated=!0,e.state.pieceType=parseInt(n)<=4?"gold":"regular",e.state.sealed=a,e.state.btcAddress="bc1q"+"x".repeat(38),e.state.sessionToken="dev-session",e.state.wished=a&&!r,e.state.challengePassed=!1,e.state.currentWishText=null,e._renderPieceBadge(),e._updateSections(),e._loadWishHistory(),e.show(),o(),console.log(`[Dev] NFC tap: piece=${n} type=${e.state.pieceType} sealed=${a}`)}),document.getElementById("dev-url").addEventListener("click",()=>{if(!t.envelopeManager)return;const e=t.envelopeManager;e.state.pieceId=document.getElementById("dev-piece").value,e.state.isNfcTap=!1,e.state.validated=!1,e.state.sealed=!1,e.state.sessionToken=null,e._renderPieceBadge(),e._updateSections(),e._loadWishHistory(),e.show(),o(),console.log(`[Dev] URL visit: piece=${e.state.pieceId}`)}),document.getElementById("dev-reset").addEventListener("click",()=>{if(!t.envelopeManager)return;const e=t.envelopeManager;e.state.pieceId=null,e.state.isNfcTap=!1,e.state.validated=!0,e.state.sealed=!1,e.state.btcAddress=null,e.state.sessionToken=null,e.state.wished=!1,e.state.challengePassed=!1,e.state.currentWishText=null,e._renderPieceBadge(),e._updateSections(),e.hide(),o(),console.log("[Dev] State reset")});const p=document.getElementById("dev-env-state");function o(){if(!t.envelopeManager){p.textContent="no envelope";return}const e=t.envelopeManager.state;p.textContent=`p=${e.pieceId||"—"} ${e.pieceType} nfc=${e.isNfcTap} valid=${e.validated} sealed=${e.sealed} wished=${e.wished} chal=${e.challengePassed}`}setInterval(c,400),document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.key==="D"&&(e.preventDefault(),d.style.display=d.style.display==="none"?"":"none")}),console.log("%c[Dev] %cReady — Ctrl+Shift+D to toggle","color:#FFD700;font-weight:bold","color:#e8e0d0")}export{h as initDevTool};
