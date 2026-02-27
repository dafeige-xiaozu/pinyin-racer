/**
 * 拼音赛车 - 前端逻辑单元测试
 * 测试倒计时、时长统计等关键算法
 */

// ============================================================
// Mock 环境设置 - speechSynthesis 模拟
// ============================================================
const mockSpeechSynthesis = {
  speaking: false,
  paused: false,
  pending: false,
  onvoiceschanged: null,
  _utterances: [],
  
  speak: jest.fn(function(utterance) {
    this._utterances.push(utterance);
    this.speaking = true;
    // 模拟异步语音播放
    setTimeout(() => {
      this.speaking = false;
      if (utterance.onend) utterance.onend();
    }, 100);
  }),
  
  cancel: jest.fn(function() {
    this.speaking = false;
    this._utterances = [];
  }),
  
  pause: jest.fn(function() {
    this.paused = true;
  }),
  
  resume: jest.fn(function() {
    this.paused = false;
  }),
  
  getVoices: jest.fn(() => [
    { lang: 'zh-CN', name: 'Chinese (Simplified)' },
    { lang: 'en-US', name: 'English (US)' }
  ])
};

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'zh-CN';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.onend = null;
    this.onerror = null;
  }
}

// 全局设置 Mock
global.speechSynthesis = mockSpeechSynthesis;
global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

// Mock window 对象
global.window = {
  speechSynthesis: mockSpeechSynthesis
};

// ============================================================
// 前端逻辑函数提取（用于独立测试）
// ============================================================

/**
 * 倒计时管理器类
 * 从前端逻辑中提取的核心计时功能
 */
class CountdownTimer {
  constructor(duration, onTick, onTimeout) {
    this.duration = duration;
    this.timeRemaining = duration;
    this.onTick = onTick || (() => {});
    this.onTimeout = onTimeout || (() => {});
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.timeRemaining = this.duration;
    
    this.intervalId = setInterval(() => {
      this.timeRemaining -= 0.1;
      this.timeRemaining = Math.round(this.timeRemaining * 10) / 10; // 防止浮点数精度问题
      
      this.onTick(this.timeRemaining);
      
      if (this.timeRemaining <= 0) {
        this.stop();
        this.onTimeout();
      }
    }, 100);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  reset() {
    this.stop();
    this.timeRemaining = this.duration;
  }

  getTimeRemaining() {
    return this.timeRemaining;
  }
}

/**
 * 关卡时长统计器
 * 从前端逻辑中提取的时长计算功能
 */
class LevelTimeTracker {
  constructor() {
    this.startTime = null;
    this.accumulatedTime = 0;
  }

  startLevel() {
    this.startTime = Date.now();
  }

  endLevel() {
    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.accumulatedTime += elapsed;
      this.startTime = null;
      return elapsed;
    }
    return 0;
  }

  getCurrentElapsed() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  getAccumulatedTime() {
    return this.accumulatedTime;
  }

  reset() {
    this.startTime = null;
    this.accumulatedTime = 0;
  }
}

/**
 * 格式化时间为 分:秒 格式
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 计算火花强度（基于答题速度）
 */
function calculateSparkIntensity(answerTime, maxTime = 15) {
  return Math.max(1, Math.min(3, Math.floor((maxTime - answerTime) / 5) + 1));
}

