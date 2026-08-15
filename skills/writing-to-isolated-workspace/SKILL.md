---
name: writing-to-isolated-workspace
description: Provides a cross-tool write-scope and consent protocol for project-based agent sessions. Use at session start, before any file write, when the user changes allowed write paths or duration, or when deciding where generated notes, documents, analyses, designs, or experimental code should be saved.
---

# Writing to Isolated Workspace

## Purpose

Treat this Skill as a behavioral consent protocol, not a filesystem sandbox.

Default behavior:

- Read the whole project when the runtime permits it.
- Write only inside `<agent-name>-workspace/`.
- Do not modify project source unless the user explicitly authorizes exact paths.
- Keep Git mutations separate from file-edit authorization.

This Skill never grants tool permission and cannot guarantee that the source tree
is read-only. Runtime permissions, hooks, sandboxing, or OS-level mounts must
enforce a hard filesystem boundary.

Write user-facing notices in the user's current language. The Chinese templates
below define the required information, not a fixed output language.

## Resolve the project and workspace

At the start of a project-based session:

1. Resolve the real path of the current project root.
2. Determine the generic lowercase agent name without a version suffix:
   `claude`, `codex`, or `gemini`.
3. Use `<agent-name>-workspace/` as the default writable directory.
4. Reuse the directory if it exists; otherwise create it only when a write is needed.
5. Resolve every target's real path before writing.
6. Reject symlinks that resolve outside the currently authorized paths.

Store generated artifacts in:

`<agent-name>-workspace/<topic>/`

Use the user's topic-directory name exactly when provided. Otherwise choose a
short descriptive name without repeating the agent name.

## Session state

Track these values independently:

1. Allowed write paths:
   - `<agent-name>-workspace/` only
   - exact user-specified paths
   - the entire project

2. Duration:
   - current session only
   - persistent across new sessions

3. Git mutations:
   - none by default
   - only the exact operations explicitly authorized by the user

Never infer one value from another.

Do not use `global`, `local`, `提权`, or `作用域` when explaining these values
to the user. State the paths, duration, and Git operations directly.

## Default state

When no valid persistent record or current-session authorization exists:

- Allowed write paths: `<agent-name>-workspace/`
- Duration: current session
- Git mutations: none
- Transcript copies: disabled unless the user opts in

A temporary authorization never carries into a new session.

## Opening notice

On the first response of every new project session, state the current values.

When no workspace exists, include the full notice after the main answer:

```text
📁 关于我写文件的方式

我可以读取这个项目，但默认只往 `<模型名>-workspace/` 写文件。
这是一条行为规则，不代表系统已经把源码目录锁成只读。

① 可以写哪些路径
   · 只写 `<模型名>-workspace/`        ← 当前
   · 你明确指定的路径
   · 整个项目

② 这个设定持续多久
   · 只管当前会话                       ← 当前
   · 长期，在新会话中恢复

修改文件不自动授权删除、移动文件或执行 Git 写操作。

可以这样说：
  「只修改 README.md，这次会话」
  「docs/ 可以写，长期」
  「收回，只写 workspace」

📝 如果本轮写文件，是否也把完整内容贴进对话？不回答则默认不贴。
```

When the workspace already exists, use the short form:

```text
写入范围：只写 `<模型名>-workspace/` ｜ 当前会话 ｜ Git 写操作：未授权
📝 写盘内容是否也贴进对话？不回答则默认不贴。
```

When a persistent grant exists, place the notice before the main answer and
include its source and date.

## Adjusting write access

A complete authorization has two independent values:

| Value | Options |
| --- | --- |
| Allowed write paths | workspace only, exact user-specified paths, or the entire project |
| Duration | current session or persistent |

Ask only for the missing value. Never infer one value from the other.

When the user changes a tool permission mode:

- Treat the change as applying only to the current session.
- Do not infer that the user expanded the allowed write paths.
- Confirm before expanding the paths.
- When the mode becomes stricter, return to the stricter boundary without delay.

