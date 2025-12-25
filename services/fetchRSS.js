
const axios = require("axios");
const xml2js = require("xml2js");
const sources = require("../config/sources");
const parser = new xml2js.Parser({ explicitArray:false });

module.exports = async function() {
  let all = [];
  for (const s of sources) {
    try {
      const res = await axios.get(s.url, { timeout:15000 }); // 增加超时时间
      const data = await parser.parseStringPromise(res.data);
      const items = data.rss.channel.item || [];
      console.log(`${s.name} 获取到 ${items.length} 条新闻`);
      items.forEach(i => {
        all.push({
          title: i.title,
          desc: (i.description||"").replace(/<[^>]+>/g,""),
          link: i.link,
          pubDate: i.pubDate,
          source: s.name
        });
      });
    } catch (error) {
      console.error(`${s.name} 获取失败:`, error.message);
    }
  }
  console.log('所有源合计获取到', all.length, '条新闻');
  return all;
};
