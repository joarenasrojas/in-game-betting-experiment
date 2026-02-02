# Deployment Guide: In-Game Betting Experiment (Pavlovia + Prolific)

## Prerequisites

- Account on [pavlovia.org](https://pavlovia.org) (also gives access to gitlab.pavlovia.org)
- Account on [prolific.com](https://www.prolific.com)
- Pavlovia credits or institutional site license
- Git installed on your machine

---

## Step 1: Create the Pavlovia Project

1. Go to [gitlab.pavlovia.org](https://gitlab.pavlovia.org/)
2. Click **New Project** > **Create Blank Project**
3. Name it (e.g., `in-game-betting-experiment`), set visibility to **Private**
4. Click **Create Project**

## Step 2: Upload the Experiment

**Important:** `index.html` must be at the **root** of the repository (not inside a subfolder). Move the contents of `in-game-betting-experiment/` to the repo root.

```bash
git clone https://gitlab.pavlovia.org/YOUR_USERNAME/in-game-betting-experiment.git
cd in-game-betting-experiment

# Copy all experiment files to the repo root
cp -r /path/to/in-game-betting-experiment/* .

# Verify index.html is at root
ls index.html

git add .
git commit -m "Initial experiment upload"
git push origin master
```

Your repo structure should look like:

```
/
  index.html
  css/style.css
  js/pavlovia.js
  js/logger.js
  js/math.js
  js/game.js
  js/ui.js
  js/main.js
  tests/...
```

## Step 3: Find Your Numeric Project ID

1. On gitlab.pavlovia.org, open your project page
2. Go to **Settings** > **General**
3. The **Project ID** is displayed near the top of the page (a number like `123456`)

## Step 4: Configure the Experiment Code

Edit `js/main.js` and fill in the two `TODO` values:

```javascript
await Pavlovia.init({
    projectId: 123456,                                                    // Your numeric project ID
    completionURL: 'https://app.prolific.com/submissions/complete?cc=XXXXXXXX'  // Your Prolific completion code URL
});
```

The `completionURL` is provided by Prolific when you create your study (see Step 7).

Commit and push:

```bash
git add js/main.js
git commit -m "Set Pavlovia project ID and Prolific completion URL"
git push origin master
```

## Step 5: Pilot Test on Pavlovia

1. Go to [pavlovia.org](https://pavlovia.org) > **Dashboard** > **Experiments**
2. Find your experiment and click on it
3. Click **Pilot** to generate a temporary test link (valid 1 hour, free)
4. Run through the full experiment to verify everything works
5. Check the browser console for `[Pavlovia] Session opened` messages

**Note:** In Piloting mode, data downloads to your browser (not saved on the server). This is normal.

## Step 6: Activate for Running

1. On the Pavlovia experiment page, switch the status to **Running**
2. This generates the permanent participant URL:

```
https://run.pavlovia.org/YOUR_USERNAME/in-game-betting-experiment/
```

Each participant session consumes one credit.

## Step 7: Set Up the Prolific Study

1. On [prolific.com](https://www.prolific.com), create a new study
2. In the **Study Link** section, enter:

```
https://run.pavlovia.org/YOUR_USERNAME/in-game-betting-experiment/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}
```

3. Select **"I'll use URL parameters"** when prompted
4. In the **Completion** section, Prolific will provide a completion URL like:

```
https://app.prolific.com/submissions/complete?cc=XXXXXXXX
```

5. Copy this URL and paste it as `completionURL` in `js/main.js` (Step 4)
6. Push the update to gitlab.pavlovia.org

## Step 8: End-to-End Test

1. On Prolific, use the **Preview** feature to test the full flow
2. Verify the sequence: Prolific link > experiment loads > questionnaire > game > data saves > redirect to Prolific
3. Check that the CSV appears in your Pavlovia GitLab project's `data/` folder (do a `git pull`)
4. Verify the CSV contains `PROLIFIC_PID` as the `participant_number`

---

## How Data Flows

```
Participant clicks Prolific link
  → Pavlovia loads index.html with ?PROLIFIC_PID=xxx&STUDY_ID=yyy&SESSION_ID=zzz
    → pavlovia.js reads URL params, opens a session via API
    → Participant completes experiment (100 trials)
    → On "Save & Finish": Logger generates CSV, uploads via Pavlovia API
    → Pavlovia session closed
    → Participant redirected to Prolific completion URL
```

Data is saved as a CSV file per participant in the `data/` folder of your GitLab repository. Run `git pull` to download all results.

## Local Testing

When running locally (not on pavlovia.org), the Pavlovia integration is automatically skipped and data downloads as a local CSV file instead.

```bash
# Simple local server (avoids CORS issues)
cd in-game-betting-experiment
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| 403 Forbidden on Pavlovia | `index.html` not at repo root | Move files so `index.html` is at `/` |
| Experiment stuck on Inactive | No credits or missing index.html | Purchase credits, check file structure |
| Data not appearing in `data/` | Session not closed properly | Check browser console for API errors |
| Prolific shows "timed out" | Redirect fires before upload completes | The code waits for upload before redirecting |
| CORS errors locally | Opening `file://` directly | Use `python3 -m http.server` instead |
| CSV has "unknown" as participant | Prolific params not passed | Check the study URL has `?PROLIFIC_PID={{%PROLIFIC_PID%}}` |

## Data Loss Prevention

Pavlovia reports ~5-10% data loss for some experiments. To mitigate:

- The `Save & Finish` button waits for the upload to confirm before redirecting
- If the Pavlovia save fails, the code falls back to a local CSV download
- Consider purchasing 10-20% extra credits to account for dropouts
