// ============================================================
// Dev Tool — NFC simulation + state/panel switching
// Enable: ?dev=1   Toggle: Ctrl+Shift+D
// ============================================================
import { CALLI_FONTS, FONT_DISPLAY_NAMES } from './config.js';
import { S } from './state.js';

export function initDevTool({ changeState }) {
    let collapsed = false;
    let dragOffset = null;

    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.innerHTML = `
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
                        ${Array.from({length: 18}, (_, i) => {
                            const id = String(i + 1).padStart(2, '0');
                            return `<option value="${id}">${id}${i < 4 ? ' ★' : ''}</option>`;
                        }).join('')}
                    </select>
                    <label><input type="checkbox" id="dev-sealed"> sealed</label>
                </div>
                <div class="dr" style="margin-top:4px">
                    <button id="dev-nfc">Tap NFC</button>
                    <button id="dev-url">URL Visit</button>
                    <button id="dev-reset">Reset</button>
                </div>
                <div id="dev-env-state" style="font-size:10px;opacity:0.5;margin-top:4px;word-break:break-all"></div>
            </fieldset>
        </div>
    `;
    document.body.appendChild(panel);

    const css = document.createElement('style');
    css.textContent = `
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
    `;
    document.head.appendChild(css);

    // --- Drag ---
    const bar = document.getElementById('dev-bar');
    bar.addEventListener('mousedown', e => {
        if (e.target.tagName === 'BUTTON') return;
        const r = panel.getBoundingClientRect();
        dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
        const move = ev => {
            panel.style.left = (ev.clientX - dragOffset.x) + 'px';
            panel.style.top = (ev.clientY - dragOffset.y) + 'px';
            panel.style.right = 'auto';
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', () => {
            dragOffset = null;
            document.removeEventListener('mousemove', move);
        }, { once: true });
    });

    // --- Collapse ---
    document.getElementById('dev-min').addEventListener('click', () => {
        collapsed = !collapsed;
        panel.classList.toggle('collapsed', collapsed);
        document.getElementById('dev-min').textContent = collapsed ? '+' : '−';
    });

    // --- State buttons ---
    const curLabel = document.getElementById('dev-cur');
    panel.querySelectorAll('[data-s]').forEach(btn => {
        btn.addEventListener('click', () => {
            changeState(btn.dataset.s);
            refreshHighlights();
        });
    });

    function refreshHighlights() {
        panel.querySelectorAll('[data-s]').forEach(b =>
            b.classList.toggle('on', b.dataset.s === S.state)
        );
        curLabel.textContent = S.state;
        refreshEnvLabel();
    }

    // --- Panel show/hide ---
    document.getElementById('dev-show-panel').addEventListener('click', () => {
        if (!S.envelopeManager) return;
        S.envelopeManager.show();
    });
    document.getElementById('dev-hide-panel').addEventListener('click', () => {
        if (!S.envelopeManager) return;
        S.envelopeManager.hide();
    });
    document.getElementById('dev-wished').addEventListener('change', (e) => {
        if (!S.envelopeManager) return;
        const em = S.envelopeManager;
        em.state.wished = e.target.checked;
        em.state.sealed = e.target.checked;
        em._updateSections();
        refreshEnvLabel();
    });

    // --- NFC sim ---
    document.getElementById('dev-nfc').addEventListener('click', () => {
        if (!S.envelopeManager) return;
        const em = S.envelopeManager;
        const pid = document.getElementById('dev-piece').value;
        const sealed = document.getElementById('dev-sealed').checked;

        em.state.pieceId = pid;
        em.state.isNfcTap = true;
        em.state.validated = true;
        em.state.pieceType = parseInt(pid) <= 4 ? 'gold' : 'regular';
        em.state.sealed = sealed;
        em.state.btcAddress = 'bc1q' + 'x'.repeat(38);
        em.state.sessionToken = 'dev-session';
        em.state.wished = false;
        em.state.currentWishText = null;

        em._renderPieceBadge();
        em._updateSections();
        em._loadWishHistory();
        em.show();
        refreshEnvLabel();
        console.log(`[Dev] NFC tap: piece=${pid} type=${em.state.pieceType} sealed=${sealed}`);
    });

    document.getElementById('dev-url').addEventListener('click', () => {
        if (!S.envelopeManager) return;
        const em = S.envelopeManager;
        em.state.pieceId = document.getElementById('dev-piece').value;
        em.state.isNfcTap = false;
        em.state.validated = false;
        em.state.sealed = false;
        em.state.sessionToken = null;

        em._renderPieceBadge();
        em._updateSections();
        em._loadWishHistory();
        em.show();
        refreshEnvLabel();
        console.log(`[Dev] URL visit: piece=${em.state.pieceId}`);
    });

    document.getElementById('dev-reset').addEventListener('click', () => {
        if (!S.envelopeManager) return;
        const em = S.envelopeManager;
        em.state.pieceId = null;
        em.state.isNfcTap = false;
        em.state.validated = true;
        em.state.sealed = false;
        em.state.btcAddress = null;
        em.state.sessionToken = null;
        em.state.wished = false;
        em.state.currentWishText = null;

        em._renderPieceBadge();
        em._updateSections();
        em.hide();
        refreshEnvLabel();
        console.log('[Dev] State reset');
    });

    // --- Envelope state label ---
    const envLabel = document.getElementById('dev-env-state');
    function refreshEnvLabel() {
        if (!S.envelopeManager) { envLabel.textContent = 'no envelope'; return; }
        const es = S.envelopeManager.state;
        envLabel.textContent = `p=${es.pieceId||'—'} ${es.pieceType} nfc=${es.isNfcTap} valid=${es.validated} sealed=${es.sealed} wished=${es.wished}`;
    }

    // --- Periodic refresh ---
    setInterval(refreshHighlights, 400);

    // --- Ctrl+Shift+D toggle ---
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            panel.style.display = panel.style.display === 'none' ? '' : 'none';
        }
    });

    console.log('%c[Dev] %cReady — Ctrl+Shift+D to toggle', 'color:#FFD700;font-weight:bold', 'color:#e8e0d0');
}
