/**
 * Data Logger
 * Handles data storage and CSV export.
 */

const Logger = {
    trials: [],

    logTrial(trialData) {
        this.trials.push(trialData);
    },

    /**
     * Generate CSV string from collected trial data.
     * @returns {string|null} CSV content or null if no data.
     */
    generateCSV() {
        if (this.trials.length === 0) return null;

        const rows = [];

        this.trials.forEach(trial => {
            trial.history.forEach(step => {
                const row = {
                    participant_number: trial.participant_number,
                    trial_id: trial.trial_id,
                    n_stages: trial.n_stages,
                    stage: step.stage,
                    outcome: trial.outcome,
                    wealth_start: trial.wealth_start,
                    wealth_end: trial.wealth_end,

                    p_roll: step.p_roll,
                    h_roll: step.h_roll,
                    p_sum: step.p_sum,
                    h_sum: step.h_sum,
                    wealth_available: step.wealth_available,
                    current_bet: step.current_bet,
                    remaining_stages: step.remaining_stages,

                    win_prob: step.ground_truth_probs.win,
                    loss_prob: step.ground_truth_probs.loss,
                    entropy: step.entropy,

                    action_taken: step.action_taken,
                    belief_reported: step.belief_reported,
                    bet_after_action: step.bet_after_action,

                    brier_score: step.brier_score,
                    accuracy_score: step.accuracy_score,

                    performance_reward: trial.performance_reward,
                    total_payment: trial.total_payment,
                    mean_accuracy: trial.mean_accuracy,

                    Questionnaire_Total: trial.questionnaire ? trial.questionnaire.totalScore : '',
                };

                if (trial.questionnaire && trial.questionnaire.answers) {
                    trial.questionnaire.answers.forEach((ans, idx) => {
                        row[`Q${idx + 1}`] = ans;
                    });
                }

                rows.push(row);
            });
        });

        const headers = Object.keys(rows[0]);
        return [
            headers.join(','),
            ...rows.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
    },

    /**
     * Save data to Pavlovia server. Falls back to local download if not on Pavlovia.
     * @param {string} participantId - Used for the filename on the server.
     * @returns {Promise<boolean>} Whether the save succeeded.
     */
    async save(participantId) {
        const csvContent = this.generateCSV();
        if (!csvContent) return false;

        if (Pavlovia.isActive) {
            const filename = `PARTICIPANT_${participantId || 'unknown'}_${Date.now()}.csv`;
            const saved = await Pavlovia.saveData(filename, csvContent);
            if (saved) {
                await Pavlovia.finish();
                return true;
            }
            // If Pavlovia save failed, fall through to local download
            console.warn('[Logger] Pavlovia save failed, falling back to local download.');
        }

        // Local download fallback
        this.downloadCSV(csvContent, participantId);
        return true;
    },

    /**
     * Download CSV file locally (fallback for non-Pavlovia environments).
     */
    downloadCSV(csvContent, participantId) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `experiment_data_${participantId || 'unknown'}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
