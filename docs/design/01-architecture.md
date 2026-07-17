# 架构设计文档

## 1. 概述

**项目名称**：平台冒险游戏（肉鸽闯关·demo版）

**项目类型**：纯前端 2D 横版平台动作游戏，融合 Roguelike 遗物选择机制。

**技术栈**：HTML5 + CSS3 + 原生 JavaScript（ES6+），无第三方框架或库依赖，通过 `file://` 协议直接在浏览器中运行。

---

## 2. 整体架构

### 2.1 架构图

```
┌──────────────────────────────────────────────────────────┐
│                     index.html                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ start-screen │  │pause-screen │  │  victory-screen │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              game-container                      │   │
│  │  ┌──────┐  ┌──────────┐  ┌────────┐  ┌───────┐  │   │
│  │  │player│  │ platforms │  │monsters│  │ drops │  │   │
│  │  └──────┘  └──────────┘  └────────┘  └───────┘  │   │
│  │  ┌──────┐  ┌──────────┐  ┌───────────────────┐  │   │
│  │  │portal│  │auras/efx │  │  hp / level-info  │  │   │
│  │  └──────┘  └──────────┘  └───────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌─────────────────┐  ┌──────────────────────────┐     │
│  │ relic-screen    │  │   backpack-screen        │     │
│  └─────────────────┘  └──────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    ▼                      ▼                      ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐
│ main.js  │   │  monster.js  │   │  relics.js   │
│ 游戏主循环 │   │  怪物/Bomb类  │   │  遗物系统     │
└──────────┘   └──────────────┘   └──────────────┘
    │                │                  │
    ▼                ▼                  ▼
┌──────────┐   ┌──────────────┐   ┌──────────────┐
│ utils.js │   │playerEffect  │   │  bag.js      │
│ 工具/射击 │   │.js/portalEf- │   │  背包系统     │
│          │   │fect.js/idle- │   │              │
│          │   │Aura.js/revi- │   │              │
│          │   │veEffect.js   │   │              │
└──────────┘   └──────────────┘   └──────────────┘
    │
    ▼
┌──────────────┐     ┌──────────────┐
│ css/style.css│     │  images/     │
│ 样式/动画     │     │  sound/      │
└──────────────┘     │  精灵图资源   │
                     └──────────────┘
```

### 2.2 分层架构

系统采用**单页面多状态**的分层架构，分为三层：

| 层次 | 职责 | 对应文件 |
|------|------|----------|
| **表现层** | UI 界面（开始/暂停/胜利/背包/遗物选择）、DOM 元素渲染、CSS 动画 | `index.html`, `css/style.css` |
| **逻辑层** | 游戏主循环、物理模拟、碰撞检测、状态管理、怪物 AI | `js/main.js`, `js/utils.js`, `js/monster.js` |
| **系统层** | 遗物效果、背包管理、特效播放、资源加载 | `js/relics.js`, `js/bag.js`, `js/portalEffect.js`, `js/playerEffect.js`, `js/idleAura.js`, `js/reviveEffect.js` |

---

## 3. 模块划分

### 3.1 核心模块

| 模块 | 文件 | 主要职责 |
|------|------|----------|
| 入口/UI | `index.html` | 页面结构、资源引用、加载顺序 |
| 样式/动画 | `css/style.css` | 角色精灵图动画（CSS @keyframes）、平台/子弹/怪物样式、各界面布局 |
| 主逻辑 | `js/main.js` | 游戏循环（`requestAnimationFrame`）、关卡生成（10个房间生成函数）、物理碰撞（重力/平台/传送门）、血量管理、暂停/复活/通关 |
| 工具/射击 | `js/utils.js` | 键盘状态管理、多方向射击函数、血量显示更新、游戏初始化与启动 |
| 怪物系统 | `js/monster.js` | `Monster` 类（状态机 AI + 精灵帧动画）、`Bomb` 类（抛物线弹道 + 爆炸范围伤害）、怪物类型配置表、洗牌随机生成算法 |
| 遗物系统 | `js/relics.js` | 14 个遗物定义（含图标/描述/背景故事/效果函数）、随机抽取算法、选择界面渲染、遗物效果应用 |
| 背包系统 | `js/bag.js` | 背包 UI 创建、物品存取、遗物/战利品详情查看、B 键开关背包 |
| 特效模块 | `js/portalEffect.js` | 传送门 PNG 帧序列动画（8fps） |
| 特效模块 | `js/playerEffect.js` | 人物跟随粒子效果（63帧精灵图，lerp 延迟跟随，5秒自毁） |
| 特效模块 | `js/idleAura.js` | 待机光环（2秒无操作触发，7帧循环，8fps） |
| 特效模块 | `js/reviveEffect.js` | 复活芯片电光光环（7帧循环，5fps） |

