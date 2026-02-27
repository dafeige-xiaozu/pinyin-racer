const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ============================
// 声母韵母启蒙数据（第一关）
// ============================
const letterData = [
  // 声母 (23个)
  { type: 'shm', letter: 'b',  sound: '波', image: '📻', word: '广播', desc: '广播的 b' },
  { type: 'shm', letter: 'p',  sound: '坡', image: '🍎', word: '苹果', desc: '苹果的 p' },
  { type: 'shm', letter: 'm',  sound: '摸', image: '🐱', word: '猫咪', desc: '猫咪的 m' },
  { type: 'shm', letter: 'f',  sound: '佛', image: '🌬️', word: '大风', desc: '大风的 f' },
  { type: 'shm', letter: 'd',  sound: '得', image: '🥁', word: '打鼓', desc: '打鼓的 d' },
  { type: 'shm', letter: 't',  sound: '特', image: '🐰', word: '兔子', desc: '兔子的 t' },
  { type: 'shm', letter: 'n',  sound: '讷', image: '🐄', word: '牛牛', desc: '牛牛的 n' },
  { type: 'shm', letter: 'l',  sound: '勒', image: '🎺', word: '喇叭', desc: '喇叭的 l' },
  { type: 'shm', letter: 'g',  sound: '哥', image: '🕊️', word: '鸽子', desc: '鸽子的 g' },
  { type: 'shm', letter: 'k',  sound: '科', image: '🐸', word: '蝌蚪', desc: '蝌蚪的 k' },
  { type: 'shm', letter: 'h',  sound: '喝', image: '🦊', word: '狐狸', desc: '狐狸的 h' },
  { type: 'shm', letter: 'j',  sound: '鸡', image: '🐔', word: '小鸡', desc: '小鸡的 j' },
  { type: 'shm', letter: 'q',  sound: '七', image: '🎈', word: '气球', desc: '气球的 q' },
  { type: 'shm', letter: 'x',  sound: '西', image: '🍉', word: '西瓜', desc: '西瓜的 x' },
  { type: 'shm', letter: 'zh', sound: '知', image: '🕷️', word: '蜘蛛', desc: '蜘蛛的 zh' },
  { type: 'shm', letter: 'ch', sound: '吃', image: '🚂', word: '火车', desc: '火车的 ch' },
  { type: 'shm', letter: 'sh', sound: '师', image: '🦁', word: '狮子', desc: '狮子的 sh' },
  { type: 'shm', letter: 'r',  sound: '日', image: '☀️', word: '太阳', desc: '太阳的 r' },
  { type: 'shm', letter: 'z',  sound: '资', image: '✏️', word: '写字', desc: '写字的 z' },
  { type: 'shm', letter: 'c',  sound: '次', image: '🦔', word: '刺猬', desc: '刺猬的 c' },
  { type: 'shm', letter: 's',  sound: '思', image: '🌲', word: '松树', desc: '松树的 s' },
  { type: 'shm', letter: 'y',  sound: '衣', image: '👕', word: '衣服', desc: '衣服的 y' },
  { type: 'shm', letter: 'w',  sound: '屋', image: '🐌', word: '蜗牛', desc: '蜗牛的 w' },
  // 韵母 (6个基础韵母)
  { type: 'ym', letter: 'a',  sound: '啊', image: '😮', word: '啊', desc: '张大嘴巴 a' },
  { type: 'ym', letter: 'o',  sound: '哦', image: '⭕', word: '圆圈', desc: '嘴巴圆圆 o' },
  { type: 'ym', letter: 'e',  sound: '鹅', image: '🦢', word: '白鹅', desc: '白鹅的 e' },
  { type: 'ym', letter: 'i',  sound: '衣', image: '🐜', word: '蚂蚁', desc: '蚂蚁的 i' },
  { type: 'ym', letter: 'u',  sound: '乌', image: '🐦', word: '乌鸦', desc: '乌鸦的 u' },
  { type: 'ym', letter: 'ü',  sound: '鱼', image: '🐟', word: '小鱼', desc: '小鱼的 ü' },
];