If a spoken instruction conflicts with the tool mode, explain the conflict and
ask the user to decide. If it remains unresolved on the next turn, return to the
default workspace-only state.

## Writing outside the workspace

By default, do not write outside the authorized paths. Provide the complete
content and an executable command so the user can apply it.

An explicit request such as "你帮我改 README.md" authorizes only the exact
target files required for that named task and only for the current turn.

Before the first write, state the exact resolved file list and excluded operations:

```text
本轮仅修改 `README.md`；不删除或移动文件，不修改其他文件，
不执行 `git add`、`git commit`、`git push` 或其他 Git 写操作。
```

Apply these rules:

- If the target list is clear, state the boundary and proceed.
- If the target is ambiguous, ask for the exact files before writing.
- Do not create, delete, rename, or move files unless explicitly authorized.
- Do not infer Git mutation permission from file-edit permission.
- Read-only inspection such as `git status` and `git diff` is separate.
- If another file becomes necessary, stop and request the additional path.
- After completion, list every modified file.
- Never carry the exception into another turn or session.

## Persistent authorization

Do not create a persistent authorization record merely because this Skill was
invoked.

Only create one after the user has:

1. Named the exact write paths.
2. Explicitly selected persistent duration.
3. Separately authorized creating or updating
   `.agent-policy/write-scope.json`.

Use this format:

```json
{
  "schema_version": 1,
  "status": "active",
  "project_realpath": "/absolute/real/project/path",
  "write_paths": ["docs/", "README.md"],
  "duration": "persistent",
  "granted_by": "user",
  "granted_at": "YYYY-MM-DD",
  "expires_at": null,
  "git_operations": []
}
```

This file is a consent record, not a native Claude Code or Codex configuration
file. It has no effect unless this Skill reads and validates it.

On every new session:

1. Read the record if it exists.
2. Ignore it if it is tracked by Git.
3. Validate its JSON and schema version.
4. Require an exact `project_realpath` match.
5. Reject expired or revoked records.
6. Resolve every recorded path and reject paths outside the project.
7. If any check fails, return to the default state and warn the user.

Memory may point to the record but must never grant or expand write permission
by itself.

If the user revokes a persistent grant, mark the record as revoked or ask the
user to remove it. Do not silently delete authorization records.

## Before every write

Before writing a file:

1. Resolve the target's real path.
2. Check that it is inside an authorized path.
3. Check the authorization source and duration.
4. Check whether deletion, movement, or Git mutation is involved.
5. If any answer is missing or ambiguous, use the default state.

Tool approval is not equivalent to user authorization.

## Transcript copies

Ask at the beginning of each session whether files written to disk should also
be reproduced in the conversation.

If the user does not answer by the next turn, default to not reproducing them.

This preference changes only conversation output. It never changes the allowed
write paths or their duration.

## Hard isolation

For real filesystem isolation, configure the runtime or operating system so that:

- the project source is read-only;
- `<agent-name>-workspace/` is a separate writable mount or allowed root;
- symlink escapes are rejected;
- shell processes inherit the same restriction.

Do not claim hard isolation unless this enforcement has been verified.

## Fail-safe rule

Apply this rule everywhere:

- Expanding write access requires confirmation.
- Narrowing write access does not.
- Missing, stale, conflicting, or unverifiable authorization returns to the
  default workspace-only state.

The fact that a tool permits an operation does not prove that the user authorized it.

## Common mistakes

| Mistake | Required behavior |
| --- | --- |
| Treating Skill invocation as system permission | Keep behavioral consent and runtime permission separate |
| Writing `.agent-policy/` automatically | Request authorization for that exact file |
| Treating "你帮我改" as whole-project access | List exact files before writing |
| Editing extra files because they seem necessary | Request expansion first |
| Treating file edits as Git authorization | Require separate Git consent |
| Trusting a policy file from Git | Ignore tracked policy files |
| Following a workspace symlink into source | Resolve real paths and reject escape |
| Forgetting the transcript question | Include it in both opening templates |
| Carrying temporary access into a new session | Restore the default state |
| Treating tool approval as user consent | Check the authorization source and duration |