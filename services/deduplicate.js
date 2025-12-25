
const sim = require("string-similarity");
module.exports = function(list) {
  let result = [];
  list.forEach(n => {
    if (!result.some(r =>
      r.link === n.link ||
      sim.compareTwoStrings(r.title, n.title) > 0.8
    )) result.push(n);
  });
  return result;
};
