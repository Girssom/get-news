
const defaultKeywords = require("../config/keywords");

module.exports = (news, customKeywords = []) => {
  const keywords = [...defaultKeywords, ...customKeywords];
  
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
