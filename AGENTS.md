# StudyMimi Development Rules

## Scope

- Keep V1 focused on the requested macOS Electron desktop pet.
- Do not add accounts, login, friends, chat, Supabase, databases, or complex settings/UI unless explicitly requested.
- Prefer the smallest clear implementation and preserve working files.

## Git workflow

- Check Git status before starting work.
- When a Git repository exists, do not develop new features directly on `main`; use a branch named `feature/...`.
- If Git or GitHub is not initialized, report that state. Do not initialize Git, create a remote, or overwrite files without an explicit request.
- Do not commit, push, open a pull request, or merge automatically.
- Only when the user says exactly `PR 준비해줘`, review changes, rerun validation, commit with an appropriate message, push the current feature branch, and open a pull request targeting `main`.
- Never merge a pull request unless the user explicitly requests it.

## Validation

- After code changes, run at least `npm run lint` and `npm run build`.
- Run a minimal Electron launch check for changes affecting the desktop app.
- Fix failures and rerun the relevant checks. Never claim an unexecuted check passed.

## Continuous integration

- If a GitHub repository is connected, keep CI minimal: install dependencies, lint, and TypeScript/build checks on pull requests and pushes to `main`.
- Do not add fragile Electron GUI automation to V1 CI.
