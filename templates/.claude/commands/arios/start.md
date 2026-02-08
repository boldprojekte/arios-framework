---
description: Complete ARIOS setup and detect project stack
---

# /arios:start

## Purpose

Complete ARIOS setup inside Claude Code by detecting technical environment/tooling.

Important: `/arios:start` must NOT lock in the final product/project type yet (for example, "API", "SaaS", "shop").  
That intent is defined later when the user describes what they want to build (`/arios` mode detection + `/arios:ideate`).

## Context

- @.planning/config.json - Current project configuration
- @package.json - Node.js project indicator
- @requirements.txt - Python project indicator
- @go.mod - Go project indicator
- @Cargo.toml - Rust project indicator

## Instructions

1. Detect **runtime/tooling** by checking indicator files:
   - Node: package.json
   - Python: requirements.txt / pyproject.toml
   - Go: go.mod
   - Rust: Cargo.toml
2. Identify TypeScript usage (`tsconfig.json` and/or `.ts`/`.tsx` source files).
3. Detect package manager (npm, pnpm, yarn, bun) from lockfiles and packageManager field.
4. Detect project maturity:
   - **Greenfield**: no real source files yet (only manifests/config is fine)
   - **Brownfield**: source files already exist
5. Update `.planning/config.json` while preserving existing keys.
6. Store detection in a neutral structure that does NOT over-interpret intent. Example:
   ```json
   {
     "project": {
       "type": "unspecified",
       "maturity": "greenfield",
       "runtime": "node",
       "typescript": false,
       "packageManager": "npm"
     }
   }
   ```
7. Never set business/product type during `/arios:start`.

## Workflow

1. Read existing .planning/config.json
2. Scan for runtime/tooling indicators
3. Ask user to confirm if detection is ambiguous
4. Write updated config
5. Report what was configured

## Report

```
ARIOS Setup Complete

Detected:
- Runtime/tooling: [detected runtime]
- TypeScript: [yes/no]
- Package Manager: [detected]
- Maturity: [greenfield/brownfield]

Project type: not set yet (will be defined when you describe what to build)

Configuration saved to .planning/config.json
```
