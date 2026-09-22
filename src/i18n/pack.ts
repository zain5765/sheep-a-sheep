/** Sheep a Sheep UI strings — same pattern as Farmverse I18nPack: key → { en, zh }. */

export type LocaleCode = 'en' | 'zh';

export type I18nEntry = { en: string; zh: string };

export const PACK: Record<string, I18nEntry> = {
  // Brand — one title per locale (no mixed script on splash)
  'brand.title': { en: 'Sheep a Sheep', zh: '羊了个羊' },
  'brand.sub': { en: 'Sheep a Sheep', zh: '羊了个羊' },
  'splash.sub': {
    en: 'Level 1 kindergarten · Level 2 only 0.1% clear',
    zh: '第1关上幼儿园 · 第2关仅0.1%通关',
  },
  'splash.team_need': {
    en: 'Your province / state team needs you',
    zh: '你的省队需要你',
  },
  'splash.country': { en: '1. Country', zh: '1. 国家' },
  'splash.province': { en: '2. Province / State', zh: '2. 省份 / 州' },
  'splash.pick_country': { en: 'Pick your country…', zh: '请选择国家…' },
  'splash.pick_province': { en: 'Pick your province / state…', zh: '请选择省份 / 州…' },
  'splash.select_country_first': { en: 'Select country first…', zh: '请先选择国家…' },
  'splash.playing_for': { en: 'Playing for {0}, {1}', zh: '为 {0}（{1}）出战' },
  'splash.start': { en: 'Start Game', zh: '开始游戏' },
  'splash.ranks': { en: 'Province / State clears', zh: '省队通关榜' },
  'splash.challenge_friend': { en: 'Challenge a friend', zh: '挑战好友' },

  'daily.banner_title': { en: "Today's challenge", zh: '今日挑战' },
  'daily.banner_sub': {
    en: 'Same hell board for everyone · {0}',
    zh: '全网同一关地狱局 · {0}',
  },
  'daily.play': { en: 'Play daily', zh: '挑战今日' },
  'daily.cleared': { en: 'Cleared today ✓', zh: '今日已通关 ✓' },
  'daily.percent': { en: 'Only ~0.1% clear', zh: '仅约0.1%通关' },

  'challenge.invite_title': { en: 'Friend challenge!', zh: '好友挑战！' },
  'challenge.invite_body': {
    en: 'A friend sent you the same board. Pick your team, then accept.',
    zh: '好友发来同一关卡。先选省队，再接受挑战。',
  },
  'challenge.accept': { en: 'Accept challenge', zh: '接受挑战' },
  'challenge.decline': { en: 'Not now', zh: '暂不' },
  'challenge.need_team': {
    en: 'Select country and province first.',
    zh: '请先选择国家和省份。',
  },

  'win.daily.title': { en: 'Daily cleared!', zh: '今日挑战通关！' },
  'win.daily.body': {
    en: 'You beat today’s board. Challenge a friend with the same seed!',
    zh: '你过了今日关卡。用同一关卡挑战好友！',
  },
  'win.challenge.title': { en: 'Challenge cleared!', zh: '挑战成功！' },
  'win.challenge.body': {
    en: 'You cleared the shared board. Share your win!',
    zh: '你过了好友同关。分享战绩！',
  },
  'win.challenge_friend': { en: 'Challenge friend', zh: '挑战好友' },
  'win.pct': { en: 'Clear rate ~0.1%', zh: '通关率约 0.1%' },

  'mode.daily': { en: 'Daily', zh: '今日' },
  'mode.challenge': { en: 'Challenge', zh: '挑战' },

  'modal.pick_country_title': { en: 'Pick a country first', zh: '请先选择国家' },
  'modal.pick_country_body': {
    en: 'Choose your country, then your province / state team.',
    zh: '先选国家，再选你的省队。',
  },
  'modal.pick_province_title': { en: 'Pick a province / state', zh: '请选择省份 / 州' },
  'modal.pick_province_body': {
    en: 'Join your local team like the original province challenge.',
    zh: '加入本地球队，和原版省队挑战一样。',
  },
  'common.ok': { en: 'OK', zh: '好的' },
  'common.cancel': { en: 'Cancel', zh: '取消' },
  'common.close': { en: 'Close', zh: '关闭' },
  'common.home': { en: 'Home', zh: '回首页' },

  // Levels
  'level.1.name': { en: 'Level 1', zh: '第1关' },
  'level.1.sub': { en: 'Kindergarten', zh: '上幼儿园' },
  'level.2.name': { en: 'Level 2', zh: '第2关' },
  'level.2.sub': { en: 'Only 0.1% clear', zh: '仅0.1%通关' },

  // Props
  'prop.remove': { en: 'Remove', zh: '移出' },
  'prop.undo': { en: 'Undo', zh: '撤销' },
  'prop.shuffle': { en: 'Shuffle', zh: '洗牌' },
  'prop.share': { en: 'Share', zh: '分享' },
  'prop.unlock_title': { en: 'Share to unlock', zh: '分享解锁道具' },
  'prop.unlock_body': {
    en: 'Share with a friend to get 1× {0} (same rule as the original).',
    zh: '分享给好友可获得 1× {0}（和原版一样）。',
  },
  'prop.unlock_btn': { en: 'Share & unlock', zh: '分享并解锁' },

  // Win / lose
  'win.l1.title': { en: 'Level 1 cleared!', zh: '第1关通过！' },
  'win.l1.body': {
    en: 'Warm-up done. Level 2 is the real challenge.',
    zh: '热身结束。第2关才是考研难度。',
  },
  'win.l2.title': { en: 'Cleared Level 2!', zh: '通关！' },
  'win.l2.body': {
    en: 'Only ~0.1% of players make it here. Challenge a friend!',
    zh: '仅约0.1%的羊能到这里。去挑战朋友！',
  },
  'win.again': { en: 'Play again', zh: '再来一局' },
  'win.enter_l2': { en: 'Enter Level 2', zh: '进入第2关' },
  'win.replay_l1': { en: 'Replay Level 1', zh: '重玩第1关' },

  'lose.title': { en: 'Tray is full!', zh: '槽位满了！' },
  'lose.body': {
    en: 'Same as the original: 7 slots full = fail. Watch an ad or share to revive (moves 3 tiles out).',
    zh: '和原版一样：7格塞满就失败。可看广告复活，或分享后复活（移出3张）。',
  },
  'lose.ad': { en: 'Watch ad to revive', zh: '看广告复活' },
  'lose.share': { en: 'Share to revive', zh: '分享复活' },
  'lose.retry': { en: 'Try again', zh: '再试一次' },

  'ad.title': { en: 'Ad revive', zh: '广告复活' },
  'ad.body': {
    en: 'Watch the full ad to revive (moves 3 tiles to hold).',
    zh: '观看完整广告后复活（移出 3 张到暂存区）',
  },

  // Settings
  'settings.title': { en: 'Settings', zh: '设置' },
  'settings.hint': { en: 'Sound · Language · Restart', zh: '音效 · 语言 · 重开' },
  'settings.mute_on': { en: '🔇 Mute', zh: '🔇 静音' },
  'settings.mute_off': { en: '🔊 Sound on', zh: '🔊 开启音效' },
  'settings.language': { en: 'Language', zh: '语言' },
  'settings.lang.en': { en: 'English', zh: 'English' },
  'settings.lang.zh': { en: '简体中文', zh: '简体中文' },
  'settings.restart': { en: 'Restart level', zh: '重开本关' },
  'settings.home': { en: 'Home', zh: '回首页' },

  // Ranks
  'rank.title': { en: 'Province / State clears', zh: '省队通关榜' },
  'rank.sub': { en: '{0} local teams', zh: '{0} 本地球队' },
  'rank.sub_default': { en: 'Your province / state team needs you', zh: '你的省队需要你' },
  'rank.back': { en: 'Back Home', zh: '回首页' },

  // Tutorial
  'tut.tap.title': { en: 'Tap free tiles', zh: '点亮面牌' },
  'tut.tap.body': {
    en: 'Only uncovered tiles can be tapped. They fly into the tray below.',
    zh: '只能点没有被压住的牌。点中后会飞进下方卡槽。',
  },
  'tut.match.title': { en: 'Match 3 to clear', zh: '三消过关' },
  'tut.match.body': {
    en: 'The tray has 7 slots. Three matching icons clear. Fill it and you lose!',
    zh: '卡槽一共 7 格。凑齐 3 张相同图案就会消除。塞满就失败！',
  },
  'tut.props.title': { en: 'Props & revive', zh: '道具与复活' },
  'tut.props.body': {
    en: 'Remove / Undo / Shuffle: unlock by sharing. On fail, watch an ad to revive once.',
    zh: '移出 / 撤销 / 洗牌：分享后可用。失败可看广告复活一次。',
  },
  'tut.next': { en: 'Next', zh: '下一步' },
  'tut.start': { en: "Let's play!", zh: '开始玩！' },
  'tut.skip': { en: 'Skip', zh: '跳过' },

  // Share
  'share.title': { en: 'Sheep a Sheep', zh: '羊了个羊' },
  'share.text': {
    en: 'Can you clear Level 2 of Sheep a Sheep? Only 0.1% can!',
    zh: '羊了个羊第2关你过得了吗？仅0.1%通关！',
  },
  'share.dialog': { en: 'Share with friends', zh: '分享给好友' },
  'share.challenge_text': {
    en: 'Beat this Sheep a Sheep board — same tiles as me! {0}',
    zh: '来挑战同一关羊了个羊！和我一样的牌面 {0}',
  },

  // A11y
  'a11y.home': { en: 'Home', zh: '首页' },
  'a11y.settings': { en: 'Settings', zh: '设置' },
  'a11y.country': { en: 'Country', zh: '国家' },
  'a11y.province': { en: 'Province or State', zh: '省份或州' },

  // Tile a11y labels
  'tile.sheep': { en: 'Sheep', zh: '羊' },
  'tile.flower': { en: 'Flower', zh: '花' },
  'tile.tree': { en: 'Tree', zh: '树' },
  'tile.grass': { en: 'Grass', zh: '草' },
  'tile.mushroom': { en: 'Mushroom', zh: '蘑菇' },
  'tile.carrot': { en: 'Carrot', zh: '胡萝卜' },
  'tile.cabbage': { en: 'Cabbage', zh: '白菜' },
  'tile.corn': { en: 'Corn', zh: '玉米' },
  'tile.bell': { en: 'Bell', zh: '铃铛' },
  'tile.paw': { en: 'Paw', zh: '爪印' },
  'tile.bone': { en: 'Bone', zh: '骨头' },
  'tile.wool': { en: 'Wool', zh: '毛线' },
  'tile.apple': { en: 'Apple', zh: '苹果' },
  'tile.leaf': { en: 'Leaf', zh: '叶子' },
  'tile.sun': { en: 'Sun', zh: '太阳' },
};
