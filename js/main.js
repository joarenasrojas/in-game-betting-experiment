/**
 * Main Entry Point
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("App Initialized");

    // ---- Pavlovia / Prolific Configuration ----
    // Set your Pavlovia numeric project ID before deploying.
    // Set the Prolific completion URL to redirect participants after finishing.
    await Pavlovia.init({
        projectId: 507152,          // TODO: set your Pavlovia project ID (numeric)
        completionURL: 'https://app.prolific.com/submissions/complete?cc=C4KXC5T4'      // TODO: set your Prolific completion URL
    });

    // Use Prolific PID as participant ID if available
    const participantId = Pavlovia.prolificPID || undefined;

    // Initialize Game
    const game = new GameSession({
        participantId: participantId
    });

    // Initialize UI with game instance
    try {
        UI.init(game);
        console.log("UI Initialized");
    } catch (e) {
        console.error("UI Initialization Failed:", e);
    }
});
