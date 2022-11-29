const rf = require('fs');
//读取配置
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

const query = item => {
  // 分析 frp 日志的规则
  const itemTemp = item.split(' ');

  const time = `${itemTemp[0]} ${itemTemp[1]}`;
  const name = itemTemp[5].replace('[', '').replace(']', '');
  const ip = itemTemp[itemTemp.length - 1].replace('[', '').replace(']', '').split(':')[0];
  return {
    time,
    name,
    ip,
  };
};

const getLogs = async () => {
  try {
    const log = await rf.promises.readFile(config.frpsLog, 'utf-8');

    const logSplit = log.split(/\n/);
    const logSplitFilter = logSplit.filter(item => item.indexOf('[web:') !== -1 && item.indexOf('connection') !== -1);
    const logs = logSplitFilter.map(item => query(item));
    return logs;
  } catch (e) {
    console.log('getLogs 错误');
  }
};

module.exports.getLogs = getLogs;
module.exports.config = config;
