# Istifada1448H Taweeliya Nikat Rasail Shareefa

Static GitHub Pages frontend for the `mustafashtaher/Quiz1448` workshop application.

## Upload and GitHub Pages

1. Upload the complete directory structure to the repository's `main` branch (the files in this project are ready to copy directly).
2. In **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
3. Wait for the Pages deployment and open `/index.html`. The presenter and projector pages are `/presenter.html` and `/audience.html`.

The Apps Script URL is configured once in `js/config.js`. No secret, presenter credential, Drive credential, participant database, or answer key belongs in this public repository.

## Font

Place the licensed binary `Kanz-al-Marjaan.woff2` in `fonts/`. The stylesheet references it automatically and falls back to system fonts when it is absent. Do not commit a font unless you have permission to redistribute it.

## How it works

Participants search with a Mumin ID. The frontend asks Apps Script for only the matching profile, loads a sanitized quiz, submits answers to Apps Script for authoritative checking, and independently submits audience questions. Picture questions are converted to base64 only for the upload request; the backend must validate size/type and save the file to Drive.

Presenters sign in through Apps Script using the email and code stored in the Settings sheet. The returned session token is held in `sessionStorage`, never in source code. Dashboard requests include the selected day/group. Audience View can be opened from the dashboard and reads only the presenter-approved public data.

## Apps Script contract

`js/api.js` sends JSON POST requests with this shape:

```json
{"action":"findParticipant","payload":{"muminId":"..."},"token":null}
```

The expected actions are `findParticipant`, `getQuiz`, `submitQuiz`, `uploadImage`, `submitAudienceQuestion`, `presenterLogin`, `getDashboard`, `saveQuestion`, `deleteQuestion`, `setQuestionActive`, `updateAudienceQuestion`, `saveSettings`, and `getAudienceView`. Responses should be JSON and may be either `{success:true,data:{...}}` or the data object itself. If the existing Apps Script uses different action names, change only the small mapping in `js/api.js`—do not expose secrets in the frontend.

The dashboard response should provide `stats`, `dailyStats`, `questions`, `participants`, `results`, `answers`, `audienceQuestions`, and `settings`. Quiz responses should provide `questions` without `CorrectAnswer` or `AcceptedAnswers`, plus a `day` value. Submission responses should provide `score`, `totalPoints`, `percentage`, and `completed` from the server.

## Security checklist

* Enforce authentication and token expiry in Apps Script on every presenter action.
* Enforce one attempt per participant/day atomically in Apps Script.
* Validate participant identity, group, current day, quiz state, image MIME type and size server-side.
* Never return answer keys, accepted answers, login code, or the full Participants sheet to public actions.
* Escape or sanitize values before rendering them in an audience display.
* Configure Apps Script CORS/access for the GitHub Pages origin and test its deployment version.

## Troubleshooting

* **Network/CORS error:** verify the Apps Script deployment is a Web App, execute as the owner, and permits the intended users; inspect the browser Network tab.
* **Participant not found:** confirm the exact `Mumin_ID` header and string/number normalization in Apps Script.
* **Already completed:** this is intentionally enforced by the backend; do not bypass it in JavaScript.
* **Images fail:** check Drive folder permissions, payload size limits, and that `uploadImage` returns a File ID.
* **Dashboard blank:** verify the presenter token and that `getDashboard` returns the documented arrays.
* **Font missing:** place the licensed file at `fonts/Kanz-al-Marjaan.woff2`.

## Testing checklist

Test participant lookup, invalid IDs, quiz open/closed, all five question types, previous/next navigation, duplicate submit, one-attempt enforcement, text and picture questions, image failures, presenter login/session expiry, every group/day filter, settings updates, audience status/leaderboard, mobile layout, and a 1920×1080 projector display.
