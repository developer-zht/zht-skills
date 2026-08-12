import { defineConfig } from 'cz-git'

const types = [
  { value: 'feat', name: 'feat:     新增功能 | A new feature' },
  { value: 'fix', name: 'fix:      修复缺陷 | A bug fix' },
  { value: 'docs', name: 'docs:     文档更新 | Documentation only changes' },
  {
    value: 'style',
    name: 'style:    代码格式 | Changes that do not affect meaning',
  },
  {
    value: 'refactor',
    name: 'refactor: 代码重构 | Neither fixes a bug nor adds a feature',
  },
  {
    value: 'perf',
    name: 'perf:     性能提升 | A code change that improves performance',
  },
  { value: 'test', name: 'test:     测试相关 | Adding or correcting tests' },
  {
    value: 'build',
    name: 'build:    构建相关 | Build system or external dependencies',
  },
  {
    value: 'ci',
    name: 'ci:       持续集成 | CI configuration files and scripts',
  },
  { value: 'chore', name: 'chore:    其他修改 | Other changes' },
  { value: 'revert', name: 'revert:   回退代码 | Revert to a commit' },
]

export default defineConfig({
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', types.map((t) => t.value)],
    'subject-max-length': [2, 'always', 150],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case'],
    ],
    'subject-full-stop': [2, 'never', '.'],
  },
  prompt: {
    messages: {
      type: '选择你要提交的类型 :',
      scope: '选择一个提交范围（可选）:',
      customScope: '请输入自定义的提交范围 :',
      subject: '填写简短精炼的变更描述 :\n',
      body: '填写更加详细的变更描述（可选）。使用 "|" 换行 :\n',
      breaking: '列举非兼容性重大的变更（可选）。使用 "|" 换行 :\n',
      footerPrefixesSelect: '选择关联 issue 前缀（可选）:',
      customFooterPrefix: '输入自定义 issue 前缀 :',
      footer: '列举关联 issue（可选）例如: #31 :\n',
      confirmCommit: '是否提交或修改 commit ?',
    },
    types,
    scopes: [
      'writing-to-isolated-workspace',
      'marketplace',
      'repo',
      'ci',
      'docs',
    ],
    allowCustomScopes: true,
    allowEmptyScopes: true,
    useEmoji: false,
    allowBreakingChanges: ['feat', 'fix'],
  },
})
