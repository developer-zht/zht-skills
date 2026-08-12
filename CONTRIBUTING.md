# 贡献指南

## 提交信息格式

本仓库使用 [Conventional Commits](https://www.conventionalcommits.org/)。
格式是 `<type>(<scope>): <subject>`，例如：

    feat(writing-to-isolated-workspace): 增加会话开场的权限声明
    docs: 修正 README 里的安装命令
    fix: 修正 marketplace.json 中的 source 路径

`type` 可选：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

**新增一个 skill 用 `feat`，不是 `docs`** —— 它是新增能力，不是文档变更。

### 两种写法，任选

**省事的：交互式选单**（需要 Node）

    npm install
    npm run commit

会逐步问你类型、范围、描述，自动拼成合规格式，不用记语法。

**不装 Node 的：照格式手写**

    git commit -m "docs: 修正安装命令里的仓库名"

改一个错别字没必要为此装 Node。CI 会校验，格式不对会提示你改。

## PR 标题

PR 合并采用 squash 方式，**进入主干历史的是 PR 标题**，所以
**PR 标题本身必须符合上面的格式**。CI 会自动检查。

单条 commit 的信息在 squash 后会被折进正文，不影响主干的标题行。

## 新增一个 skill

1. 在 `skills/` 下新建 `<skill-名字>/SKILL.md`
2. frontmatter 的 `name` **必须与文件夹名完全一致**
3. `name` 只能用小写字母、数字、连字符，不得连续或首尾连字符，少于 64 字符
4. `description` 只写"什么时候用"，**不要概括流程** ——
   写了流程摘要，模型可能照摘要行事而不读正文
5. 不需要改任何清单文件，按目录约定自动发现

## 本地验证

    npx commitlint --from HEAD~1 --to HEAD --verbose
