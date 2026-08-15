# 贡献指南

## 提交信息格式

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/)。
格式是 `<type>(<scope>): <subject>`，例如：

    feat(writing-to-isolated-workspace): 增加会话开场的权限声明
    docs: 修正 README 里的安装命令
    fix: 修正 marketplace.json 中的 source 路径

`type` 可选：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**新增一个 Skill 使用 `feat`，不是 `docs`**——它增加的是 Agent 能力，不只是普通文档。

### 两种写法，任选

交互式选单需要 Node：

    npm install
    npm run commit

也可以直接按格式提交：

    git commit -m "docs: 修正安装命令里的仓库名"

## PR 标题

PR 合并采用 squash 方式，进入主干历史的是 PR 标题，因此 PR 标题必须符合 Conventional Commits 格式。

## 新增或修改 Skill

1. 每个 Skill 位于 `skills/<skill-name>/SKILL.md`。
2. frontmatter 的 `name` 必须与文件夹名完全一致。
3. `name` 只能使用小写字母、数字和连字符，不得连续或首尾使用连字符，长度少于 64 个字符。
4. `description` 应简洁说明该 Skill **做什么**以及**什么时候使用**。
5. `description` 不得复述具体步骤或完整工作流，详细规则写在正文中。
6. 通用 frontmatter 只使用 `name` 和 `description`；平台专属展示信息放在对应平台文件中。
7. 修改 `SKILL.md` 后，检查 `agents/openai.yaml` 是否仍与其一致。

推荐的 description 形式：

```yaml
description: Briefly states the capability. Use when the concrete triggering conditions apply.
```

## 保持插件各入口一致

当 Skill 的能力边界或名称发生变化时，检查：

- `skills/<skill-name>/agents/openai.yaml`
- `README.md`
- `.claude-plugin/marketplace.json`
- `.claude-plugin/plugin.json`
- `.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`

只修改真正受影响的文件。不要为了“一致”机械地改版本或重写无关字段。

## Skill 行为测试

修改行为规则前先建立 RED 基线：

1. 在一次性临时项目中运行当前已提交版本。
2. 记录原始提示、回答、文件树和 diff。
3. 确认失败来自规则缺失或歧义，而不是测试环境错误。
4. 最小修改 Skill。
5. 在新会话中运行 GREEN 和边界用例。
6. 增加 should-trigger 和 should-not-trigger 场景。

不得使用正式项目源码作为越界写入测试目标。

## 本地验证

提交信息：

    npx commitlint --from HEAD~1 --to HEAD --verbose

Claude 插件：

    claude plugin validate . --strict

Codex Skill 和插件校验应使用当前安装版本提供的官方 validator。若校验器因为缺少依赖而无法运行，应把环境问题与仓库内容问题分开报告。
