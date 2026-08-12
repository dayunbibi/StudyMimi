# StudyMimi Development Rules

## Scope

- Keep V1 focused on the requested macOS Electron desktop pet.
- Do not add accounts, login, friends, chat, Supabase, databases, or complex settings/UI unless explicitly requested.
- Prefer the smallest clear implementation and preserve working files.

## Character system product direction

- StudyMimi's core product direction is to let each user use their own Desktop Pet character.
- Provide a small selection of default characters in a future version.
- Allow users to import and use character images they created themselves.
- Design image import around PNG support first, especially transparent-background PNG files.
- Plan for a future in-app drawing tool that lets users create a simple character inside StudyMimi.
- If friend features are added in the future, allow the system to evolve so a friend's character can appear on the user's desktop.

### Current V1 boundary

- Completing the basic Desktop Pet experience remains the current priority.
- Do not implement character selection, image upload/import, the drawing tool, or friend characters in V1.
- Treat these character-system items as future requirements only until the user explicitly expands the implementation scope.

## Git workflow

- Check Git status before starting work.
- For every new feature request, create and work on a branch named `feature/...`; never implement features directly on `main`.
- If Git or GitHub is not initialized, report that state. Do not initialize Git, create a remote, or overwrite files without an explicit request.
- After implementing the feature, run all required project validation, including at least `npm run lint` and `npm run build`.
- Only when every required check succeeds, automatically commit the completed feature with an appropriate message, push the feature branch to `origin`, and open a pull request targeting `main`.
- Do not require the user to say `PR 준비해줘`; successful feature completion triggers commit, push, and pull request creation automatically.
- If any required check fails, do not commit, push, or open a pull request.
- Never push feature work directly to `main`.
- Stop after creating the pull request.
- Never merge a pull request unless the user explicitly requests it.

## Validation

- After code changes, run at least `npm run lint` and `npm run build`.
- Run a minimal Electron launch check for changes affecting the desktop app.
- Fix failures and rerun the relevant checks. Never claim an unexecuted check passed.

## Continuous integration

- If a GitHub repository is connected, keep CI minimal: install dependencies, lint, and TypeScript/build checks on pull requests and pushes to `main`.
- Do not add fragile Electron GUI automation to V1 CI.

## Autonomous execution

- Do not ask for confirmation during normal implementation.
- Make reasonable technical and UI decisions independently.
- If multiple reasonable implementations exist, choose the simplest one that fits the existing architecture.
- Continue through implementation, debugging, linting, building, testing, committing, pushing, and PR creation without asking for intermediate approval.
- Only ask the user when essential information is genuinely missing and cannot be safely inferred.
- Never merge a Pull Request without explicit user approval.