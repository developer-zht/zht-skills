# zht-skills

面向 Claude Code、Codex 及其他兼容 Agent Skills 的个人 Skill 集合。

## 要解决的问题

让 Agent 直接修改项目源码，通常会遇到两个问题。

**改动范围容易扩大。** 用户只要求修改一个文件，Agent 可能顺带调整格式、注释、依赖文件或测试快照，使 diff 变大、审查成本上升。

**中间产物缺少稳定落点。** 分析、设计、诊断和实验代码要么混进源码目录，要么散落在临时目录中，后续会话难以继续使用。

这个仓库提供一个统一的行为协议：Agent 默认读取项目，在自己的 workspace 中写入产物；正式项目文件只有在用户明确指定路径后才允许修改。

## 核心边界

默认状态：

| 行为           | 默认值                                |
| -------------- | ------------------------------------- |
| 读取           | 运行环境允许时读取项目内容            |
| 写入           | 只写 `<模型名>-workspace/` 及其子目录 |
| 修改正式文件   | 需要用户明确授权精确路径              |
| 删除或移动文件 | 默认不允许，必须单独授权              |
| Git 写操作     | 默认不允许，必须单独授权              |

`<模型名>` 使用 Agent 的通用小写名称，例如：

- `claude-workspace/`
- `codex-workspace/`
- `gemini-workspace/`

这是一套 **Agent 行为和用户授权协议**，不是文件系统 sandbox。Skill 本身不会改变操作系统权限，也不能保证源码目录在技术上只读。需要硬隔离时，应另外配置 sandbox、文件权限、容器只读挂载或独立可写目录。

## 包含的 Skill

### `writing-to-isolated-workspace`

该 Skill 在项目会话开始、文件写入前、用户调整写入范围或有效期时使用。

它维护三个互相独立的值：

| 值             | 可选内容                                   |
| -------------- | ------------------------------------------ |
| 可以写哪些路径 | 仅 workspace、用户指定的精确路径、整个项目 |
| 持续多久       | 当前会话、长期                             |
| Git 写操作     | 默认无，或用户明确列出的操作               |

一个值不会暗示另一个值。例如，允许修改 `README.md` 不代表允许 `git add`、`git commit` 或 `git push`。

### 会话开场

每个新项目会话中，Skill 要求 Agent 声明：

- 当前可写路径；
- 当前设置持续多久；
- Git 写操作是否获批；
- 写入磁盘的完整内容是否也需要贴进对话。

如果用户不回答誊抄问题，下一轮起默认不誊抄。

### 一次性修改正式文件

用户说：

```text
你帮我改 README.md
```

Agent 应在写入前声明：

```text
本轮仅修改 `README.md`；不删除或移动文件，不修改其他文件，
不执行 `git add`、`git commit`、`git push` 或其他 Git 写操作。
```

如果过程中发现还需要修改另一个文件，Agent 必须先列出新增路径并请求扩大范围。一次性授权不会延续到下一轮或新会话。

### 长期授权

长期授权由可选的本地记录保存：

```text
.agent-policy/write-scope.json
```

这个文件不是 Claude Code 或 Codex 的原生配置。只有 Skill 明确读取并验证它时才会产生作用。

调用 Skill 不会自动允许创建这个文件。只有当用户明确给出写入路径、选择“长期”，并单独允许写入该记录文件后，Agent 才能创建或更新它。

新会话必须重新验证：

- 项目真实路径是否匹配；
- 记录是否有效、未过期且未撤销；
- 记录是否没有被 Git 跟踪；
- 所有路径解析后是否仍位于当前项目中。

任何验证失败都会回到默认的 workspace-only 状态。Memory 可以帮助定位授权记录，但不能单独扩大写入范围。

## 如何判断 Skill 在起作用

- 分析、方案和实验代码集中在 `<模型名>-workspace/`。
- 修改正式文件前，Agent 会声明精确目标路径和不包含的操作。
- 需要额外文件时，Agent 会先请求扩大范围。
- 文件修改不会自动变成 Git 暂存、提交或推送授权。
- 新会话不会继承上一个会话的临时授权。
- 长期记录无效时，Agent 会回到 workspace-only，而不是继续沿用。

`git status` 不一定保持完全干净：workspace 位于项目内部且未被忽略时，可能显示为 untracked。真正应检查的是正式源码是否出现未经授权的修改。

## 硬隔离

如果需要“即使 Agent 判断错误，系统也拒绝写源码”，需要在 Skill 之外配置：

```text
项目源码                 只读
<模型名>-workspace/      可写
```

可选实现包括：

- 容器中的只读源码挂载和独立可写卷；
- 操作系统文件权限；
- 能区分只读根与可写根的受管 sandbox；
- 覆盖 Shell 子进程的文件系统限制。

仅依赖提示词、Skill 或普通工具 Hook，不能宣称已经获得硬隔离。

## 安装

### Claude Code：插件市场

```text
/plugin marketplace add developer-zht/zht-skills
/plugin install zht-skills@zht-skills-marketplace
```

### Claude Code：软链单个 Skill

```bash
git clone https://github.com/developer-zht/zht-skills.git
ln -s "$(pwd)/zht-skills/skills/writing-to-isolated-workspace" ~/.claude/skills/writing-to-isolated-workspace
```

仓库同时包含 Codex 插件 manifest 和 marketplace 配置：

- `.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`
- `skills/writing-to-isolated-workspace/agents/openai.yaml`

Codex 的具体安装入口可能随客户端版本和产品界面变化，应使用当前 Codex 插件市场或官方安装入口。

## 权衡

这套规则优先保证可控和可审查，会增加少量确认步骤：

- 修改正式文件前需要声明精确范围；
- 删除、移动和 Git 写操作需要单独授权；
- 长期授权首次保存时需要允许写入授权记录；
- 真正硬隔离还需要额外配置运行环境。

对于重视源码边界、项目规模较大或回归成本较高的场景，这些确认通常值得。对于一次性原型，用户可以显式扩大当前会话的写入范围。

## 设计原则

- Skill 只保存跨项目可复用的行为规则。
- 项目或个人授权必须可验证、可撤销并有明确来源。
- Memory 是辅助信息，不是写入授权事实源。
- 放宽需要确认，收紧不需要。
- 无法确认时退回 workspace-only。
- 行为协议与系统权限必须分别描述。

完整规则见 [`skills/writing-to-isolated-workspace/SKILL.md`](skills/writing-to-isolated-workspace/SKILL.md)。

## 贡献

提交信息和 PR 标题使用 Conventional Commits。详见 [`CONTRIBUTING.md`](CONTRIBUTING.md)。

## 许可

MIT