### 3.2 模块依赖关系

```
main.js ──→ utils.js          （射击、伤害冷却、playerScale、faceDir）
        ──→ monster.js        （Monster 类、Bomb 类、rollMonsterType）
        ──→ relics.js         （selectedRelics、showRelicSelection、clearRelics）
        ──→ portalEffect.js   （PortalEffect 类）
        ──→ playerEffect.js   （PlayerEffect 类）
        ──→ idleAura.js       （IdleAura 类）
        ──→ reviveEffect.js   （ReviveEffect 类）

utils.js ──→ monster.js       （射击碰撞检测中访问 monsters 数组）

bag.js    ──→ relics.js       （getRelicById）

monster.js ──→ relics.js      （读取 selectedRelics 应用遗物效果）
           ──→ main.js全局变量（bombs 数组、playerHealth、spawnDrop）
```

**重要设计特征**：模块间通过共享全局变量耦合（如 `monsters[]`、`selectedRelics[]`、`playerHealth` 等），未使用模块化加载方案（如 ES Module 或 CommonJS），而是通过 `<script>` 标签顺序加载保证依赖可用。

---

## 4. 核心数据结构

### 4.1 怪物状态机

```
                ┌─────────┐
        开局 ──→│ patrol  │←──────────┐
                └────┬────┘           │
                     │                │
          ┌──────────┼──────────┐     │
          ▼          ▼          ▼     │
      ┌───────┐ ┌───────┐  ┌──────┐  │
      │pursue │ │charge │  │ hurt │──┘
      └───┬───┘ └───┬───┘  └──────┘  (15帧后恢复)
          │         │
          └────┬────┘
               ▼
          ┌───────┐
          │ dead  │  (终态，不再更新)
          └───────┘
```

- **patrol**：地面怪左右巡逻、天空怪水平移动；碰撞边界反弹；红怪检测玩家距离转入 pursue；坦克怪冷却倒计时投弹
- **pursue**：红怪追踪玩家方向移动；超出侦测范围 1.5 倍后恢复 patrol
- **charge**：天空怪蓄力，预警光束逐步变宽，计时满后 `chargeReady = true` 触发伤害判定
- **hurt**：15 帧受伤僵直，期间闪烁特效，结束后恢复 patrol
- **dead**：播放死亡动画，300ms 后移除 DOM

### 4.2 怪物类型配置表

| 类型 | 精灵集 | 颜色 | 血量倍率 | 速度倍率 | 掉落物 | 特殊行为 |
|------|--------|------|----------|----------|--------|----------|
| `patrol` | ground2 | #9400D3 | 5 | 1.0 | 紫怪核心 | 巡逻，第1关起可用 |
| `chase` | ground3 | #FF4444 | 3 | 0.9 | 赤怪碎片 | 检测范围 200px 追击；低血量狂暴（速度×1.6，接触伤害×1.67） |
| `tank` | ground1 | #44AA44 | 12 | 0.6 | 绿怪甲壳 | 远程投掷炸弹（抛物线弹道 + 范围爆炸） |
| `sky` | fly | #44CCCC | 2 | 1.0 | 天空之羽 | 巡逻后蓄力发射垂直光束 |

### 4.3 全局游戏状态

```javascript
// 物理状态
x, y, vy, gravity, jumpPower, isOnGround

// 游戏状态
playerHealth, maxHealth, isDead, hasRevive
currentLevel, isPaused, isRelicSelecting
monstersActive, portal, drops[], bombs[]

// 战斗参数
bulletDamage, shootCooldown, damageCooldown
playerScale, faceDir

// 遗物/背包
selectedRelics[], backpackItems{}
```

### 4.4 关卡生成数据

10 个关卡通过 `roomGenerators` 函数数组调度，每关独立定义平台布局和怪物配置：

| 关卡 | 主题 | 平台数 | 怪物数 | 新增怪物类型 |
|------|------|--------|--------|-------------|
| 1 | 入门 | 0 | 2 | patrol |
| 2 | 低平台 | 2 | 3 | — |
| 3 | 阶梯 | 3 | 4 | chase |
| 4 | 多层 | 4 | 5 | tank |
| 5 | 裂谷 | 3 | 6 | sky（背景切换） |
| 6 | 双层 | 5 | 6 | — |
| 7 | 浮空岛 | 6 | 7 | — |
| 8 | 高塔 | 6 | 7 | — |
| 9 | 竞技场 | 5 | 8 | — |
| 10 | Boss战 | 7 | 1 Boss + 5 小怪 | Boss（3倍缩放） |

---

## 5. 游戏循环

