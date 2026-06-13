# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

日语学习网站，帮助用户系统学习日语。核心功能模块：五十音图、单词 SRS 背诵、语法学习、听力练习。

## 技术栈

- **前端**: React 18+ / TypeScript / Vite
- **路由**: React Router v6+ 使用 `HashRouter`（因为 GitHub Pages 不支持 SPA 的 history 模式回退）
- **样式**: Tailwind CSS
- **本地数据**: Dexie.js (IndexedDB 封装)，用于 SRS 间隔重复数据、学习进度等
- **多设备同步**: GitHub Gist API 作为云端 JSON 存储中转（免费、私密）
- **部署**: GitHub Pages（免费静态托管，自动 HTTPS）

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
```

## 架构设计

### 路由结构

```
/                    → 首页/仪表盘（学习概览、今日任务）
/kana                → 五十音图（平假名/片假名 图表 + 练习）
/vocabulary          → 单词 SRS 背诵主界面
/vocabulary/manage   → 单词库管理（添加/导入单词）
/grammar             → 语法学习（按级别分类 N5~N1）
/grammar/:id         → 单个语法点详情
/listening           → 听力练习
/settings            → 设置（SRS 参数、数据导出/导入）
```

### 数据模型 (IndexedDB / Dexie.js)

```
Kana
  - id: string (e.g., "hira-a", "kata-ka")
  - character: string
  - romaji: string
  - type: 'hiragana' | 'katakana'
  - proficiency: number (0-100, mastery score)

Word
  - id: auto
  - term: string (e.g., "食べる")
  - reading: string (e.g., "たべる")
  - meaning: string
  - partOfSpeech: string
  - exampleSentence?: string
  - tags?: string[]
  - srsData: { interval, ease, due, reps, lapses }

GrammarPoint
  - id: auto
  - title: string
  - level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1'
  - pattern: string (e.g., "〜てから")
  - explanation: string
  - examples: string[]
  - notes?: string

ListeningTrack
  - id: auto
  - title: string
  - audioUrl: string (本地路径或远程 URL)
  - transcript: string (日语原文)
  - translation: string
  - difficulty: 'beginner' | 'intermediate' | 'advanced'

StudySession
  - id: auto
  - date: Date
  - type: 'kana' | 'vocabulary' | 'grammar' | 'listening'
  - reviewsCount: number
  - newCount: number
```

### SRS 算法

使用 SM-2 算法的简化版本（类似 Anki）：
- 每个复习间隔根据回答质量调整：`ease` 因子和 `interval` 乘数
- 新卡片初始间隔：1 天 → 3 天 → 7 天 → ...
- 回答质量：Again(0) / Hard(1) / Good(2) / Easy(3)

### 多设备同步（GitHub Gist）

利用 GitHub Gist API 实现电脑和手机间的数据同步。架构要点：

**初始化流程**（首次使用）：
1. 用户在 GitHub 创建 Personal Access Token（仅勾选 `gist` 权限）
2. 在 App 设置页填入 Token → App 自动创建一个**私有 Gist**（只存一个 `japanese-learning-data.json`）
3. Gist ID 和 Token 保存在 localStorage，后续自动使用

**同步时机**：
- App 打开时自动从 Gist 拉取，与本地 IndexedDB 合并
- 每次学习完成后自动推送（防抖 3 秒）
- 设置页提供手动"强制同步"按钮

**冲突策略**：
- 每个数据记录带有 `updatedAt` 时间戳
- 合并时按记录级别 last-write-wins：比较本地和远程每条记录的 `updatedAt`，保留较新的
- 不删除远程有而本地没有的记录（可能是另一设备新增的）

**安全边界**：
- Token 仅申请 `gist` 单一 scope，无法访问仓库代码
- Gist 设为私有，只有 Token 持有者能读写
- Token 仅存在用户自己浏览器的 localStorage 中，不上传任何服务器

```
src/
├── ...
├── hooks/
│   ├── useSync.ts        # 同步逻辑（pull/merge/push），自动触发
│   └── ...
├── utils/
│   ├── sync.ts           # Gist API 调用（fetch/write gist）、合并算法
│   └── ...
└── ...
```

### 组件架构

```
src/
├── components/
│   ├── layout/          # Layout, Navbar, BottomNav
│   ├── kana/            # KanaCard, KanaChart, KanaQuiz
│   ├── vocabulary/      # WordCard, ReviewSession, SrsControls
│   ├── grammar/         # GrammarCard, GrammarList
│   ├── listening/       # AudioPlayer, TranscriptView
│   └── ui/              # 通用 UI 组件 (Button, Card, Progress, Modal)
├── hooks/               # 自定义 hooks
│   ├── useSrs.ts        # SRS 算法逻辑
│   ├── useIndexedDb.ts  # Dexie 数据库操作
│   └── useAudio.ts      # 音频播放控制
├── pages/               # 页面组件（对应路由）
├── db/                  # Dexie 数据库定义
│   └── database.ts      # 数据库 schema + 初始化
├── utils/               # 工具函数
│   ├── srs.ts           # SM-2 算法实现
│   └── kana.ts          # 假名数据 + 工具函数
├── data/                # 静态数据（假名表、内置单词等）
└── App.tsx
```

### 关键库版本

- `react` / `react-dom`: ^18
- `react-router-dom`: ^6
- `dexie`: ^4
- `tailwindcss`: ^3
- `typescript`: ^5

### 部署到 GitHub Pages

使用 `gh-pages` 包自动部署：

```bash
npm run deploy        # 构建并部署到 GitHub Pages
```

**首次部署**（手动操作一次）：
1. GitHub 仓库 → Settings → Pages → Source 选 `gh-pages` branch
2. 等待几分钟，网站即可通过 `https://<username>.github.io/<repo>/` 访问
3. 手机浏览器可直接打开，支持添加到主屏幕

**SPA 路由说明**：本项目使用 `HashRouter`（URL 带 `/#/`），因为 GitHub Pages 的 404 页面无法配合 BrowserRouter 的 history 模式。这意味着 URL 格式为 `/#/kana` 而非 `/kana`，对功能无影响。

**后续 PWA 支持**（可选）：添加 `vite-plugin-pwa` 可实现离线访问。

### 注意事项

- 所有学习数据主存储为浏览器 IndexedDB，Gist 作为同步中转
- SRS 到期时间用 `Date.now()` 比较，不受时区影响
- 听力音频使用静态文件（放在 `public/audio/`），或使用外部 CDN URL
- 首次使用需在设置页配置 GitHub Token（仅 gist 权限），之后自动同步无需操作
- PWA 离线支持后续可添加 Service Worker