// ============================================================
// 测试点 1：倒计时功能测试
// ============================================================
describe('CountdownTimer - 倒计时功能', () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('10秒倒计时结束时触发 onTimeout 回调', () => {
    const failCallback = jest.fn();
    const timer = new CountdownTimer(10, null, failCallback);
    
    timer.start();
    
    // 快进 10 秒（10000ms）
    jest.advanceTimersByTime(10000);
    
    expect(failCallback).toHaveBeenCalledTimes(1);
    expect(timer.isRunning).toBe(false);
  });

  test('倒计时每 100ms 更新一次', () => {
    const tickCallback = jest.fn();
    const timer = new CountdownTimer(10, tickCallback);
    
    timer.start();
    
    // 快进 1 秒
    jest.advanceTimersByTime(1000);
    
    // 1秒 = 10 次 tick（每 100ms 一次）
    expect(tickCallback).toHaveBeenCalledTimes(10);
  });

  test('手动停止倒计时后不再触发回调', () => {
    const failCallback = jest.fn();
    const timer = new CountdownTimer(10, null, failCallback);
    
    timer.start();
    
    // 快进 5 秒
    jest.advanceTimersByTime(5000);
    
    // 手动停止
    timer.stop();
    
    // 再快进 10 秒
    jest.advanceTimersByTime(10000);
    
    // failCallback 不应被调用
    expect(failCallback).not.toHaveBeenCalled();
  });

  test('timeRemaining 正确递减', () => {
    const timer = new CountdownTimer(10);
    timer.start();
    
    jest.advanceTimersByTime(3000); // 3 秒
    
    // 允许小的浮点数误差
    expect(timer.getTimeRemaining()).toBeCloseTo(7, 1);
  });

  test('15秒倒计时（Level 3）正常工作', () => {
    const failCallback = jest.fn();
    const timer = new CountdownTimer(15, null, failCallback);
    
    timer.start();
    
    // 14秒时不应触发
    jest.advanceTimersByTime(14000);
    expect(failCallback).not.toHaveBeenCalled();
    
    // 15秒时触发
    jest.advanceTimersByTime(1000);
    expect(failCallback).toHaveBeenCalledTimes(1);
  });

  test('倒计时到达警告阈值（<3秒）', () => {
    const tickCallback = jest.fn();
    const timer = new CountdownTimer(10, tickCallback);
    
    timer.start();
    
    // 快进到剩余 3 秒
    jest.advanceTimersByTime(7000);
    
    expect(timer.getTimeRemaining()).toBeCloseTo(3, 1);
    
    // 验证警告状态可以被检测
    const isWarning = timer.getTimeRemaining() <= 3;
    expect(isWarning).toBe(true);
  });
});

// ============================================================
// 测试点 2：时长统计测试
// ============================================================
describe('LevelTimeTracker - 关卡时长统计', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('正确计算关卡停留时间', () => {
    const tracker = new LevelTimeTracker();
    
    tracker.startLevel();
    
    // 模拟停留 30 秒
    jest.advanceTimersByTime(30000);
    
    const elapsed = tracker.endLevel();
    
    expect(elapsed).toBeCloseTo(30, 1);
  });

  test('关卡切换时时间差值准确', () => {
    const tracker = new LevelTimeTracker();
    
    // 第一次进入关卡
    tracker.startLevel();
    jest.advanceTimersByTime(15000); // 15 秒
    const time1 = tracker.endLevel();
    
    // 第二次进入关卡
    tracker.startLevel();
    jest.advanceTimersByTime(25000); // 25 秒
    const time2 = tracker.endLevel();
    
    expect(time1).toBeCloseTo(15, 1);
    expect(time2).toBeCloseTo(25, 1);
    expect(tracker.getAccumulatedTime()).toBeCloseTo(40, 1);
  });

  test('getCurrentElapsed 实时返回当前时间', () => {
    const tracker = new LevelTimeTracker();
    
    tracker.startLevel();
    
    jest.advanceTimersByTime(5000);
    expect(tracker.getCurrentElapsed()).toBeCloseTo(5, 1);
    
    jest.advanceTimersByTime(5000);
    expect(tracker.getCurrentElapsed()).toBeCloseTo(10, 1);
  });

  test('未开始时返回 0', () => {
    const tracker = new LevelTimeTracker();
    
    expect(tracker.getCurrentElapsed()).toBe(0);
    expect(tracker.endLevel()).toBe(0);
  });

  test('reset 正确清零', () => {
    const tracker = new LevelTimeTracker();
    
    tracker.startLevel();
    jest.advanceTimersByTime(10000);
    tracker.endLevel();
    
    tracker.reset();
    
    expect(tracker.getAccumulatedTime()).toBe(0);
    expect(tracker.getCurrentElapsed()).toBe(0);
  });
});

