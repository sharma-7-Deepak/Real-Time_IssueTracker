# Real-Time Issue Tracker (Beginner)

A small beginner-friendly real-time issue tracker that demonstrates:
- WebSocket-based live updates (node `ws` library).
- Git versioning: every change to `issues.json` is committed automatically.

## Project structure
```
issue-tracker/
  package.json
  server.js
  issues.json
  public/
    index.html
    app.js
  README.md
```

## How it works (short)
- `server.js` serves the frontend and runs a WebSocket server.
- Clients connect via WebSocket. When someone creates/updates/comments on an issue:
  - The server updates `issues.json`.
  - The server runs `git add issues.json` and `git commit -m "..."` to save change history.
  - The server broadcasts the change to all clients so their UIs update instantly.

## Run locally (step-by-step)
1. Install Node.js (v16+ recommended) from https://nodejs.org.
2. Extract the zip and open a terminal inside the project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. (Optional) If you want nice Git history later, you can run:
   ```bash
   git init
   git add .
   git commit -m "Initial import"
   ```
   The server will also initialize git automatically if needed.
5. Start the server:
   ```bash
   npm start
   ```
6. Open your browser at `http://localhost:3000`. Open the page in multiple tabs/browsers to test real-time updates.

## Notes and beginner tips
- Commits are performed with a local user `IssueTracker Bot` (configured automatically).
- If Git asks for credentials or refuses to commit, make sure Git is installed and available in PATH.
- This project is intentionally simple — no database, no authentication, plain JSON file storage.
- Be cautious: this writes commits to the local repo. For classwork/demo, that's fine.

## Troubleshooting
- Error: `git: command not found` — install Git (https://git-scm.com).
- If commits say "no-changes-to-commit", that means the file content didn't change (for example duplicate update).

Enjoy! Make it your own: add editing of title/description in the UI, or show who made each change.