// ============================
// 拼音赛车数据（第二关）
// ============================
const pinyinMap = {
  b:  ['a','o','i','u','ai','ei','ao','an','en','ang','eng','ia','ie','iao','ian','in','iang','ing'],
  p:  ['a','o','i','u','ai','ei','ao','ou','an','en','ang','eng','ia','ie','iao','ian','in','iang','ing'],
  m:  ['a','o','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ia','ie','iao','iu','ian','in','iang','ing'],
  f:  ['a','o','u','ei','ou','an','en','ang','eng'],
  d:  ['a','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ia','ie','iao','iu','ian','ing','ong','uo'],
  t:  ['a','e','i','u','ai','ao','ou','an','ang','eng','ia','ie','iao','ian','ing','ong','uo'],
  n:  ['a','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ia','ie','iao','iu','ian','in','iang','ing','ong','uo','ü','üe'],
  l:  ['a','e','i','u','ai','ei','ao','ou','an','ang','eng','ia','ie','iao','iu','ian','in','iang','ing','ong','uo','ü','üe'],
  g:  ['a','e','u','ai','ei','ao','ou','an','en','ang','eng','ong','ua','uo','uai','uan','un','uang'],
  k:  ['a','e','u','ai','ao','ou','an','en','ang','eng','ong','ua','uo','uai','uan','un','uang'],
  h:  ['a','e','u','ai','ei','ao','ou','an','en','ang','eng','ong','ua','uo','uai','uan','un','uang'],
  j:  ['i','ia','ie','iao','iu','ian','in','iang','ing','ü','üe','üan','ün'],
  q:  ['i','ia','ie','iao','iu','ian','in','iang','ing','ü','üe','üan','ün'],
  x:  ['i','ia','ie','iao','iu','ian','in','iang','ing','ü','üe','üan','ün'],
  zh: ['a','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ong','ua','uo','uai','uan','un','uang'],
  ch: ['a','e','i','u','ai','ao','ou','an','en','ang','eng','ong','ua','uo','uai','uan','un','uang'],
  sh: ['a','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ua','uo','uai','uan','un','uang'],
  r:  ['e','i','u','ao','ou','an','en','ang','eng','ong','ua','uo','uan','un'],
  z:  ['a','e','i','u','ai','ei','ao','ou','an','en','ang','eng','ong','ua','uo','uan','un'],
  c:  ['a','e','i','u','ai','ao','ou','an','en','ang','eng','ong','ua','uo','uan','un'],
  s:  ['a','e','i','u','ai','ao','ou','an','en','ang','eng','ong','ua','uo','uan','un'],
  y:  ['a','e','i','u','ao','ou','an','in','ang','ing','ong','uan','un','üe','üan'],
  w:  ['a','o','u','ai','ei','an','en','ang','eng'],
};

const allFinals = [
  'a','o','e','i','u','ü','ai','ei','ao','ou',
  'an','en','ang','eng','ong','ia','ie','iao','iu',
  'ian','in','iang','ing','iong','ua','uo','uai','uan',
  'un','uang','üe','üan','ün'
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 声母韵母数据接口（第一关）
app.get('/api/letters', (req, res) => {
  res.json(letterData);
});

// 拼音题目接口（第二关）
app.get('/api/pinyin', (req, res) => {
  const initials = Object.keys(pinyinMap);
  const initial = getRandomItem(initials);
  const validFinals = pinyinMap[initial];
  const correctFinal = getRandomItem(validFinals);

  const wrongFinals = [];
  const candidates = allFinals.filter(f => !validFinals.includes(f));
  while (wrongFinals.length < 2 && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    wrongFinals.push(candidates.splice(idx, 1)[0]);
  }

  const options = shuffle([correctFinal, ...wrongFinals]);

  res.json({
    initial,
    options,
    answer: correctFinal,
  });
});

app.listen(PORT, () => {
  console.log(`拼音赛车服务器已启动: http://localhost:${PORT}`);
});
