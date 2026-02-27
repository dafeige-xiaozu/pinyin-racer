/**
 * 拼音赛车 - 后端单元测试
 * 使用 Jest + Supertest 测试 API 接口
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

// 设置测试环境
process.env.NODE_ENV = 'test';

const { app, loadUserData, saveUserData, defaultUserData, USER_DATA_PATH } = require('./server');

// 测试前备份原始数据
let originalUserData = null;

beforeAll(() => {
  // 备份现有用户数据
  if (fs.existsSync(USER_DATA_PATH)) {
    originalUserData = fs.readFileSync(USER_DATA_PATH, 'utf8');
  }
});

afterAll(() => {
  // 恢复原始用户数据
  if (originalUserData) {
    fs.writeFileSync(USER_DATA_PATH, originalUserData, 'utf8');
  } else if (fs.existsSync(USER_DATA_PATH)) {
    fs.unlinkSync(USER_DATA_PATH);
  }
});

beforeEach(() => {
  // 每个测试前重置为干净的用户数据
  saveUserData({ ...defaultUserData });
});

// ============================================================
// 测试点 1：/api/submit-answer 接口 - 错误答案存入 mistakes 数组
// ============================================================
describe('POST /api/submit-answer - 错误答案记录测试', () => {
  test('Level 2 错误答案应将字母存入 mistakes 数组', async () => {
    const response = await request(app)
      .post('/api/submit-answer')
      .send({
        level: 2,
        correct: false,
        letter: 'b'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.totalWrong).toBe(1);

    // 验证 user_data.json 中的 mistakes 数组
    const userData = loadUserData();
    expect(userData.mistakes).toContainEqual(
      expect.objectContaining({
        level: 2,
        letter: 'b'
      })
    );
  });

  test('Level 3 错误答案应将音节存入 mistakes 数组', async () => {
    const response = await request(app)
      .post('/api/submit-answer')
      .send({
        level: 3,
        correct: false,
        syllable: 'ba'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const userData = loadUserData();
    expect(userData.mistakes).toContainEqual(
      expect.objectContaining({
        level: 3,
        syllable: 'ba'
      })
    );
  });

  test('重复错误答案不应重复存入 mistakes', async () => {
    // 第一次错误
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'b' });

    // 第二次同样错误
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'b' });

    const userData = loadUserData();
    const bMistakes = userData.mistakes.filter(m => m.level === 2 && m.letter === 'b');
    expect(bMistakes.length).toBe(1); // 只应有一条记录
  });

  test('正确答案应从 mistakes 中移除对应字母', async () => {
    // 先添加错误
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'p' });

    let userData = loadUserData();
    expect(userData.mistakes.some(m => m.letter === 'p')).toBe(true);

    // 然后答对
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: true, letter: 'p' });

    userData = loadUserData();
    expect(userData.mistakes.some(m => m.letter === 'p')).toBe(false);
  });
});

// ============================================================
// 测试点 2：/api/reset 接口 - 彻底初始化用户数据
// ============================================================
describe('POST /api/reset - 数据重置测试', () => {
  test('重置后所有计数归零', async () => {
    // 先制造一些数据
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: true, letter: 'b' });
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'm' });
    await request(app)
      .post('/api/update-time')
      .send({ level: 1, seconds: 100 });

    // 执行重置
    const response = await request(app).post('/api/reset');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 验证数据已重置
    const userData = loadUserData();
    expect(userData.totalCorrect).toBe(0);
    expect(userData.totalWrong).toBe(0);
    expect(userData.mastered).toEqual([]);
    expect(userData.mistakes).toEqual([]);
    expect(userData.currentSession).toEqual([]);
  });

  test('重置后 time_spent 归零', async () => {
    // 先添加时间
    await request(app)
      .post('/api/update-time')
      .send({ level: 1, seconds: 50 });
    await request(app)
      .post('/api/update-time')
      .send({ level: 2, seconds: 30 });

    // 执行重置
    await request(app).post('/api/reset');

    const userData = loadUserData();
    expect(userData.time_spent).toEqual({
      level1: 0,
      level2: 0,
      level3: 0
    });
  });

  test('重置后 JSON 文件结构完整', async () => {
    await request(app).post('/api/reset');

    const userData = loadUserData();

    // 验证所有必需字段存在
    expect(userData).toHaveProperty('level');
    expect(userData).toHaveProperty('mastered');
    expect(userData).toHaveProperty('mistakes');
    expect(userData).toHaveProperty('currentSession');
    expect(userData).toHaveProperty('totalCorrect');
    expect(userData).toHaveProperty('totalWrong');
    expect(userData).toHaveProperty('time_spent');
    expect(userData).toHaveProperty('bestTimes');

    // 验证类型正确
    expect(Array.isArray(userData.mastered)).toBe(true);
    expect(Array.isArray(userData.mistakes)).toBe(true);
    expect(typeof userData.time_spent).toBe('object');
    expect(typeof userData.bestTimes).toBe('object');
  });
});

// ============================================================
// 测试点 3：/api/get-task 接口 - 错题概率测试
// ============================================================
describe('GET /api/get-task - 错题优先出题测试', () => {
  test('无错题时正常返回随机任务', async () => {
    const response = await request(app)
      .get('/api/get-task')
      .query({ level: 2 });

    expect(response.status).toBe(200);
    expect(response.body.level).toBe(2);
    expect(response.body.type).toBe('balloon');
    expect(response.body.targetLetter).toBeDefined();
    expect(response.body.options).toHaveLength(2);
    expect(response.body.timeLimit).toBe(10);
  });

  test('有错题时 isReview 字段正确标识复习题', async () => {
    // 先添加一个错题
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'b' });

    // 多次请求，验证错题会被标记
    let foundReview = false;
    for (let i = 0; i < 20; i++) {
      const response = await request(app)
        .get('/api/get-task')
        .query({ level: 2 });

      if (response.body.targetLetter === 'b' && response.body.isReview) {
        foundReview = true;
        break;
      }
    }

    // 在多次尝试中应该能找到复习题（概率约 50%）
    expect(foundReview).toBe(true);
  });

  test('错题概率测试 - 50% 概率返回错题（允许 ±15% 误差）', async () => {
    // 添加一个特定的错题
    await request(app)
      .post('/api/submit-answer')
      .send({ level: 2, correct: false, letter: 'zh' });

    const totalRequests = 100;
    let reviewCount = 0;

    for (let i = 0; i < totalRequests; i++) {
      const response = await request(app)
        .get('/api/get-task')
        .query({ level: 2 });

      if (response.body.isReview) {
        reviewCount++;
      }
    }

    const actualProbability = reviewCount / totalRequests;
    
    // 期望概率约 50%，允许 ±15% 误差（即 35%-65%）
    // 注意：实际代码中是 Math.random() < 0.5，即 50% 概率
    expect(actualProbability).toBeGreaterThanOrEqual(0.35);
    expect(actualProbability).toBeLessThanOrEqual(0.65);
    
    console.log(`错题出现概率: ${(actualProbability * 100).toFixed(1)}%`);
  });

  test('Level 3 任务返回正确结构', async () => {
    const response = await request(app)
      .get('/api/get-task')
      .query({ level: 3 });

    expect(response.status).toBe(200);
    expect(response.body.level).toBe(3);
    expect(response.body.type).toBe('racing');
    expect(response.body.initial).toBeDefined();
    expect(response.body.targetFinal).toBeDefined();
    expect(response.body.options).toHaveLength(3);
    expect(response.body.timeLimit).toBe(15);
  });
});

// ============================================================
// 额外测试：/api/update-time 接口
// ============================================================
describe('POST /api/update-time - 时间累计测试', () => {
  test('正确累计学习时间', async () => {
    await request(app)
      .post('/api/update-time')
      .send({ level: 1, seconds: 30 });

    await request(app)
      .post('/api/update-time')
      .send({ level: 1, seconds: 20 });

    const userData = loadUserData();
    expect(userData.time_spent.level1).toBe(50);
  });

  test('拒绝无效参数', async () => {
    const response = await request(app)
      .post('/api/update-time')
      .send({ level: 5, seconds: 10 });

    expect(response.status).toBe(400);
  });
});

// ============================================================
// 额外测试：/api/stats 接口
// ============================================================
describe('GET /api/stats - 统计数据测试', () => {
  test('返回正确的统计结构', async () => {
    const response = await request(app).get('/api/stats');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('time_spent');
    expect(response.body).toHaveProperty('totalTime');
    expect(response.body).toHaveProperty('totalCorrect');
    expect(response.body).toHaveProperty('totalWrong');
    expect(response.body).toHaveProperty('accuracy');
    expect(response.body).toHaveProperty('mastered');
    expect(response.body).toHaveProperty('mistakes');
  });

  test('正确计算准确率', async () => {
    // 8 对 2 错 = 80%
    for (let i = 0; i < 8; i++) {
      await request(app)
        .post('/api/submit-answer')
        .send({ level: 2, correct: true, letter: 'a' });
    }
    for (let i = 0; i < 2; i++) {
      await request(app)
        .post('/api/submit-answer')
        .send({ level: 2, correct: false, letter: 'b' });
    }

    const response = await request(app).get('/api/stats');
    expect(response.body.accuracy).toBe(80);
  });
});
