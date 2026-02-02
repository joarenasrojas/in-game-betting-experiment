/**
 * Pavlovia Integration
 * Handles session management and data upload to Pavlovia server.
 * Also reads Prolific URL parameters.
 */

const Pavlovia = {
    API_URL: 'https://pavlovia.org/api/v2',
    projectId: null,
    token: null,
    isActive: false,
    prolificPID: null,
    prolificStudyID: null,
    prolificSessionID: null,
    completionURL: null, // Prolific completion redirect URL

    /**
     * Read URL parameters from Prolific and Pavlovia.
     */
    readURLParams() {
        const params = new URLSearchParams(window.location.search);
        this.prolificPID = params.get('PROLIFIC_PID') || null;
        this.prolificStudyID = params.get('STUDY_ID') || null;
        this.prolificSessionID = params.get('SESSION_ID') || null;
    },

    /**
     * Detect if running on Pavlovia.
     */
    isOnPavlovia() {
        return window.location.hostname.includes('pavlovia.org');
    },

    /**
     * Initialize Pavlovia session.
     * @param {Object} config - { projectId, completionURL }
     */
    async init(config = {}) {
        this.readURLParams();

        if (config.projectId) this.projectId = config.projectId;
        if (config.completionURL) this.completionURL = config.completionURL;

        if (!this.isOnPavlovia()) {
            console.log('[Pavlovia] Not running on Pavlovia, server save disabled.');
            return false;
        }

        if (!this.projectId) {
            console.error('[Pavlovia] No projectId configured. Cannot open session.');
            return false;
        }

        try {
            const formData = new FormData();
            if (this.prolificPID) {
                formData.append('participant', this.prolificPID);
            }

            const response = await fetch(
                `${this.API_URL}/experiments/${this.projectId}/sessions`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.token = data.token;
            this.isActive = true;
            console.log('[Pavlovia] Session opened, token:', this.token);
            return true;
        } catch (e) {
            console.error('[Pavlovia] Failed to open session:', e);
            return false;
        }
    },

    /**
     * Upload CSV data to Pavlovia server.
     * @param {string} filename - The filename for the CSV (e.g., "participant_123.csv")
     * @param {string} csvData - The CSV content as a string
     */
    async saveData(filename, csvData) {
        if (!this.isActive) {
            console.warn('[Pavlovia] Session not active, cannot save data.');
            return false;
        }

        try {
            const formData = new FormData();
            formData.append('key', filename);
            formData.append('value', csvData);

            const response = await fetch(
                `${this.API_URL}/experiments/${this.projectId}/sessions/${this.token}/results`,
                { method: 'POST', body: formData }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('[Pavlovia] Data saved:', filename);
            return true;
        } catch (e) {
            console.error('[Pavlovia] Failed to save data:', e);
            return false;
        }
    },

    /**
     * Close the Pavlovia session (marks as completed).
     */
    async finish() {
        if (!this.isActive) return false;

        try {
            const formData = new FormData();
            formData.append('isCompleted', 'true');

            await fetch(
                `${this.API_URL}/experiments/${this.projectId}/sessions/${this.token}`,
                { method: 'DELETE', body: formData }
            );

            this.isActive = false;
            console.log('[Pavlovia] Session closed.');
            return true;
        } catch (e) {
            console.error('[Pavlovia] Failed to close session:', e);
            return false;
        }
    },

    /**
     * Redirect to Prolific completion URL if configured.
     */
    redirectToProlific() {
        if (this.completionURL) {
            window.location.href = this.completionURL;
        }
    }
};
