// ============================================================
// Envelope Manager — NFC validation, wish seal/unseal, single panel
// ============================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY, FUNCTIONS_URL } from './supabase-config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- URL Params ---
const params = new URLSearchParams(window.location.search);
const PIECE_ID = params.get('p');
const NFC_UID = params.get('uid');
const NFC_CTR = params.get('ctr');
const IS_NFC_TAP = !!(PIECE_ID && NFC_UID && NFC_CTR);

// Clean URL immediately — strip uid and ctr from address bar
if (NFC_UID || NFC_CTR) {
    const cleanURL = PIECE_ID
        ? `${window.location.pathname}?p=${PIECE_ID}`
        : window.location.pathname;
    window.history.replaceState(null, '', cleanURL);
}

// --- Supabase API ---
async function callEdgeFunction(name, body) {
    const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
    });
    return res.json();
}

const API = {
    async validateTap(pieceId, uid, ctr) {
        return callEdgeFunction('validate-tap', { pieceId, uid, ctr });
    },

    async getWishHistory(pieceId) {
        const { data, error } = await supabase
            .from('wishes')
            .select('id, wish_text, sealed, display_type, created_at')
            .eq('piece_id', pieceId)
            .order('created_at', { ascending: false });
        if (error) { console.error('[API] getWishHistory error:', error); return []; }
        return data;
    },

    async getAllWishHistory() {
        const { data, error } = await supabase
            .from('wishes')
            .select('id, piece_id, wish_text, sealed, display_type, created_at')
            .order('created_at', { ascending: false });
        if (error) { console.error('[API] getAllWishHistory error:', error); return []; }
        return data;
    },

    async sealWish(pieceId, wishText, sessionToken) {
        return callEdgeFunction('seal-wish', { pieceId, wishText, sessionToken });
    },

    async unseal(pieceId, wishText, sessionToken) {
        return callEdgeFunction('unseal', { pieceId, wishText, sessionToken });
    },

    async claimGoldenFinger(pieceId, sessionToken) {
        return callEdgeFunction('claim-golden-finger', { pieceId, sessionToken });
    },
};

// ============================================================
// EnvelopeManager
// ============================================================

export class EnvelopeManager {
    constructor({ onOpen, onWish }) {
        this.onOpen = onOpen;
        this.onWish = onWish;

        this.state = {
            pieceId: PIECE_ID,
            isNfcTap: IS_NFC_TAP,
            validated: false,
            pieceType: 'regular',
            sealed: false,
            btcAddress: null,
            sessionToken: null,
            wished: false,
            currentWishText: null,
        };

        this.panel = document.getElementById('envelope-panel');

        this._bindEvents();
        this._init();
    }

    // --- Initialization ---

    async _init() {
        if (IS_NFC_TAP) {
            try {
                const result = await API.validateTap(PIECE_ID, NFC_UID, NFC_CTR);
                if (result.valid) {
                    this.state.validated = true;
                    this.state.pieceType = result.piece_type;
                    this.state.sealed = result.sealed;
                    this.state.btcAddress = result.btc_address;
                    this.state.sessionToken = result.session_token;
                }
            } catch (err) {
                console.error('[Envelope] Validation failed:', err);
            }
        }
        // URL-only visitors: validated stays false → read-only view

        await this._loadWishHistory();
        this._renderPieceBadge();
        this._updateSections();
    }

    // --- Event Binding ---

