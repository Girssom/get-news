
const defaultKeywords = require("../config/keywords");

module.exports = (news, customKeywords = []) => {
  // 如果有自定义关键词，只使用自定义关键词过滤
  // 如果没有自定义关键词，使用默认关键词过滤
  const keywords = customKeywords.length > 0 ? customKeywords : defaultKeywords;
  
  // 如果没有关键词，返回所有新闻
  if (keywords.length === 0) {
    return news;
  }
  
  return news.filter(n =>
    keywords.some(k =>
      (n.title + n.desc).toLowerCase().includes(k.toLowerCase())
    )
  );
};
