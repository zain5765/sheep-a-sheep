# Cow a Cow

Same core game as the viral stack-match hit: Level 1 easy → Level 2 hell, 7-slot match-3, share-for-props, ad revive.

## Play

```bash
nvm use 22
npm install
npm run dev
```

## Android

`release/CowACow-debug.apk`

```bash
nvm use 22
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
npm run android:apk
```

## Same mission checklist

- [x] Stacked tiles, only top clickable  
- [x] 7-slot tray, match 3  
- [x] Level 1 kindergarten → Level 2 ~0.1%  
- [x] Left + right side piles on Level 2  
- [x] Dense L2 “villa” center bias  
- [x] Undo / Shuffle / Remove via share unlock (Capacitor Share)  
- [x] Ad / share revive (1×)  
- [x] First-play tutorial  
- [x] Haptics on native  
- [x] Country → province / state teams  
- [x] Farm doodle tile icons + FX + SFX  
- [x] EN / 简体中文  
- [x] Daily challenge (date-seeded hell board)  
- [x] Friend challenge share link (`#c=…`)  
- [x] Ad revive hook (mock + AdMob-ready)  

Reference: [羊了个羊 on TapTap](https://www.taptap.cn/app/238441)
