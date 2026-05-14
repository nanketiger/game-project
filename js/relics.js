// ================= 遗物系统 =================

// 遗物全局状态
let selectedRelics = [];       // 本局已获得的遗物 ID 列表
let isRelicSelecting = false; // 是否正在显示遗物选择界面

// ================= 20个遗物定义 =================
const RELICS = [
    {
        id: 1,
        name: '力量护符',
        desc: '子弹伤害 +1',
        apply: function () { bulletDamage += 1; }
    },
    {
        id: 2,
        name: '生命水晶',
        desc: '最大生命值 +20 并恢复全部生命',
        apply: function () { playerHealth = maxHealth + 20; }
    },
    {
        id: 3,
        name: '吸血之戒',
        desc: '击杀怪物恢复 1 点生命',
        apply: function () { /* 效果在怪物死亡时触发，见 takeDamage 处 */ }
    },
    {
        id: 4,
        name: '时光沙漏',
        desc: '射击间隔减少 150ms',
        apply: function () { /* 需调整 shootCooldown，见 utils.js */ }
    },
    {
        id: 5,
        name: '铁壁护盾',
        desc: '受伤后无敌时间翻倍',
        apply: function () { /* 需调整 damageCooldown，见 utils.js */ }
    },
    {
        id: 6,
        name: '荆棘甲',
        desc: '被怪物触碰时反弹 1 点伤害',
        apply: function () { /* 效果在碰撞伤害时触发 */ }
    },
    {
        id: 7,
        name: '疾风之羽',
        desc: '子弹飞行速度 +3',
        apply: function () { /* 需调整子弹速度，见 utils.js */ }
    },
    {
        id: 8,
        name: '巨人药剂',
        desc: '角色体积略微变大',
        apply: function () { /* 需调整 scale，见 main.js */ }
    },
    {
        id: 9,
        name: '磁铁护符',
        desc: '自动拾取掉落物范围增大',
        apply: function () { /* 效果在拾取判定时触发 */ }
    },
    {
        id: 10,
        name: '分身之镜',
        desc: '每次射击多发射一颗子弹',
        apply: function () { /* 效果在 shoot 时触发 */ }
    },
    {
        id: 11,
        name: '冰霜之心',
        desc: '所有怪物移动速度降低 30%',
        apply: function () { /* 需修改怪物 speed */ }
    },
    {
        id: 12,
        name: '凤凰羽毛',
        desc: '死亡时复活一次（恢复 50% 生命）',
        apply: function () { /* 效果在玩家死亡时触发 */ }
    },
    {
        id: 13,
        name: '暴击之星',
        desc: '15% 概率造成双倍伤害',
        apply: function () { /* 效果在 takeDamage 时触发 */ }
    },
    {
        id: 14,
        name: '幸运草',
        desc: '怪物掉落物数量翻倍',
        apply: function () { /* 效果在 spawnDrop 时触发 */ }
    },
    {
        id: 15,
        name: '重力石',
        desc: '跳跃高度降低，但滞空时间更长',
        apply: function () { /* 需调整 jumpPower 和 gravity */ }
    },
    {
        id: 16,
        name: '圣光之戒',
        desc: '每进入新关卡恢复 5 点生命',
        apply: function () { /* 效果在 refreshMap 时触发 */ }
    },
    {
        id: 17,
        name: '猎人印记',
        desc: '对满血怪物造成的伤害翻倍',
        apply: function () { /* 效果在 takeDamage 时触发 */ }
    },
    {
        id: 18,
        name: '金币袋',
        desc: '每关额外获得一个随机掉落物',
        apply: function () { /* 效果在怪物全灭时触发 */ }
    },
    {
        id: 19,
        name: '缩小卷轴',
        desc: '所有怪物体型缩小 20%',
        apply: function () { /* 需修改怪物元素样式 */ }
    },
    {
        id: 20,
        name: '不朽之盾',
        desc: '每次受伤最多损失 1 点生命',
        apply: function () { /* 效果在碰撞伤害时触发 */ }
    }
];

// ================= 遗物选取逻辑 =================

// 从遗物池中随机抽取 count 个（排除已获得的）
function getRandomRelics(count = 3) {
    const pool = RELICS.filter(r => !selectedRelics.includes(r.id));
    // 池子不够时返回全部
    if (pool.length <= count) return [...pool];

    // Fisher-Yates 洗牌后取前 count 个
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// ================= 遗物选择界面 =================

function createRelicSelectionUI() {
    const screen = document.createElement('div');
    screen.id = 'relic-screen';
    screen.className = 'screen hidden';
    screen.innerHTML = `
        <div class="relic-container">
            <div class="relic-header">
                <h2>选择一个遗物</h2>
                <p class="relic-subtitle">击败所有怪物，选择一份力量</p>
            </div>
            <div class="relic-cards" id="relic-cards"></div>
        </div>
    `;
    document.body.appendChild(screen);
    return screen;
}

function showRelicSelection() {
    isRelicSelecting = true;

    let screen = document.getElementById('relic-screen');
    if (!screen) screen = createRelicSelectionUI();

    const cardsContainer = document.getElementById('relic-cards');
    cardsContainer.innerHTML = '';

    const picks = getRandomRelics(3);
    picks.forEach(relic => {
        const card = document.createElement('div');
        card.className = 'relic-card';
        card.innerHTML = `
            <div class="relic-icon">${relic.name.charAt(0)}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-desc">${relic.desc}</div>
        `;
        card.addEventListener('click', () => selectRelic(relic, screen));
        cardsContainer.appendChild(card);
    });

    screen.classList.remove('hidden');
    screen.classList.add('active');
}

function selectRelic(relic, screen) {
    // 记录获得的遗物
    selectedRelics.push(relic.id);

    // 应用遗物效果
    if (typeof relic.apply === 'function') {
        relic.apply();
    }

    // 关闭选择界面
    screen.classList.remove('active');
    screen.classList.add('hidden');
    isRelicSelecting = false;

    // 生成传送门
    createPortal();
}

function clearRelics() {
    selectedRelics = [];
    isRelicSelecting = false;
}
