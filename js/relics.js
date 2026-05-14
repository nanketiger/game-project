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
        story: '一枚古老的铜质护符，表面刻着早已失传的战士符文。握在手中时，能感受到一股温热的力量顺着指尖流向武器，让每一击都更加沉重有力。',
        apply: function () { bulletDamage += 1; }
    },
    {
        id: 2,
        name: '生命水晶',
        desc: '最大生命值 +20 并恢复全部生命',
        story: '深红色水晶内部流淌着柔和的光芒，据说是远古生命之树凝结的精华。它能将生命能量直接注入持有者体内，修复受损的躯壳，让疲惫的身体重新焕发活力。',
        apply: function () { playerHealth = maxHealth + 20; }
    },
    {
        id: 3,
        name: '吸血之戒',
        desc: '击杀怪物恢复 1 点生命',
        story: '这枚暗红色的戒指内侧刻着一圈细密的獠牙状纹路。传说它由一位吸血鬼伯爵的血液淬炼而成，能将敌人的生命力抽取并转移给佩戴者。',
        apply: function () { /* 效果在怪物死亡时触发 */ }
    },
    {
        id: 4,
        name: '时光沙漏',
        desc: '射击间隔减少 150ms',
        story: '一个精致的小沙漏，里面的银沙永远在流动却永远不会落尽。触碰它的人会感觉周围的时间变慢了，手上的动作却变得更加迅捷流畅。',
        apply: function () { /* 需调整 shootCooldown */ }
    },
    {
        id: 5,
        name: '铁壁护盾',
        desc: '受伤后无敌时间翻倍',
        story: '一面由矮人工艺打造的微型塔盾，虽然只有手掌大小，却蕴含着大地之灵的庇护。受到攻击后，它会释放一层肉眼难见的能量护盾，为持有者争取喘息的时间。',
        apply: function () { /* 需调整 damageCooldown */ }
    },
    {
        id: 6,
        name: '荆棘甲',
        desc: '被怪物触碰时反弹 1 点伤害',
        story: '这件内甲上布满了细小的荆棘刺，看似简陋却附有自然的复仇之力。任何胆敢触碰穿戴者的敌人，都会被荆棘的反噬之力所伤。',
        apply: function () { /* 效果在碰撞伤害时触发 */ }
    },
    {
        id: 7,
        name: '疾风之羽',
        desc: '子弹飞行速度 +3',
        story: '一根来自天空巨鹰的尾羽，轻盈得几乎没有重量。将它别在武器上，子弹便如同乘风而行，划破长空的速度令敌人无从闪避。',
        apply: function () { /* 需调整子弹速度 */ }
    },
    {
        id: 8,
        name: '巨人药剂',
        desc: '角色体积略微变大',
        story: '一瓶冒着气泡的浑浊药水，标签上画着夸张的肌肉图案。喝下它的人会感受到一股膨胀的力量，身躯也随之变得更加魁梧——虽然效果只是暂时的，但对战斗的帮助不可小觑。',
        apply: function () { /* 需调整 scale */ }
    },
    {
        id: 9,
        name: '磁铁护符',
        desc: '自动拾取掉落物范围增大',
        story: '一块天然的磁石打磨成的护符，对金属以外的物质也有奇异的吸引力。佩戴它的人仿佛拥有了无形的引力场，散落的物品会自动向手心聚拢。',
        apply: function () { /* 效果在拾取判定时触发 */ }
    },
    {
        id: 10,
        name: '分身之镜',
        desc: '每次射击多发射一颗子弹',
        story: '一面刻着对称符文的银镜，映出的不是倒影而是另一个自己。当持有者扣动扳机时，镜子中的幻影也会做出相同的动作，让子弹凭空多出一颗。',
        apply: function () { /* 效果在 shoot 时触发 */ }
    },
    {
        id: 11,
        name: '冰霜之心',
        desc: '所有怪物移动速度降低 30%',
        story: '一颗永远寒冷的蓝宝石，散发着淡淡的冰雾。据说它来自极北冰原深处的万年冰窟，散发的寒气能让敌人的关节僵硬、行动迟缓。',
        apply: function () { /* 需修改怪物 speed */ }
    },
    {
        id: 12,
        name: '凤凰羽毛',
        desc: '死亡时复活一次（恢复 50% 生命）',
        story: '一根金红交织的华丽羽毛，在黑暗中会隐隐发光。传说凤凰在烈火中涅槃重生，而这根羽毛承载了它的一缕不朽之力——在持有者濒死之际，燃起重生之火。',
        apply: function () { /* 效果在玩家死亡时触发 */ }
    },
    {
        id: 13,
        name: '暴击之星',
        desc: '15% 概率造成双倍伤害',
        story: '一颗五角星形状的奇异宝石，边缘锐利如刃。它的星光忽明忽暗，仿佛在低语着运气的秘密。佩戴它的人偶尔会在攻击时爆发出远超平日的力量。',
        apply: function () { /* 效果在 takeDamage 时触发 */ }
    },
    {
        id: 14,
        name: '幸运草',
        desc: '怪物掉落物数量翻倍',
        story: '一株保存完好的四叶草标本，被封印在透明的琥珀中。四叶草是幸运的象征，拥有它的人会发现敌人在倒下后留下的战利品比平时多得多。',
        apply: function () { /* 效果在 spawnDrop 时触发 */ }
    },
    {
        id: 15,
        name: '重力石',
        desc: '跳跃高度降低，但滞空时间更长',
        story: '一块来自天外的陨铁，漆黑如夜却轻得令人意外。它扭曲了周围的引力场，让持有者的身体变得轻盈飘逸，每一次腾空都如同在月球上漫步。',
        apply: function () { /* 需调整 jumpPower 和 gravity */ }
    },
    {
        id: 16,
        name: '圣光之戒',
        desc: '每进入新关卡恢复 5 点生命',
        story: '一枚散发着柔和白光的戒指，戒面镶嵌着一颗纯洁无瑕的钻石。它曾属于一位以治愈之力闻名大陆的圣骑士，佩戴者踏入新的领域时，会感受到神圣的祝福抚平伤口。',
        apply: function () { /* 效果在 refreshMap 时触发 */ }
    },
    {
        id: 17,
        name: '猎人印记',
        desc: '对满血怪物造成的伤害翻倍',
        story: '猎人行会颁发的精英徽章，上面刻着一只瞄准猎物的鹰。佩戴这枚徽章的人会获得猎人的直觉——在敌人毫无防备时，一击制胜。',
        apply: function () { /* 效果在 takeDamage 时触发 */ }
    },
    {
        id: 18,
        name: '金币袋',
        desc: '每关额外获得一个随机掉落物',
        story: '一个沉甸甸的小布袋，虽然看起来不大，里面却装满了来自各个世界的奇珍异宝。每当你征服一个关卡，袋子就会自动吐出一份意外的惊喜。',
        apply: function () { /* 效果在怪物全灭时触发 */ }
    },
    {
        id: 19,
        name: '缩小卷轴',
        desc: '所有怪物体型缩小 20%',
        story: '一卷泛黄的羊皮纸，上面画着令人费解的几何图案。据说这是某个疯狂法师的遗作——念出上面的咒语后，所有敌对生物都会在视觉中缩小，虽然它们的实力并未改变，但心理上的优势足以扭转战局。',
        apply: function () { /* 需修改怪物元素样式 */ }
    },
    {
        id: 20,
        name: '不朽之盾',
        desc: '每次受伤最多损失 1 点生命',
        story: '一面由星辰铁锻造的神话级盾牌，盾面上铭刻着"不朽"二字。它是远古诸神赐予凡人的终极守护——无论敌人多么强大，每一次攻击造成的伤害都被限制在最小的范围内。',
        apply: function () { /* 效果在碰撞伤害时触发 */ }
    }
];

// ================= 遗物查找工具 =================
function getRelicById(id) {
    return RELICS.find(r => r.id === id);
}

// ================= 遗物选取逻辑 =================

// 从遗物池中随机抽取 count 个（排除已获得的）
function getRandomRelics(count = 3) {
    const pool = RELICS.filter(r => !selectedRelics.includes(r.id));
    if (pool.length <= count) return [...pool];

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
    selectedRelics.push(relic.id);

    if (typeof relic.apply === 'function') {
        relic.apply();
    }

    screen.classList.remove('active');
    screen.classList.add('hidden');
    isRelicSelecting = false;

    createPortal();
}

function clearRelics() {
    selectedRelics = [];
    isRelicSelecting = false;
}
