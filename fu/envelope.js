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
const IS_NFC_TAP = !!(PIECE_ID && NFC_UID);

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

    async verifyChallenge(pieceId, wishText, sessionToken) {
        return callEdgeFunction('verify-challenge', { pieceId, wishText, sessionToken });
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
            challengePassed: false,
        };

        this._devMode = false;
        this._mockWishes = [];

        this.panel = document.getElementById('envelope-panel');

        this._bindEvents();
        this._init();
    }

    // --- Dev Mode (offline mock) ---

    enableDevMode() {
        this._devMode = true;
        // Seed with sample wishes for all 3 types
        this._mockWishes = [
            { id: 'd1', piece_id: '03', wish_text: 'World peace and kindness for all', sealed: false, display_type: 'regular', created_at: '2026-01-28T10:00:00Z' },
            { id: 'd2', piece_id: '01', wish_text: null, sealed: true, display_type: 'gold', created_at: '2026-02-10T12:00:00Z' },
            { id: 'd3', piece_id: '07', wish_text: 'Success in all my studies this year', sealed: false, display_type: 'regular', created_at: '2026-01-20T08:00:00Z' },
            { id: 'd4', piece_id: '12', wish_text: null, sealed: true, display_type: 'regular', created_at: '2026-02-05T15:00:00Z' },
            { id: 'd5', piece_id: '05', wish_text: 'Health and happiness for my family', sealed: false, display_type: 'regular', created_at: '2026-01-15T09:00:00Z' },
        ];
        console.log('[Envelope] Dev mode enabled — API calls mocked');
    }

    // --- Initialization ---

    async _init() {
        // DEBUG — remove after testing
        alert(`NFC_TAP=${IS_NFC_TAP} p=${PIECE_ID} uid=${NFC_UID}`);

        if (IS_NFC_TAP) {
            try {
                const result = await API.validateTap(PIECE_ID, NFC_UID, NFC_CTR);
                // DEBUG — remove after testing
                alert(JSON.stringify(result));
                if (result.valid) {
                    this.state.validated = true;
                    this.state.pieceType = result.piece_type;
                    this.state.sealed = result.sealed;
                    this.state.btcAddress = result.btc_address;
                    this.state.sessionToken = result.session_token;
                }
            } catch (err) {
                alert(`CATCH: ${err.message}`);
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

        // BTC button — tap to reveal address, tap address to copy
        const btcButton = document.getElementById('btc-button');
        if (btcButton) {
            btcButton.addEventListener('click', (e) => {
                if (!btcButton.classList.contains('revealed')) {
                    btcButton.classList.add('revealed');
                    return;
                }
                // If already revealed and clicking the address area, copy
                const btcAddr = document.getElementById('btc-address');
                if (btcAddr && btcAddr.textContent) {
                    navigator.clipboard.writeText(btcAddr.textContent).then(() => {
                        const original = btcAddr.textContent;
                        btcAddr.textContent = 'Copied!';
                        setTimeout(() => { btcAddr.textContent = original; }, 1500);
                    });
                }
            });
        }

        // Enter key for unseal input
        const unsealInput = document.getElementById('unseal-input');
        if (unsealInput) {
            unsealInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._handleUnseal();
            });
        }

        // Challenge submit button
        const btnChallenge = document.getElementById('btn-challenge-submit');
        if (btnChallenge) {
            btnChallenge.addEventListener('click', () => this._handleChallenge());
        }

        // Enter key for challenge input
        const challengeInput = document.getElementById('challenge-input');
        if (challengeInput) {
            challengeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this._handleChallenge();
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
        const sectionChallenge = document.getElementById('section-challenge');

        // Hide all by default
        if (sectionWish) sectionWish.style.display = 'none';
        if (sectionSealed) sectionSealed.style.display = 'none';
        if (sectionChallenge) sectionChallenge.style.display = 'none';

        if (!this.state.validated) {
            // URL visitor — read-only, just history
        } else if (this.state.sealed && !this.state.wished && !this.state.challengePassed) {
            // Sealed by someone else — challenge gate
            if (sectionChallenge) sectionChallenge.style.display = '';
        } else if (this.state.wished || this.state.challengePassed) {
            // Own seal OR passed challenge — show rewards
            if (sectionSealed) sectionSealed.style.display = '';
            // After challenge pass, also show wish textarea for next wish
            if (this.state.challengePassed && !this.state.sealed) {
                if (sectionWish) sectionWish.style.display = '';
            }
        } else {
            // Fresh piece — write wish
            if (sectionWish) sectionWish.style.display = '';
        }

        // Reset challenge input
        const challengeError = document.getElementById('challenge-error');
        if (challengeError) challengeError.textContent = '';

        // Reset unseal area
        const unsealArea = document.getElementById('unseal-area');
        const btnUnseal = document.getElementById('btn-unseal');
        if (unsealArea) unsealArea.style.display = 'none';
        // Unseal button only when piece is sealed (own seal, can undo)
        if (btnUnseal) btnUnseal.style.display = this.state.sealed ? '' : 'none';

        // BTC address + reset revealed state
        const btcAddr = document.getElementById('btc-address');
        if (btcAddr) btcAddr.textContent = this.state.btcAddress || '';
        const btcButton = document.getElementById('btc-button');
        if (btcButton) btcButton.classList.remove('revealed');

        // 金手指 for gold pieces
        const btnGolden = document.getElementById('btn-golden-finger');
        if (btnGolden) {
            btnGolden.style.display = this.state.pieceType === 'gold' ? '' : 'none';
        }

        // Reset seal error
        const sealError = document.getElementById('seal-error');
        if (sealError) sealError.textContent = '';
    }

    // --- Wish History ---

    async _loadWishHistory() {
        if (this._devMode) {
            this._renderWishTimeline(this._mockWishes);
            return;
        }
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

            const textDiv = document.createElement('div');
            textDiv.className = 'wish-text';
            const dateDiv = document.createElement('div');
            dateDiv.className = 'wish-date';
            const pieceLabel = wish.piece_id ? `Piece #${wish.piece_id}  ·  ` : '';
            dateDiv.textContent = pieceLabel + this._formatDate(wish.created_at);

            const isGold = wish.display_type === 'gold';
            if (isGold) entry.classList.add('gold');

            if (wish.sealed) {
                entry.classList.add('sealed');
                if (!isGold) entry.classList.add('regular');
                textDiv.textContent = isGold
                    ? 'A golden wish has been sealed'
                    : 'A wish has been sealed';
            } else {
                textDiv.textContent = `"${wish.wish_text || ''}"`;
            }

            entry.appendChild(textDiv);
            entry.appendChild(dateDiv);

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
            const span = document.createElement('span');
            span.className = `piece-badge ${type}`;
            span.textContent = `Piece #${PIECE_ID} · ${type === 'gold' ? 'GOLD' : 'REGULAR'}`;
            slot.replaceChildren(span);
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
            if (this._devMode) {
                // Mock: add wish to local list
                this._mockWishes.unshift({
                    id: 'dev-' + Date.now(),
                    wish_text: null,
                    sealed: true,
                    display_type: this.state.pieceType === 'gold' ? 'gold' : 'regular',
                    created_at: new Date().toISOString(),
                });
                this.state.sealed = true;
                this.state.wished = true;
                this.state.challengePassed = false;
                this.state.currentWishText = wishText;
                if (textarea) textarea.value = '';
                if (this.onWish) this.onWish();
                this._updateSections();
                this._renderWishTimeline(this._mockWishes);
                return;
            }

            const result = await API.sealWish(this.state.pieceId, wishText, this.state.sessionToken);
            if (result.success) {
                this.state.sealed = true;
                this.state.wished = true;
                this.state.challengePassed = false;
                this.state.currentWishText = wishText;

                if (textarea) textarea.value = '';

                // Trigger fireworks
                if (this.onWish) this.onWish();

                // Update sections to show sealed info
                this._updateSections();

                // Reload history
                await this._loadWishHistory();
            } else {
                const sealError = document.getElementById('seal-error');
                if (sealError) {
                    sealError.textContent = result.error === 'Already sealed'
                        ? 'Someone just sealed this piece! Tap the NFC again to try the challenge.'
                        : (result.error || 'Something went wrong. Try again.');
                }
            }
        } catch (err) {
            console.error('[Envelope] Seal failed:', err);
            const sealError = document.getElementById('seal-error');
            if (sealError) sealError.textContent = 'Something went wrong. Try again.';
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
            if (this._devMode) {
                // Mock: unseal most recent sealed wish, reveal text
                const sealed = this._mockWishes.find(w => w.sealed);
                if (sealed) {
                    sealed.sealed = false;
                    sealed.wish_text = enteredText;
                }
                this.state.sealed = false;
                this.state.wished = false;
                this.state.challengePassed = false;
                this.state.currentWishText = null;
                if (input) input.value = '';
                this._renderWishTimeline(this._mockWishes);
                this._updateSections();
                return;
            }

            const result = await API.unseal(this.state.pieceId, enteredText, this.state.sessionToken);
            if (result.success) {
                this.state.sealed = false;
                this.state.wished = false;
                this.state.challengePassed = false;
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

    // --- Challenge Gate (sealed by someone else) ---

    async _handleChallenge() {
        const input = document.getElementById('challenge-input');
        const errorEl = document.getElementById('challenge-error');
        const enteredText = (input?.value || '').trim();

        if (!enteredText) {
            if (errorEl) errorEl.textContent = 'Please enter the wish.';
            return;
        }

        const btn = document.getElementById('btn-challenge-submit');
        if (btn) btn.disabled = true;
        if (errorEl) errorEl.textContent = '';

        try {
            if (this._devMode) {
                // Verify only — piece stays sealed, show 启 panel
                this.state.challengePassed = true;
                if (input) input.value = '';
                this._updateSections();
                return;
            }

            const result = await API.verifyChallenge(this.state.pieceId, enteredText, this.state.sessionToken);
            if (result.success) {
                // Verify only — piece stays sealed, show 启 panel
                this.state.challengePassed = true;
                if (input) input.value = '';
                this._updateSections();
            } else {
                if (errorEl) errorEl.textContent = 'Wish does not match. Try again.';
            }
        } catch (err) {
            console.error('[Envelope] Challenge failed:', err);
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