    _bindEvents() {
        // Seal Wish button
        const btnSubmit = document.getElementById('btn-submit-wish');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => this._handleSealWish());
        }

        // Click outside panel to dismiss
        const overlay = document.getElementById('envelope-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.hide();
            });
        }

        // Unseal button — toggles inline unseal form
        const btnUnseal = document.getElementById('btn-unseal');
        if (btnUnseal) {
            btnUnseal.addEventListener('click', () => {
                const area = document.getElementById('unseal-area');
                if (area) {
                    const showing = area.style.display !== 'none';
                    area.style.display = showing ? 'none' : '';
                    btnUnseal.style.display = showing ? '' : 'none';
                }
            });
        }

        // Confirm Unseal button
        const btnConfirmUnseal = document.getElementById('btn-confirm-unseal');
        if (btnConfirmUnseal) {
            btnConfirmUnseal.addEventListener('click', () => this._handleUnseal());
        }

        // 金手指 button
        const btnGolden = document.getElementById('btn-golden-finger');
        if (btnGolden) {
            btnGolden.addEventListener('click', () => this._handleGoldenFinger());
        }

        // BTC address copy
        const btcAddr = document.getElementById('btc-address');
        if (btcAddr) {
            btcAddr.addEventListener('click', () => {
                navigator.clipboard.writeText(btcAddr.textContent).then(() => {
                    btcAddr.textContent = 'Copied!';
                    setTimeout(() => {
                        btcAddr.textContent = this.state.btcAddress || '';
                    }, 1500);
                });
            });
        }

        // Enter key for unseal input
        const unsealInput = document.getElementById('unseal-input');
        if (unsealInput) {
            unsealInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._handleUnseal();
            });
        }
    }

    // --- Panel Show / Hide ---

    show() {
        const overlay = document.getElementById('envelope-overlay');
        if (this.panel) {
            this.panel.classList.remove('dismissing');
            this.panel.classList.add('active');
            if (overlay) overlay.style.pointerEvents = 'auto';
        }
        this._updateSections();
    }

    hide() {
        const overlay = document.getElementById('envelope-overlay');
        if (overlay) overlay.style.pointerEvents = 'none';
        if (this.panel && this.panel.classList.contains('active')) {
            this.panel.classList.remove('active');
            this.panel.classList.add('dismissing');
            this.panel.addEventListener('animationend', () => {
                this.panel.classList.remove('dismissing');
            }, { once: true });
        }
    }

    // Keep backward-compat for any callers
    showPanel() { this.show(); }
    hideAll() { this.hide(); }

    // --- Section Visibility ---

    _updateSections() {
        const sectionWish = document.getElementById('section-wish');
        const sectionSealed = document.getElementById('section-sealed');

        if (!this.state.validated) {
            // URL visitor — read-only, just history
            if (sectionWish) sectionWish.style.display = 'none';
            if (sectionSealed) sectionSealed.style.display = 'none';
        } else if (this.state.sealed || this.state.wished) {
            if (sectionWish) sectionWish.style.display = 'none';
            if (sectionSealed) sectionSealed.style.display = '';
        } else {
            if (sectionWish) sectionWish.style.display = '';
            if (sectionSealed) sectionSealed.style.display = 'none';
        }

        // Reset unseal area
        const unsealArea = document.getElementById('unseal-area');
        const btnUnseal = document.getElementById('btn-unseal');
        if (unsealArea) unsealArea.style.display = 'none';
        if (btnUnseal) btnUnseal.style.display = '';

        // BTC address
        const btcAddr = document.getElementById('btc-address');
        if (btcAddr) btcAddr.textContent = this.state.btcAddress || '';

        // 金手指 for gold pieces
        const btnGolden = document.getElementById('btn-golden-finger');
        if (btnGolden) {
            btnGolden.style.display = (this.state.pieceType === 'gold' && this.state.wished) ? '' : 'none';
        }
    }

    // --- Wish History ---

    async _loadWishHistory() {
        let wishes;
        if (PIECE_ID) {
            wishes = await API.getWishHistory(PIECE_ID);
        } else {
            wishes = await API.getAllWishHistory();
        }
        this._renderWishTimeline(wishes);
    }

    _renderWishTimeline(wishes) {
        const container = document.getElementById('wish-timeline-list');
        if (!container) return;
        container.innerHTML = '';

        if (!wishes || wishes.length === 0) {
            container.innerHTML = '<div style="font-size:0.8rem;color:#666;padding:0.5rem 0;">No wishes yet. Be the first.</div>';
            return;
        }

        const sorted = [...wishes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        for (const wish of sorted) {
            const entry = document.createElement('div');
            entry.className = 'wish-entry';

            if (wish.sealed) {
                entry.classList.add('sealed');
                if (wish.display_type === 'gold') entry.classList.add('gold');

                const icon = wish.display_type === 'gold' ? '★' : '✦';
                const label = wish.display_type === 'gold'
                    ? 'A golden wish has been sealed'
                    : 'A sacred wish has been sealed';

                entry.innerHTML = `
                    <div class="wish-text">
                        <span class="wish-icon">${icon}</span>${label}
                    </div>
                    <div class="wish-date">${this._formatDate(wish.created_at)}</div>
                `;
            } else {
                entry.innerHTML = `
                    <div class="wish-text">"${wish.wish_text}"</div>
                    <div class="wish-date">${this._formatDate(wish.created_at)}</div>
                `;
            }

            container.appendChild(entry);
        }
    }

    _formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // --- Piece Badge ---

    _renderPieceBadge() {
        const slot = document.getElementById('piece-badge-slot');
        if (!slot) return;

        if (PIECE_ID) {
            const type = this.state.pieceType;
            slot.innerHTML = `<span class="piece-badge ${type}">Piece #${PIECE_ID} · ${type === 'gold' ? 'GOLD' : 'REGULAR'}</span>`;
        }
    }

    // --- Seal Wish ---

    async _handleSealWish() {
        const textarea = document.getElementById('wish-input');
        const wishText = textarea ? textarea.value.trim() : '';
        if (!wishText) return;

        const btn = document.getElementById('btn-submit-wish');
        if (btn) btn.disabled = true;

        try {
            const result = await API.sealWish(this.state.pieceId, wishText, this.state.sessionToken);
            if (result.success) {
                this.state.sealed = true;
                this.state.wished = true;
                this.state.currentWishText = wishText;

                if (textarea) textarea.value = '';

                // Trigger fireworks
                if (this.onWish) this.onWish();

                // Update sections to show sealed info
                this._updateSections();

                // Reload history
                await this._loadWishHistory();
            }
        } catch (err) {
            console.error('[Envelope] Seal failed:', err);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // --- Unseal ---

    async _handleUnseal() {
        const input = document.getElementById('unseal-input');
        const errorEl = document.getElementById('unseal-error');
        const enteredText = input ? input.value.trim() : '';

        if (!enteredText) {
            if (errorEl) errorEl.textContent = 'Please enter your wish.';
            return;
        }

        const btn = document.getElementById('btn-confirm-unseal');
        if (btn) btn.disabled = true;
        if (errorEl) errorEl.textContent = '';

        try {
            const result = await API.unseal(this.state.pieceId, enteredText, this.state.sessionToken);
            if (result.success) {
                this.state.sealed = false;
                this.state.wished = false;
                this.state.currentWishText = null;

                if (input) input.value = '';

                await this._loadWishHistory();
                this._updateSections();
            } else {
                if (errorEl) errorEl.textContent = 'Wish does not match. Try again.';
            }
        } catch (err) {
            console.error('[Envelope] Unseal failed:', err);
            if (errorEl) errorEl.textContent = 'Something went wrong. Try again.';
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // --- Golden Finger ---

    async _handleGoldenFinger() {
        const btn = document.getElementById('btn-golden-finger');
        if (btn) btn.disabled = true;

        try {
            const result = await API.claimGoldenFinger(this.state.pieceId, this.state.sessionToken);
            if (result.token && result.redirect_url) {
                window.location.href = `${result.redirect_url}?golden_token=${result.token}`;
            }
        } catch (err) {
            console.error('[Envelope] Golden finger claim failed:', err);
        } finally {
            if (btn) btn.disabled = false;
        }
    }
}