```
requestAnimationFrame(loop)
    │
    ├── 检查胜利/遗物/暂停状态 → 跳过或继续
    │
    ├── [输入处理]
    │   ├── A/D 移动
    │   ├── K 跳跃
    │   └── J 射击（utils.js 独立监听）
    │
    ├── [特效更新]
    │   ├── 复活光环检测
    │   ├── 待机光环检测（2秒计时器）
    │   └── 边界裁剪
    │
    ├── [物理模拟]
    │   ├── 重力影响 vy
    │   ├── 位移 y += vy
    │   ├── 地面碰撞（y ≤ 0）
    │   └── 平台碰撞（AABB + 仅下落时判定）
    │
    ├── [怪物更新]
    │   ├── 遍历 monsters[] → m.update()
    │   ├── 天空怪光束碰撞伤害
    │   ├── 地面怪接触伤害（AABB，缩框60%）
    │   └── Chase Boss 轨迹伤害（独立冷却1秒）
    │
    ├── [炸弹更新]
    │   ├── 抛物线运动
    │   ├── 碰玩家判定（直接命中）
    │   └── 碰地判定（范围伤害 + Boss分裂）
    │
    ├── [物品/传送门交互]
    │   ├── 复活芯片判定
    │   ├── 死亡判定 → 弹窗回主菜单
    │   ├── 掉落物拾取（AABB + 遗物扩展）
    │   └── 传送门碰撞 → refreshMap()
    │
    └── [渲染]
        ├── player 位置/动画类切换/缩放
        ├── 特效跟随更新
        └── requestAnimationFrame(loop)
```

**帧率**：依赖浏览器默认刷新率（通常 60fps），未做固定时间步处理。

---

## 6. 关键设计决策

### 决策 1：DOM 渲染而非 Canvas/WebGL

**选择**：使用 DOM 元素 + CSS 动画进行渲染。

**理由**：
- 项目规模为四人小组开发，DOM 操作开发效率高
- CSS sprite sheet 动画（`@keyframes` + `steps()`）简洁地实现角色动画
- 怪物数量有限（最多 8 只），DOM 节点数在浏览器可承受范围内
- 传送门最早曾尝试 PixiJS（WebGL），因 CDN 被浏览器跟踪防护拦截、WebGL 兼容性问题、黑屏卡死等一系列问题后放弃，最终改为 CSS + PNG 帧序列
- 避免了 Canvas 上下文管理、WebGL 着色器等额外复杂度

**代价**：每帧需要操作大量 DOM 元素位置，性能不如 Canvas 批处理；无法使用 GPU 粒子系统等高级效果。

### 决策 2：全局变量 + `<script>` 标签加载

**选择**：不使用 ES Module 或打包工具，所有模块通过全局作用域变量共享状态，通过 `<script>` 标签顺序加载。

**理由**：
- 零构建步骤，无需 Node.js/npm 环境，可直接通过 `file://` 协议运行
- 团队成员无需学习 Webpack/Vite 等工具链
- 项目 JS 文件数量有限（9 个），全局变量管理复杂度可控

**代价**：命名冲突风险、耦合度高、难以单元测试、代码提示和类型检查缺失。

### 决策 3：怪物状态机模式

**选择**：每个 `Monster` 实例维护 `state` 属性（patrol/pursue/charge/hurt/dead），在 `update()` 中根据状态分发行为。

**理由**：
- 4 种怪物类型行为差异大（地面巡逻、追击、蓄力、投弹），switch-state 模式简单直观
- 受伤/死亡等跨类型行为统一处理
- 易于扩展新状态（如未来增加"眩晕"）

### 决策 4：关卡硬编码生成函数

**选择**：10 个关卡的平台布局和怪物配置分别写死在 `generateRoom1()` ~ `generateRoom10()` 中。

**理由**：
- 关卡数量固定（10 关），每关有不同的空间设计意图（入门 → 裂谷 → 双层 → 浮空岛 → Boss）
- 硬编码比配置驱动更直观、修改更快捷
- 不需要关卡编辑器和数据解析逻辑

**代价**：新增关卡需要编写新的生成函数，关卡数据与逻辑耦合。

### 决策 5：遗物系统采用装饰器模式

**选择**：每个遗物定义包含 `apply()` 函数，选择时直接修改全局变量（如 `bulletDamage *= 4`），部分遗物效果在具体游戏逻辑处通过 `selectedRelics.includes(id)` 条件分支触发。

**理由**：
- 14 个遗物效果多样（修改属性、行为分支、额外功能），装饰器方式灵活
- 统一的数据定义方便渲染选择界面
- 效果立即生效，无需事件系统

**代价**：效果分散在多个文件中（`relics.js`、`main.js`、`monster.js`、`utils.js`），追踪某遗物的完整影响需要全局搜索。

### 决策 6：洗牌保底随机算法

