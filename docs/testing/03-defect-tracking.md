# 缺陷跟踪

| ID | 描述 | 模块 | 严重度 | 状态 | 修复方式 |
|----|------|------|--------|------|----------|
| #1 | PixiJS v8 CDN 被浏览器 Tracking Prevention 拦截，PixiJS 初始化失败 | 传送门 | 阻塞 | 已关闭 | 改用 CSS + PNG 帧序列动画，移除 PixiJS 依赖 |
| #2 | 进入新关卡后传送门视觉残留（canvas/DOM 未移除） | 传送门 | 高 | 已关闭 | destroy() 显式删除 DOM 元素 + parentNode.removeChild |
| #3 | 传送门再也不会出现（querySelectorAll('canvas') 过度清理） | 传送门 | 阻塞 | 已关闭 | 移除核武器式全量 canvas 删除，改为精确 DOM 清理 |
| #4 | PixiJS v7 cancelResize 报错（autoDensity + resolution 冲突） | 传送门 | 中 | 已关闭 | 移除 autoDensity/resolution 选项（后已弃用 PixiJS） |
| #5 | 传送门显示为黑框 / 游戏卡死 | 传送门 | 阻塞 | 已关闭 | 替换为轻量级 CSS 帧动画，无 WebGL 依赖 |
| #6 | 传送门碰撞检测不准确（尺寸与视觉不匹配） | 传送门 | 中 | 已关闭 | portalX/portalY + 固定宽高手动计算碰撞区域 |
| #7 | Canvas getContext('2d')! 非空断言错误 | 传送门 | 低 | 已关闭 | TypeScript 转 JS 时移除 '!' 运算符 |
