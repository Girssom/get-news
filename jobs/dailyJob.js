const fetchAll = require('../services/fetchRSS');
const filter = require('../services/filterByKeyword');
const dedup = require('../services/deduplicate');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// 创建输出目录
const outputDir = path.join('/tmp', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 刷新新闻的核心函数
async function refreshNews() {
  console.log('开始刷新新闻...', new Date());
  
  try {
    // 获取所有新闻
    let news = await fetchAll();
    console.log('获取到原始新闻:', news.length, '条');
    
    // 过滤关键词
    news = filter(news);
    console.log('关键词过滤后:', news.length, '条');
    
    // 去重
    news = dedup(news);
    console.log('去重后:', news.length, '条');
    
    // 按发布时间排序（最新的在前）
    news.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    // 保存前50条重点摘要
    const topNews = news.slice(0, 50);
    fs.writeFileSync(path.join(outputDir, 'daily.json'), JSON.stringify(topNews, null, 2));
    
    console.log('新闻刷新完成，保存了', topNews.length, '条重点摘要');
    return topNews;
  } catch (error) {
    console.error('刷新新闻失败:', error);
    return [];
  }
}

// 配置定时任务：每日上午10点执行
const job = cron.schedule('0 10 * * *', async () => {
  await refreshNews();
}, {
  scheduled: false, // 初始不启动，需要手动调用start()
  timezone: 'Asia/Shanghai' // 设置时区为上海
});

// 导出函数和任务
exports.refreshNews = refreshNews;
exports.job = job;

// 如果直接运行此文件，立即执行一次刷新
if (require.main === module) {
  refreshNews();
}
