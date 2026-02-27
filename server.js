const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// 用户数据管理
// ============================
const USER_DATA_PATH = path.join(__dirname, 'user_data.json');

const defaultUserData = {
  level: 1,
  mastered: [],
  mistakes: [],
  currentSession: [],
  totalCorrect: 0,
  totalWrong: 0,
  // 新增：学习时长统计（单位：秒）
  time_spent: {
    level1: 0,
    level2: 0,
    level3: 0
  },
  // 新增：最佳答题速度记录
  bestTimes: {
    level2: [],
    level3: []
  }
};

function loadUserData() {
  try {
    if (fs.existsSync(USER_DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(USER_DATA_PATH, 'utf8'));
      // 确保新字段存在
      if (!data.time_spent) {
        data.time_spent = { level1: 0, level2: 0, level3: 0 };
      }
      if (!data.bestTimes) {
        data.bestTimes = { level2: [], level3: [] };
      }
      return data;
    }
  } catch (e) {
    console.error('读取用户数据失败:', e);
  }
  return { ...defaultUserData };
}

function saveUserData(data) {
  fs.writeFileSync(USER_DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// ============================
// 声母韵母数据
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

// 拼音组合数据（用于Level 2和3）
const syllables = [
  { initial: 'b', final: 'a', syllable: 'ba', sound: '八', word: '八' },
  { initial: 'b', final: 'o', syllable: 'bo', sound: '波', word: '波浪' },
  { initial: 'b', final: 'i', syllable: 'bi', sound: '笔', word: '铅笔' },
  { initial: 'b', final: 'u', syllable: 'bu', sound: '不', word: '不' },
  { initial: 'p', final: 'a', syllable: 'pa', sound: '怕', word: '害怕' },
  { initial: 'p', final: 'o', syllable: 'po', sound: '婆', word: '外婆' },
  { initial: 'p', final: 'i', syllable: 'pi', sound: '皮', word: '皮球' },
  { initial: 'p', final: 'u', syllable: 'pu', sound: '扑', word: '扑' },
  { initial: 'm', final: 'a', syllable: 'ma', sound: '妈', word: '妈妈' },
  { initial: 'm', final: 'o', syllable: 'mo', sound: '摸', word: '摸' },
  { initial: 'm', final: 'i', syllable: 'mi', sound: '米', word: '大米' },
  { initial: 'm', final: 'u', syllable: 'mu', sound: '木', word: '木头' },
  { initial: 'f', final: 'a', syllable: 'fa', sound: '发', word: '头发' },
  { initial: 'f', final: 'o', syllable: 'fo', sound: '佛', word: '佛' },
  { initial: 'f', final: 'u', syllable: 'fu', sound: '福', word: '幸福' },
  { initial: 'd', final: 'a', syllable: 'da', sound: '大', word: '大' },
  { initial: 'd', final: 'e', syllable: 'de', sound: '得', word: '得' },
  { initial: 'd', final: 'i', syllable: 'di', sound: '弟', word: '弟弟' },
  { initial: 'd', final: 'u', syllable: 'du', sound: '读', word: '读书' },
  { initial: 't', final: 'a', syllable: 'ta', sound: '他', word: '他' },
  { initial: 't', final: 'e', syllable: 'te', sound: '特', word: '特别' },
  { initial: 't', final: 'i', syllable: 'ti', sound: '提', word: '提' },
  { initial: 't', final: 'u', syllable: 'tu', sound: '图', word: '图画' },
  { initial: 'n', final: 'a', syllable: 'na', sound: '那', word: '那' },
  { initial: 'n', final: 'e', syllable: 'ne', sound: '呢', word: '呢' },
  { initial: 'n', final: 'i', syllable: 'ni', sound: '你', word: '你' },
  { initial: 'n', final: 'u', syllable: 'nu', sound: '努', word: '努力' },
  { initial: 'l', final: 'a', syllable: 'la', sound: '拉', word: '拉' },
  { initial: 'l', final: 'e', syllable: 'le', sound: '乐', word: '快乐' },
  { initial: 'l', final: 'i', syllable: 'li', sound: '梨', word: '梨' },
  { initial: 'l', final: 'u', syllable: 'lu', sound: '路', word: '马路' },
];

const allFinals = ['a', 'o', 'e', 'i', 'u', 'ü'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================
// API 接口
// ============================

// 获取所有字母数据
app.get('/api/letters', (req, res) => {
  res.json(letterData);
});

// 获取用户数据
app.get('/api/user-data', (req, res) => {
  res.json(loadUserData());
});

// 重置用户数据
app.post('/api/reset', (req, res) => {
  saveUserData({ ...defaultUserData });
  res.json({ success: true, message: '数据已重置' });
});

// 更新关卡
app.post('/api/set-level', (req, res) => {
  const { level } = req.body;
  if (level >= 1 && level <= 3) {
    const userData = loadUserData();
    userData.level = level;
    saveUserData(userData);
    res.json({ success: true, level });
  } else {
    res.status(400).json({ error: '无效的关卡' });
  }
});

// 新增：更新学习时长
app.post('/api/update-time', (req, res) => {
  const { level, seconds } = req.body;
  if (level >= 1 && level <= 3 && typeof seconds === 'number' && seconds > 0) {
    const userData = loadUserData();
    const levelKey = `level${level}`;
    userData.time_spent[levelKey] = (userData.time_spent[levelKey] || 0) + seconds;
    saveUserData(userData);
    res.json({ 
      success: true, 
      time_spent: userData.time_spent,
      totalTime: userData.time_spent.level1 + userData.time_spent.level2 + userData.time_spent.level3
    });
  } else {
    res.status(400).json({ error: '无效的参数' });
  }
});

// 智能获取任务
app.get('/api/get-task', (req, res) => {
  const userData = loadUserData();
  const level = parseInt(req.query.level) || userData.level;
  
  if (level === 1) {
    res.json({
      level: 1,
      type: 'flashcard',
      letters: letterData,
      mastered: userData.mastered
    });
  } 
  else if (level === 2) {
    let targetLetter;
    const mistakes = userData.mistakes.filter(m => m.level === 2);
    
    if (mistakes.length > 0 && Math.random() < 0.5) {
      const mistake = getRandomItem(mistakes);
      targetLetter = letterData.find(l => l.letter === mistake.letter);
    }
    
    if (!targetLetter) {
      targetLetter = getRandomItem(letterData);
    }
    
    let wrongLetter;
    const sameType = letterData.filter(l => l.type === targetLetter.type && l.letter !== targetLetter.letter);
    wrongLetter = getRandomItem(sameType);
    
    const options = shuffle([
      { letter: targetLetter.letter, correct: true },
      { letter: wrongLetter.letter, correct: false }
    ]);
    
    res.json({
      level: 2,
      type: 'balloon',
      targetSound: targetLetter.sound,
      targetLetter: targetLetter.letter,
      targetWord: targetLetter.word,
      options,
      isReview: mistakes.some(m => m.letter === targetLetter.letter),
      timeLimit: 10 // 10秒倒计时
    });
  }
  else if (level === 3) {
    const mistakes = userData.mistakes.filter(m => m.level === 3);
    let syllable;
    
    if (mistakes.length > 0 && Math.random() < 0.5) {
      const mistake = getRandomItem(mistakes);
      syllable = syllables.find(s => s.syllable === mistake.syllable);
    }
    
    if (!syllable) {
      syllable = getRandomItem(syllables);
    }
    
    const wrongFinals = allFinals
      .filter(f => f !== syllable.final)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    const options = shuffle([
      { final: syllable.final, correct: true },
      { final: wrongFinals[0], correct: false },
      { final: wrongFinals[1], correct: false }
    ]);
    
    res.json({
      level: 3,
      type: 'racing',
      initial: syllable.initial,
      targetFinal: syllable.final,
      syllable: syllable.syllable,
      sound: syllable.sound,
      word: syllable.word,
      options,
      isReview: mistakes.some(m => m.syllable === syllable.syllable),
      timeLimit: 15 // 15秒倒计时
    });
  }
});

// 提交答案（增加答题时间记录）
app.post('/api/submit-answer', (req, res) => {
  const { level, correct, letter, syllable, answerTime } = req.body;
  const userData = loadUserData();
  
  if (correct) {
    userData.totalCorrect++;
    if (level === 2) {
      userData.mistakes = userData.mistakes.filter(m => !(m.level === 2 && m.letter === letter));
      if (!userData.mastered.includes(letter)) {
        userData.mastered.push(letter);
      }
      // 记录最佳答题时间
      if (answerTime && answerTime > 0) {
        userData.bestTimes.level2.push({ letter, time: answerTime, timestamp: Date.now() });
        if (userData.bestTimes.level2.length > 50) {
          userData.bestTimes.level2 = userData.bestTimes.level2.slice(-50);
        }
      }
    } else if (level === 3) {
      userData.mistakes = userData.mistakes.filter(m => !(m.level === 3 && m.syllable === syllable));
      if (answerTime && answerTime > 0) {
        userData.bestTimes.level3.push({ syllable, time: answerTime, timestamp: Date.now() });
        if (userData.bestTimes.level3.length > 50) {
          userData.bestTimes.level3 = userData.bestTimes.level3.slice(-50);
        }
      }
    }
  } else {
    userData.totalWrong++;
    if (level === 2 && letter) {
      const exists = userData.mistakes.some(m => m.level === 2 && m.letter === letter);
      if (!exists) {
        userData.mistakes.push({ level: 2, letter, timestamp: Date.now() });
      }
    } else if (level === 3 && syllable) {
      const exists = userData.mistakes.some(m => m.level === 3 && m.syllable === syllable);
      if (!exists) {
        userData.mistakes.push({ level: 3, syllable, timestamp: Date.now() });
      }
    }
  }
  
  userData.currentSession.push({ level, correct, answerTime, timestamp: Date.now() });
  saveUserData(userData);
  
  res.json({ 
    success: true, 
    totalCorrect: userData.totalCorrect,
    totalWrong: userData.totalWrong,
    mistakesCount: userData.mistakes.length
  });
});

// 获取学习统计
app.get('/api/stats', (req, res) => {
  const userData = loadUserData();
  const totalTime = userData.time_spent.level1 + userData.time_spent.level2 + userData.time_spent.level3;
  
  res.json({
    time_spent: userData.time_spent,
    totalTime,
    totalCorrect: userData.totalCorrect,
    totalWrong: userData.totalWrong,
    accuracy: userData.totalCorrect + userData.totalWrong > 0 
      ? Math.round(userData.totalCorrect / (userData.totalCorrect + userData.totalWrong) * 100) 
      : 0,
    mastered: userData.mastered.length,
    mistakes: userData.mistakes.length
  });
});

// 启动服务器（仅在非测试环境下启动）
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🎮 拼音学习系统已启动: http://localhost:${PORT}`);
  });
}

// 导出供测试使用
module.exports = { app, loadUserData, saveUserData, defaultUserData, USER_DATA_PATH };
