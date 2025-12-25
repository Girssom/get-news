const express = require('express');
const fs = require('fs');
const path = require('path');
const { refreshNews, job } = require('./jobs/dailyJob');


const app = express();
const PORT = process.env.PORT || 3000;

// 解析JSON请求体
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 处理根路径请求，确保返回index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 创建必要目录
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
}

// 创建output目录
if (!fs.existsSync('/tmp/output')) {
  fs.mkdirSync('/tmp/output', { recursive: true });
}

// 创建默认的新闻数据文件
if (!fs.existsSync('/tmp/output/daily.json')) {
  fs.writeFileSync('/tmp/output/daily.json', JSON.stringify([]));
}

// API: 获取新闻列表（支持自定义关键词）
app.get('/api/news', (req, res) => {
  try {
    const newsData = fs.readFileSync('/tmp/output/daily.json', 'utf8');
    let news = JSON.parse(newsData);
    
    // 检查是否有自定义关键词
    const customKeywords = req.query.keywords ? req.query.keywords.split(',') : [];
    
    if (customKeywords.length > 0) {
      const filter = require('./services/filterByKeyword');
      news = filter(news, customKeywords);
    }
    
    res.json(news);
  } catch (error) {
    console.error('读取新闻数据失败:', error);
    res.status(500).json({ error: '读取新闻数据失败', details: error.message });
  }
});

// API: 手动刷新新闻
app.get('/api/refresh', async (req, res) => {
  try {
    const news = await refreshNews();
    res.json({ success: true, count: news.length });
  } catch (error) {
    console.error('手动刷新新闻失败:', error);
    res.status(500).json({ error: '刷新新闻失败' });
  }
});

// API: 获取所有新闻源
app.get('/api/sources', (req, res) => {
  try {
    const sources = require('./config/sources');
    res.json(sources);
  } catch (error) {
    console.error('读取新闻源配置失败:', error);
    res.status(500).json({ error: '读取新闻源配置失败' });
  }
});

// API: 添加新闻源
app.post('/api/sources', (req, res) => {
  try {
    const sources = require('./config/sources');
    const newSource = req.body;
    
    // 验证输入
    if (!newSource.name || !newSource.url) {
      return res.status(400).json({ error: '请提供完整的新闻源信息（名称和URL）' });
    }
    
    sources.push(newSource);
    fs.writeFileSync(path.join(__dirname, 'config', 'sources.js'), `module.exports = ${JSON.stringify(sources, null, 2)};`);
    
    res.json({ success: true, sources });
  } catch (error) {
    console.error('添加新闻源失败:', error);
    res.status(500).json({ error: '添加新闻源失败' });
  }
});

// API: 编辑新闻源
app.put('/api/sources/:index', (req, res) => {
  try {
    const sources = require('./config/sources');
    const index = parseInt(req.params.index);
    const updatedSource = req.body;
    
    // 验证输入
    if (!updatedSource.name || !updatedSource.url) {
      return res.status(400).json({ error: '请提供完整的新闻源信息（名称和URL）' });
    }
    
    // 验证索引
    if (index < 0 || index >= sources.length) {
      return res.status(404).json({ error: '新闻源不存在' });
    }
    
    sources[index] = updatedSource;
    fs.writeFileSync(path.join(__dirname, 'config', 'sources.js'), `module.exports = ${JSON.stringify(sources, null, 2)};`);
    
    res.json({ success: true, sources });
  } catch (error) {
    console.error('编辑新闻源失败:', error);
    res.status(500).json({ error: '编辑新闻源失败' });
  }
});

// API: 删除新闻源
app.delete('/api/sources/:index', (req, res) => {
  try {
    const sources = require('./config/sources');
    const index = parseInt(req.params.index);
    
    // 验证索引
    if (index < 0 || index >= sources.length) {
      return res.status(404).json({ error: '新闻源不存在' });
    }
    
    sources.splice(index, 1);
    fs.writeFileSync(path.join(__dirname, 'config', 'sources.js'), `module.exports = ${JSON.stringify(sources, null, 2)};`);
    
    res.json({ success: true, sources });
  } catch (error) {
    console.error('删除新闻源失败:', error);
    res.status(500).json({ error: '删除新闻源失败' });
  }
});

// 启动定时任务
job.start();
console.log('定时任务已启动：每日上午10点自动刷新新闻');

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('访问 http://localhost:3000 查看新闻网页');
});
