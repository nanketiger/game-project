# 软件配置与运维文档

## 1. 配置管理

### 开发环境
- **操作系统**：Windows 11
- **浏览器**：Chrome / Edge
- **编辑器**：VS Code
- **运行方式**：file:// 协议直接打开 index.html

### 项目结构
```
/ (根目录)
├── index.html          # 入口页面
├── css/style.css       # 全局样式
├── js/
│   ├── main.js         # 主逻辑（游戏循环、关卡生成）
│   ├── utils.js        # 工具函数（键盘、射击）
│   ├── monster.js      # 怪物类
│   ├── relics.js       # 遗物系统
│   ├── bag.js          # 背包系统
│   └── portalEffect.js # 传送门组件
├── images/             # 图片资源
├── sound/              # 音效资源
├── craftpix-net-.../   # 精灵图资源
└── docs/               # 文档
```

## 2. 版本控制

### Git 规范
- **分支模型**：默认 main 分支
- **提交信息格式**：Conventional Commits
  - `feat:` 新功能
  - `fix:` 修复
  - `refactor:` 重构
  - `docs:` 文档

### 当前版本
- **最新 Tag**：-
- **最近提交**：见 git log

## 3. 持续集成

当前无 CI/CD 配置。（项目为纯前端静态页面，无需构建步骤）

## 4. 部署与运维

### 当前部署方式
- **环境**：本地开发（file:// 协议）
- **部署步骤**：无——直接打开 index.html 即可运行
- **依赖**：无外部依赖（纯 HTML/CSS/JS）

### 运维计划
- **故障排查**：打开浏览器控制台（F12）查看错误日志
- **性能监控**：Chrome DevTools Performance 面板
