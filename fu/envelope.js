// ============================================================
// Envelope Manager — NFC validation, wish seal/unseal, panels
// ============================================================

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

// --- Supabase stub (replace with real calls when Edge Functions are ready) ---
const API = {
    async validateTap(pieceId, uid, ctr) {
        // TODO: POST to Supabase Edge Function validate-tap
        // Returns: { valid, piece_type, sealed, btc_address, session_token }
        console.log('[API] validateTap', { pieceId, uid, ctr });
        return {
            valid: true,
            piece_type: pieceId <= '04' ? 'gold' : 'regular',
            sealed: false,
            btc_address: 'bc1q' + 'x'.repeat(38),
            session_token: 'mock-session-token',
        };
    },

    async getWishHistory(pieceId) {
        // TODO: Supabase query — select from wishes where piece_id = pieceId
        console.log('[API] getWishHistory', pieceId);
        return [
            { id: '1', wish_text: 'Health and happiness for my family', sealed: false, display_type: 'regular', created_at: '2026-01-15T10:00:00Z' },
            { id: '2', wish_text: 'World peace and kindness', sealed: false, display_type: 'regular', created_at: '2026-01-28T14:30:00Z' },
            { id: '3', wish_text: null, sealed: true, display_type: 'regular', created_at: '2026-02-10T09:15:00Z' },
        ];
    },

    async getAllWishHistory() {
        // TODO: Supabase query — select from wishes (all pieces)
        console.log('[API] getAllWishHistory');
        return [
            { id: '1', piece_id: '01', wish_text: 'Health and happiness', sealed: false, display_type: 'gold', created_at: '2026-01-15T10:00:00Z' },
            { id: '2', piece_id: '05', wish_text: 'Success in my studies', sealed: false, display_type: 'regular', created_at: '2026-01-20T08:00:00Z' },
            { id: '3', piece_id: '03', wish_text: null, sealed: true, display_type: 'gold', created_at: '2026-02-10T09:15:00Z' },
        ];
    },

    async sealWish(pieceId, wishText, sessionToken) {
        // TODO: POST to Supabase Edge Function seal-wish
        console.log('[API] sealWish', { pieceId, wishText: '***' });
        return { success: true };
    },

    async unseal(pieceId, wishText, sessionToken) {
        // TODO: POST to Supabase Edge Function unseal
        console.log('[API] unseal', { pieceId, wishText: '***' });
        // Stub: accept any input for now
        return { success: true };
    },

    async claimGoldenFinger(pieceId, sessionToken) {
        // TODO: POST to Supabase Edge Function claim-golden-finger
        console.log('[API] claimGoldenFinger', { pieceId });
        return { token: 'mock-golden-token', redirect_url: 'https://fu-mocha.vercel.app' };
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
            pieceType: 'regular',  // 'regular' | 'gold'
            sealed: false,
            btcAddress: null,
            sessionToken: null,
            wished: false,
            currentWishText: null,
        };

        this.panels = {
            timeline: document.getElementById('panel-timeline'),
            wish: document.getElementById('panel-wish'),
            sealed: document.getElementById('panel-sealed'),
            unseal: document.getElementById('panel-unseal'),
        };

        this._bindEvents();
        this._init();
    }

    // --- Initialization ---

    async _init() {
        // If NFC tap, validate first
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

        // Load wish history
        await this._loadWishHistory();

        // Set up piece badge
        this._renderPieceBadge();

        // Show appropriate controls
        this._updateTimelineControls();
    }

    // --- Event Binding ---

    _bindEvents() {
        // Make a Wish button (on timeline panel)
        const btnMakeWish = document.getElementById('btn-make-wish');
        if (btnMakeWish) {
            btnMakeWish.addEventListener('click', () => {
                this.showPanel('wish');
                if (this.onOpen) this.onOpen();
            });
        }

        // Seal Wish button
        const btnSubmit = document.getElementById('btn-submit-wish');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', () => this._handleSealWish());
        }

        // Click outside any panel to dismiss
        const overlay = document.getElementById('envelope-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.hideAll();
            });
        }

        // Unseal button (on sealed panel)
        const btnUnseal = document.getElementById('btn-unseal');
        if (btnUnseal) {
            btnUnseal.addEventListener('click', () => this.showPanel('unseal'));
        }

        // Confirm Unseal button
        const btnConfirmUnseal = document.getElementById('btn-confirm-unseal');
        if (btnConfirmUnseal) {
            btnConfirmUnseal.addEventListener('click', () => this._handleUnseal());
        }

        // Back button (unseal → sealed)
        const btnBack = document.getElementById('btn-back-sealed');
        if (btnBack) {
            btnBack.addEventListener('click', () => this.showPanel('sealed'));
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

    // --- Panel Management ---

    showPanel(name) {
        const overlay = document.getElementById('envelope-overlay');
        // Clear any dismissing panels instantly
        Object.values(this.panels).forEach(p => {
            p.classList.remove('active', 'dismissing');
        });
        if (this.panels[name]) {
            this.panels[name].classList.add('active');
            if (overlay) overlay.style.pointerEvents = 'auto';
        }
    }

    hideAll() {
        const overlay = document.getElementById('envelope-overlay');
        if (overlay) overlay.style.pointerEvents = 'none';
        Object.values(this.panels).forEach(p => {
            if (p.classList.contains('active')) {
                p.classList.remove('active');
                p.classList.add('dismissing');
                p.addEventListener('animationend', () => {
                    p.classList.remove('dismissing');
                }, { once: true });
            }
        });
    }

    showWishInput() {
        if (!this.state.sealed) {
            this.showPanel('wish');
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

        // Show newest first
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

    // --- Timeline Controls ---

    _updateTimelineControls() {
        const btnMakeWish = document.getElementById('btn-make-wish');
        const readOnlyNotice = document.getElementById('read-only-notice');

        if (this.state.validated && !this.state.sealed) {
            // NFC tapper, piece is unsealed → show "Make a Wish" button
            if (btnMakeWish) btnMakeWish.style.display = 'block';
            if (readOnlyNotice) readOnlyNotice.style.display = 'none';
        } else if (this.state.validated && this.state.sealed) {
            // NFC tapper, piece is sealed → read-only
            if (btnMakeWish) btnMakeWish.style.display = 'none';
            if (readOnlyNotice) {
                readOnlyNotice.style.display = 'block';
                readOnlyNotice.textContent = 'This piece is sealed. Only the wish-writer can unseal it.';
            }
        } else {
            // URL visitor (no NFC) → read-only
            if (btnMakeWish) btnMakeWish.style.display = 'none';
            if (readOnlyNotice) {
                readOnlyNotice.style.display = 'block';
                readOnlyNotice.textContent = 'Scan the physical piece to interact.';
            }
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

                // Update BTC display
                const btcAddr = document.getElementById('btc-address');
                if (btcAddr) btcAddr.textContent = this.state.btcAddress || '';

                // Show 金手指 for gold pieces
                const btnGolden = document.getElementById('btn-golden-finger');
                if (btnGolden && this.state.pieceType === 'gold') {
                    btnGolden.style.display = 'block';
                }

                // Clear textarea
                if (textarea) textarea.value = '';

                // Trigger fireworks
                if (this.onWish) this.onWish();

                // Show sealed panel
                this.showPanel('sealed');
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
                this.state.currentWishText = null;

                // Clear input
                if (input) input.value = '';

                // Reload wish history (the unsealed wish now shows text)
                await this._loadWishHistory();
                this._updateTimelineControls();

                // Go back to timeline
                this.showPanel('timeline');
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
