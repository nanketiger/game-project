// ================= 遗物系统 =================

// 遗物全局状态
let selectedRelics = [];       // 本局已获得的遗物 ID 列表
let isRelicSelecting = false; // 是否正在显示遗物选择界面

// ================= 20个遗物定义 =================
const RELICS = [
    {
        //很多遗物的function实现还没写，而且遗物名字功能都是乱写的，可以随意更改
        id: 1,
        name: '大口径枪口',
        desc: '子弹伤害 ×4',
        icon: 'images/遗物图标/1大口径枪管.png',
        story: '一根经过精密锻造的强化枪管，内壁刻有螺旋膛线，比普通枪管粗了整整一圈。将它替换到武器上后，子弹在膛内获得更长的加速距离和更高的膛压，出膛时的动能被放大数倍——命中目标的瞬间，威力如同被巨锤砸中。',
        apply: function () { bulletDamage *= 4; }
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
        name: '吸血芯片',
        desc: '击杀怪物恢复 1 点生命',
        icon: 'images/遗物图标/3吸血芯片.png',
        story: '一枚植入式生物芯片，表面密布着微小的纳米针管。当佩戴者击杀敌人时，芯片会瞬间释放电脉冲激活血液中的纳米机器人，将敌人的残余生命力转化为使用者的自愈能量。',
        apply: function () { /* 效果在 monster.takeDamage 死亡时触发 */ }
    },
    {
        id: 4,
        name: '时空碎片',
        desc: '射击间隔减少 150ms',
        icon: 'images/遗物图标/4时空碎片.png',
        story: '一块散发着淡蓝色荧光的晶体碎片，触摸时周围的空气会微微扭曲。它是某个破裂时空装置的残骸——持有者周围的时间流速略微加快，使得拉栓、装填、瞄准的动作比常人快了整整一拍。',
        apply: function () { shootCooldown = Math.max(100, shootCooldown - 150); }
    },
    {
        id: 5,
        name: '铁壁护盾',
        desc: '受伤后无敌时间翻倍',
        icon: 'images/遗物图标/5铁壁护盾.png',
        story: '一面由矮人工艺打造的微型塔盾，虽然只有手掌大小，却蕴含着大地之灵的庇护。受到攻击后，它会释放一层肉眼难见的能量护盾，为持有者争取喘息的时间。',
        apply: function () { damageCooldown *= 2; }
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
        name: '收获钩锁',
        desc: '自动拾取掉落物范围增大',
        icon: 'images/遗物图标/9收获钩锁.png',
        story: '一把带有能量牵引装置的便携钩锁，能够发射无形的引力光束。当使用者靠近战利品时，钩锁会自动射出磁化绳索将物品拉回——再也不用冒着危险冲进敌群中去捡东西了。',
        apply: function () { /* 效果在 loop 拾取判定时增大检测范围 */ }
    },
    {
        id: 10,
        name: '双射管',
        desc: '每次射击多发射一颗子弹',
        icon: 'images/遗物图标/10双射管.png',
        story: '一种特殊的Y形枪管附件，能将单发子弹在出膛前分裂为两枚独立的弹丸。内部精密的导流槽确保两枚子弹保持相同的弹道和速度。虽然增加了弹药消耗，但双倍的弹幕意味着双倍的压制力。',
        apply: function () { /* 效果在 shoot 时触发，检查 selectedRelics.includes(10) */ }
    },
    {
        id: 11,
        name: '冰霜核心',
        desc: '所有怪物移动速度降低 30%',
        icon: 'images/遗物图标/11冰霜核心.png',
        story: '一个拳头大小的球形装置，核心处有一颗不断旋转的蓝色晶体，散发着刺骨的寒气。启动后它会持续释放低温能量场，周围的空气瞬间凝结成白雾——敌人的关节在这极寒中变得迟缓僵硬，行动速度大幅降低。',
        apply: function () {
            monsters.forEach(m => { m.speed *= 0.7; });
        }
    },
    {
        id: 12,
        name: '重启芯片',
        desc: '死亡时复活一次（恢复 50% 生命）',
        icon: 'images/遗物图标/12重启芯片.png',
        story: '一枚嵌在微型电路板上的银色芯片，表面蚀刻着不断循环的箭头图案。它是某个失落科技的遗存——当持有者生命体征消失的瞬间，芯片会释放出强大的纳米修复脉冲，将肉体从崩溃边缘拉回。但每枚芯片的能量只够使用一次。',
        apply: function () { hasRevive = true; }
    },
    {
        id: 13,
        name: '暴击之芯',
        desc: '15% 概率造成双倍伤害',
        icon: 'images/遗物图标/13暴击之芯.png',
        story: '一颗不稳定的能量核心，内部涌动着躁动的红色脉冲光。每次射击时它都有小概率释放出一股失控的能量洪流，让子弹的破坏力瞬间翻倍——虽然触发不稳定，但一旦发动就是一记毁灭性的打击。',
        apply: function () { /* 效果在 shoot 击中时触发 */ }
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
        name: '无人机',
        desc: '滞空时间更长',
        icon: 'images/遗物图标/15无人机.png',
        story: '一架巴掌大小的微型无人机，配备了反重力推进器。它会自动悬浮在使用者身旁，持续投射一个重力抵消力场——虽然不会让你跳得更高，但每一次腾空后都能像羽毛般缓缓飘落。',
        apply: function () { gravity = Math.max(0.05, gravity - 0.15); }
    },
    {
        id: 16,
        name: '治疗仪',
        desc: '每进入新关卡恢复 5 点生命',
        icon: 'images/遗物图标/16治疗仪.png',
        story: '一台便携式医疗设备，外壳上有一个醒目的红十字标记。它能自动检测使用者的生命体征，在进入新环境时释放一股温和的再生射线，加速细胞分裂和伤口愈合。虽然单次治疗量有限，但在漫长的冒险中能持续提供稳定的恢复。',
        apply: function () { /* 效果在 refreshMap 时触发，检查 selectedRelics.includes(16) */ }
    },
    {
        id: 17,
        name: '瞄准镜',
        desc: '对满血怪物造成的伤害翻倍',
        icon: 'images/遗物图标/17瞄准镜.png',
        story: '一个全息投影战术瞄准镜，能自动扫描敌人的生物特征并在视野中标出薄弱环节。当敌人处于完好状态时，瞄准镜会高亮其致命弱点——第一枪精准命中要害，造成的伤害远超普通射击。',
        apply: function () { /* 效果在 takeDamage 时触发，满血怪物受双倍伤害 */ }
    },
    {
        id: 18,
        name: '刷新遥控',
        desc: '之后每次遗物选择可以重投一次',
        icon: 'images/遗物图标/18刷新遥控.png',
        story: '一个带有红色大按钮的遥控器，按钮上方印着"REFRESH"字样。按下按钮的瞬间，遥控器会发射一道量子纠缠信号，扭曲因果律使得眼前的选择被重新排列——机会从来不止一次，但记得只能用一次。',
        apply: function () { /* 效果在 showRelicSelection 时提供重投按钮 */ }
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
            <div class="relic-reroll" id="relic-reroll" style="display:none;">
                <button id="reroll-btn" class="start-button">重投一次</button>
            </div>
        </div>
    `;
    document.body.appendChild(screen);
    return screen;
}

function renderRelicCards(picks, screen) {
    const cardsContainer = document.getElementById('relic-cards');
    cardsContainer.innerHTML = '';
    picks.forEach(relic => {
        const card = document.createElement('div');
        card.className = 'relic-card';
        const iconHtml = relic.icon
            ? `<img class="relic-icon-img" src="${relic.icon}" alt="${relic.name}">`
            : `<div class="relic-icon">${relic.name.charAt(0)}</div>`;
        card.innerHTML = `
            ${iconHtml}
            <div class="relic-name">${relic.name}</div>
            <div class="relic-desc">${relic.desc}</div>
        `;
        card.addEventListener('click', () => selectRelic(relic, screen));
        cardsContainer.appendChild(card);
    });
}

function showRelicSelection() {
    isRelicSelecting = true;

    let screen = document.getElementById('relic-screen');
    if (!screen) screen = createRelicSelectionUI();

    const picks = getRandomRelics(3);
    renderRelicCards(picks, screen);

    // 刷新遥控：显示重投按钮
    const rerollDiv = document.getElementById('relic-reroll');
    if (rerollDiv && selectedRelics.includes(18)) {
        rerollDiv.style.display = 'block';
        const rerollBtn = document.getElementById('reroll-btn');
        rerollBtn.onclick = () => {
            const newPicks = getRandomRelics(3);
            renderRelicCards(newPicks, screen);
            rerollDiv.style.display = 'none'; // 只能重投一次
        };
    } else if (rerollDiv) {
        rerollDiv.style.display = 'none';
    }

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