// ============================================================
// 辅助函数测试
// ============================================================
describe('辅助函数测试', () => {
  test('formatTime 正确格式化时间', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(30)).toBe('0:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(125)).toBe('2:05');
  });

  test('calculateSparkIntensity 基于答题速度计算', () => {
    // 快速答题（<5秒）= 强度 3
    expect(calculateSparkIntensity(2)).toBe(3);
    expect(calculateSparkIntensity(4)).toBe(3);
    
    // 中速答题（5-10秒）= 强度 2
    expect(calculateSparkIntensity(6)).toBe(2);
    expect(calculateSparkIntensity(9)).toBe(2);
    
    // 慢速答题（>10秒）= 强度 1
    expect(calculateSparkIntensity(11)).toBe(1);
    expect(calculateSparkIntensity(14)).toBe(1);
  });
});

// ============================================================
// Mock speechSynthesis 测试
// ============================================================
describe('speechSynthesis Mock 测试', () => {
  beforeEach(() => {
    mockSpeechSynthesis.cancel();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
  });

  test('speechSynthesis.speak 被正确调用', () => {
    const utterance = new SpeechSynthesisUtterance('你好');
    speechSynthesis.speak(utterance);
    
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(mockSpeechSynthesis._utterances.length).toBe(1);
    expect(mockSpeechSynthesis._utterances[0].text).toBe('你好');
  });

  test('speechSynthesis.cancel 停止当前语音', () => {
    const utterance = new SpeechSynthesisUtterance('测试');
    speechSynthesis.speak(utterance);
    speechSynthesis.cancel();
    
    expect(speechSynthesis.cancel).toHaveBeenCalled();
    expect(mockSpeechSynthesis._utterances.length).toBe(0);
  });

  test('SpeechSynthesisUtterance 正确初始化', () => {
    const utterance = new SpeechSynthesisUtterance('拼音');
    
    expect(utterance.text).toBe('拼音');
    expect(utterance.lang).toBe('zh-CN');
    expect(utterance.rate).toBe(1);
  });

  test('模拟多次语音播放不会报错', () => {
    expect(() => {
      for (let i = 0; i < 10; i++) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`测试${i}`);
        speechSynthesis.speak(utterance);
      }
    }).not.toThrow();
  });
});

// ============================================================
// 自动语音循环测试
// ============================================================
describe('自动语音循环测试', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSpeechSynthesis.speak.mockClear();
    mockSpeechSynthesis.cancel.mockClear();
    mockSpeechSynthesis._utterances = [];
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('每 2 秒自动播放一次语音（Level 2）', () => {
    const speakTarget = () => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('波');
      speechSynthesis.speak(utterance);
    };

    // 模拟自动语音循环
    speakTarget(); // 初始播放
    const intervalId = setInterval(speakTarget, 2000);

    // 初始播放 1 次
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(1);

    // 2 秒后
    jest.advanceTimersByTime(2000);
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(2);

    // 4 秒后
    jest.advanceTimersByTime(2000);
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(3);

    clearInterval(intervalId);
  });

  test('清除定时器后不再自动播放', () => {
    const speakTarget = () => {
      const utterance = new SpeechSynthesisUtterance('测试');
      speechSynthesis.speak(utterance);
    };

    const intervalId = setInterval(speakTarget, 2000);
    
    jest.advanceTimersByTime(4000);
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(2);

    clearInterval(intervalId);
    
    jest.advanceTimersByTime(10000);
    // 清除后不应再增加
    expect(speechSynthesis.speak).toHaveBeenCalledTimes(2);
  });
});
