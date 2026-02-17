// ============================================================
// Configuration & Data Constants
// ============================================================

export const CONFIG = {
    bg: '#990000', // Crimson
    glowRed: '#FF2D2D',
    glowGold: '#FFD700',
    glowGreen: '#00FF9F',
    // Transition durations (ms) — spec families: 250, 450, 900
    scatterDur: 450,
    scrambleDur: 900,
    convergeDur: 450,
    settleDur: 250,
    // Draw phase: seconds before 福 bursts into particles
    fuExplodeDelay: 2.0,
    // Draw phase: independent timing controls (seconds)
    fuRiseDuration: 0.8,
    fuShrinkDuration: 0.8,
    fuShrinkEndScale: 0.18,
    // Draw camera timing (seconds): quick pullback, then hold until burst
    fuCameraPullbackDuration: 0.45,
    fuCameraReturnDuration: 0.7,
    // Firework shell rise time (seconds) before burst
    shellRiseDuration: 2.5,
};

export const LUCKY_CHARS_BY_DENSITY = [
    ' ', '·', '一', '人', '十', '大', '吉', '平', '安', '和',
    '春', '利', '兴', '旺', '发', '金', '贵', '富', '财', '寿',
    '禄', '喜', '龙', '凤', '福',
];

export const ALL_LUCKY = '福禄寿喜财富贵发金玉宝余丰盛利旺隆昌兴进安康宁泰和平顺健乐欢庆禧祺嘉春德善仁义忠信孝慧恩爱合圆满美馨雅吉祥瑞如意祝运龙凤麟鹤华成升登高';

export const CHAR_BLESSINGS = {
    '一': { phrase: '一帆风顺', english: 'Smooth sailing in all endeavors' },
    '人': { phrase: '人寿年丰', english: 'Long life and abundant harvests' },
    '十': { phrase: '十全十美', english: 'Perfection in every way' },
    '大': { phrase: '大吉大利', english: 'Great luck and great profit' },
    '吉': { phrase: '吉祥如意', english: 'Good fortune as you wish' },
    '平': { phrase: '四季平安', english: 'Peace through all four seasons' },
    '安': { phrase: '岁岁平安', english: 'Peace and safety year after year' },
    '和': { phrase: '和气生财', english: 'Harmony brings prosperity' },
    '春': { phrase: '春风得意', english: 'Success on the spring breeze' },
    '利': { phrase: '开岁大利', english: 'Great profit in the new year' },
    '兴': { phrase: '兴旺发达', english: 'Flourishing and thriving' },
    '旺': { phrase: '人丁兴旺', english: 'A growing and prosperous family' },
    '发': { phrase: '恭喜发财', english: 'Wishing you great prosperity' },
    '金': { phrase: '金玉满堂', english: 'Gold and jade fill the hall' },
    '贵': { phrase: '荣华富贵', english: 'Glory, splendor, and riches' },
    '富': { phrase: '富贵有余', english: 'Wealth and abundance to spare' },
    '财': { phrase: '财源广进', english: 'Wealth flowing from all directions' },
    '寿': { phrase: '福寿双全', english: 'Both blessings and longevity' },
    '禄': { phrase: '高官厚禄', english: 'High rank and generous reward' },
    '喜': { phrase: '双喜临门', english: 'Double happiness at the door' },
    '龙': { phrase: '龙马精神', english: 'The vigor of dragons and horses' },
    '凤': { phrase: '龙凤呈祥', english: 'Dragon and phoenix bring fortune' },
    '福': { phrase: '福星高照', english: 'The star of fortune shines bright' },
};

export const CALLI_FONTS = [
    // Google Fonts
    '"Zhi Mang Xing"',              // 指芒星 — running script
    '"Liu Jian Mao Cao"',           // 柳建毛草 — grass script
    '"Ma Shan Zheng"',              // 马善政 — bold brush
    // Chinese Webfont Project (中文网字计划)
    '"TsangerZhoukeZhengdabangshu"', // 仓耳周珂正大榜书 — banner calligraphy
    '"hongleixingshu"',              // 鸿雷行书简体 — running script
    '"qiantubifengshouxieti"',       // 千图笔锋手写体 — brush stroke
    '"峄山碑篆体"',                    // 峄山碑篆体 — seal script
];

export const FONT_DISPLAY_NAMES = [
    '指芒星',
    '柳建毛草',
    '马善政',
    '仓耳周珂正大榜书',
    '鸿雷行书简体',
    '千图笔锋手写体',
    '峄山碑篆体',
];

export const BLESSING_CATEGORIES = [
    { chars: '福禄寿喜财', r: 255, g: 45, b: 45 },         // 五福 — red
    { chars: '财富贵发金玉宝余丰盛利旺', r: 255, g: 215, b: 0 }, // Wealth — gold
    { chars: '安康宁泰和平顺健', r: 0, g: 255, b: 159 },    // Peace — jade
    { chars: '喜乐欢庆禧祺嘉春', r: 255, g: 120, b: 80 },   // Joy — warm
    { chars: '德善仁义忠信孝慧恩', r: 255, g: 200, b: 50 },  // Virtue — amber
    { chars: '爱合圆满美馨雅', r: 255, g: 130, b: 180 },     // Love — pink
    { chars: '吉祥瑞如意祝运', r: 180, g: 255, b: 80 },      // Auspicious — lime
    { chars: '龙凤麟鹤华', r: 255, g: 180, b: 50 },          // Mythical — orange
    { chars: '成升登高', r: 80, g: 220, b: 255 },             // Achievement — cyan
];

export const SCENE_FOV = 500;
export const ATLAS_COLS = 20;
export const ATLAS_ROWS = 20;
export const CELL_PX = 64;
