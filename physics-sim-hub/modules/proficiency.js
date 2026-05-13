/**
 * Proficiency tracker
 * -------------------
 * Records per-skill outcomes from the walkthrough so future problems can skip
 * tasks the student has already demonstrated mastery of.
 *
 * Skill identity is the *task signature* (kind:target) returned by
 * `getTaskSignature` in workAnalysis.js — NOT the step id. That means
 * "compute v0x" is one skill regardless of which problem type it appears in.
 * If a student computes v0x five times in a row across type1, type2, and
 * type5, they're proficient at v0x.
 *
 * The store is intentionally tiny: per-skill {attempts, successes, streak,
 * unaided, lastSeen}. Anything richer (per-difficulty buckets, spaced-rep
 * scheduling, decay) layers on top of this.
 */

const DEFAULT_CONFIG = {
    // Number of consecutive unaided successes required to mark a skill mastered.
    masteryStreak: 3,
    // If a student reaches mastery, then later misses this many times in a row,
    // mastery is revoked. 0 disables decay-on-failure.
    decayMissStreak: 2,
    // Storage key used by the default localStorage backend.
    storageKey: 'kinematics2d.proficiency.v1'
};

// -----------------------------------------------------------------------------
// Storage backends
// -----------------------------------------------------------------------------

function createMemoryStorage() {
    let blob = '';
    return {
        read() { return blob; },
        write(value) { blob = value; }
    };
}

function createLocalStorage(key) {
    try {
        if (typeof localStorage === 'undefined') return null;
        // Smoke test — Safari private mode throws on setItem.
        const probe = `${key}.__probe__`;
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
    } catch {
        return null;
    }
    return {
        read() {
            try { return localStorage.getItem(key) || ''; } catch { return ''; }
        },
        write(value) {
            try { localStorage.setItem(key, value); } catch { /* quota / private */ }
        }
    };
}

// -----------------------------------------------------------------------------
// Tracker
// -----------------------------------------------------------------------------

export class ProficiencyTracker {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.storage = config.storage
            || createLocalStorage(this.config.storageKey)
            || createMemoryStorage();
        this.skills = this._load();
    }

    _load() {
        try {
            const raw = this.storage.read();
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : {};
        } catch {
            return {};
        }
    }

    _save() {
        try {
            this.storage.write(JSON.stringify(this.skills));
        } catch { /* swallow */ }
    }

    _ensure(signature) {
        if (!this.skills[signature]) {
            this.skills[signature] = {
                attempts: 0,
                successes: 0,
                streak: 0,         // current consecutive success streak
                unaidedStreak: 0,  // streak of successes without hint/show-answer
                missStreak: 0,     // current consecutive miss streak (post-mastery)
                mastered: false,
                lastSeen: 0
            };
        }
        return this.skills[signature];
    }

    /**
     * Record an outcome for a skill.
     *
     * @param {string} signature  - Stable skill key (e.g. 'numeric:v0x').
     * @param {object} outcome    - { ok, usedHint, usedShowAnswer }
     */
    record(signature, outcome) {
        if (!signature) return null;
        const skill = this._ensure(signature);
        const ok = Boolean(outcome?.ok);
        const aided = Boolean(outcome?.usedHint || outcome?.usedShowAnswer);

        skill.attempts += 1;
        skill.lastSeen = Date.now();

        if (ok) {
            skill.successes += 1;
            skill.streak += 1;
            skill.missStreak = 0;
            if (!aided) skill.unaidedStreak += 1;
            else skill.unaidedStreak = 0;

            if (!skill.mastered && skill.unaidedStreak >= this.config.masteryStreak) {
                skill.mastered = true;
            }
        } else {
            skill.streak = 0;
            skill.unaidedStreak = 0;
            skill.missStreak += 1;

            if (skill.mastered
                && this.config.decayMissStreak > 0
                && skill.missStreak >= this.config.decayMissStreak) {
                skill.mastered = false;
            }
        }

        this._save();
        return { ...skill };
    }

    /**
     * Mark a task as skipped — counts as a soft attempt, doesn't affect mastery
     * either way. We still update lastSeen so the dashboard shows recency.
     */
    recordSkip(signature) {
        if (!signature) return null;
        const skill = this._ensure(signature);
        skill.lastSeen = Date.now();
        this._save();
        return { ...skill };
    }

    /**
     * Reset progress for one skill or all skills. Useful for a "Reset progress"
     * button in the UI and for testing.
     */
    reset(signature = null) {
        if (signature) {
            delete this.skills[signature];
        } else {
            this.skills = {};
        }
        this._save();
    }

    get(signature) {
        return signature && this.skills[signature] ? { ...this.skills[signature] } : null;
    }

    isMastered(signature) {
        return Boolean(this.skills[signature]?.mastered);
    }

    /**
     * Snapshot of all skills. Useful for a progress dashboard.
     */
    snapshot() {
        return Object.fromEntries(
            Object.entries(this.skills).map(([k, v]) => [k, { ...v }])
        );
    }
}

// -----------------------------------------------------------------------------
// Skip policy
// -----------------------------------------------------------------------------
// Pure function, separate from the tracker so you can change the "should skip"
// rule without invalidating recorded data. The walkthrough calls this with the
// current task signature; if it returns a non-null suggestion the skip banner
// is shown.
// -----------------------------------------------------------------------------

export function getSkipSuggestion(tracker, signature, options = {}) {
    if (!tracker || !signature) return null;
    const skill = tracker.get(signature);
    if (!skill || !skill.mastered) return null;

    // `options.never` — skill keys that should never auto-suggest skipping
    // (e.g. the always-pedagogical "identify the givens" step).
    if (Array.isArray(options.never) && options.never.includes(signature)) return null;

    return {
        signature,
        reason: `You've answered this kind of task correctly ${skill.unaidedStreak}+ times unaided.`,
        skill
    };
}

/**
 * Return a Set of task signatures considered mastered. Useful for filtering
 * a step's tasks down to just the ones the student still needs to practice
 * — e.g. when resuming a problem and pre-checking the easy bits.
 */
export function getMasteredSignatures(tracker) {
    if (!tracker) return new Set();
    const mastered = new Set();
    const snap = tracker.snapshot();
    for (const [sig, skill] of Object.entries(snap)) {
        if (skill.mastered) mastered.add(sig);
    }
    return mastered;
}

/**
 * Filter a tasks array down to the tasks the student still needs to do. Pass
 * the result back into the walkthrough state to "auto-skip" mastered tasks.
 * Always returns at least one task — if everything is mastered, the last task
 * is kept so the student still gets the summary moment.
 */
export function filterTasksForStudent(tasks, tracker, getSignature) {
    if (!tracker || !Array.isArray(tasks) || !tasks.length) return tasks;
    const mastered = getMasteredSignatures(tracker);
    const remaining = tasks.filter(task => !mastered.has(getSignature(task)));
    return remaining.length ? remaining : [tasks[tasks.length - 1]];
}