**选择**：`rollMonsterType()` 使用洗牌队列 + 加权池，保证前 N 次调用每种可用类型至少出现一次。

**理由**：
- 避免纯随机导致的"连续 10 只同类型"极端体验
- 洗牌队列长度 20，在保证多样性的同时缓冲随机开销
- 加权池（chase 类型出现权重 ×2）控制稀有度

### 决策 7：单页面多状态切换

**选择**：所有界面（开始/游戏/暂停/胜利/背包/遗物选择）存在于同一个 HTML 文件中，通过 CSS 类 `.active` / `.hidden` 切换显示。

**理由**：
- 避免页面跳转导致游戏状态丢失
- 所有 DOM 元素常驻，状态切换无加载延迟
- 简单直观，适合 demo 规模

---

## 7. 物理与碰撞系统

### 7.1 重力模拟

```javascript
vy -= gravity;        // 每帧减小垂直速度
y += vy;              // 更新位置
// 地面碰撞
if (y <= 0) { y = 0; vy = 0; isOnGround = true; }
```

简化物理模型：恒定重力、无空气阻力、无水平加速度衰减。

### 7.2 平台碰撞（单向）

仅在下落状态（`vy <= 0`）且上一帧在平台上方时判定着陆：

```javascript
if (prevPlayerBottom >= platTop && playerBottom <= platTop && vy <= 0) {
    y = platTop - groundHeight;
    vy = 0;
    onPlatform = true;
}
```

这保证了玩家可以从下方穿过平台（平台不阻挡上升）。

### 7.3 伤害碰撞（AABB 缩框）

怪物接触伤害使用缩小 60% 宽度的碰撞框，减少"隔空挨打"视觉不适感：

```javascript
const shrink = rawMRect.width * 0.6;
const mRect = {
    left: rawMRect.left + shrink,
    right: rawMRect.right - shrink,
};
```

### 7.4 传送门碰撞

使用固定尺寸（78×78px）的 AABB 检测，相较于复杂的像素级碰撞更稳定可靠。

---

## 8. 精灵动画系统

### 8.1 角色动画（CSS @keyframes）

利用 CSS `animation` + `steps()` 函数实现精灵图帧动画：

```css
#player.idle {
    width: 128px; height: 128px;
    background-image: url('.../Idle.png');
    background-size: 1152px 128px; /* 9帧 × 128px */
    animation: idle-anim 1s steps(9) infinite;
}
@keyframes idle-anim {
    from { background-position: 0px 0px; }
    to   { background-position: -1152px 0px; }
}
```

状态切换通过 JavaScript 修改 `player.className` 完成（idle/running/shooting/jumping/dead）。

### 8.2 怪物动画（JS 驱动）

怪物使用 JavaScript 驱动的逐帧精灵图切换，每 8 tick（约 133ms）推进一帧：

```javascript
// Monster.update() 中
this.frameTimer++;
if (this.frameTimer >= this.frameDelay) {
    this.frameTimer = 0;
    this.frameIndex = (this.frameIndex + 1) % frameCount;
}
this.element.style.backgroundPosition = `-${this.frameIndex * this.elW}px 0`;
```

选择 JS 驱动而非 CSS 的原因：需要在 `setSprite()` 中动态切换精灵图源（idle/walk/hurt/death 图片不同），且需要根据 `bossScale` 缩放 `backgroundSize`。

### 8.3 特效动画

- **传送门**：JS 驱动的 PNG 帧序列轮播（22帧，~8fps）
- **跟随效果**：63 帧精灵图，setInterval 驱动（30fps），5 秒自毁
- **待机光环**：7 帧，8fps，循环播放
- **复活光环**：7 帧，5fps

---

## 9. 资源加载

`main.js` 底部包含资源预加载逻辑（第772-848行自执行函数）：扫描所有 CSS 样式表中的 `url()` 引用，通过 `new Image()` 逐张预加载，并在 10 秒超时后强制完成。加载进度通过顶部进度条可视化展示。

---

## 10. 技术债务与改进方向

| 问题 | 影响 | 建议方案 |
|------|------|----------|
| 全局变量耦合 | 难以测试、难以复用 | 引入 GameState 单例或 ECS 架构 |
| 无模块化 | 文件依赖顺序敏感 | 迁移到 ES Module 或 Vite 打包 |
| 无固定时间步 | 不同帧率下物理行为不一致 | 引入 `deltaTime` 或固定时间步累加器 |
| 关卡硬编码 | 扩展性差 | 设计 JSON 关卡数据格式 + 关卡解析器 |
| DOM 渲染性能 | 怪物/子弹增多时卡顿 | 迁移到 Canvas 渲染 |
| 无自动化测试 | 回归风险高 | 引入 Jest/Cypress 等测试框架 |
