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

const getProject = logSplit => {
  const ports = logSplit.filter(item => item.indexOf('port') != -1);
  const arr = ports.map(item => {
    return {
      port: item.split('port')[1].replace('[', '').replace(']', '').trim(),
      name: item.split('port')[0].split(' ')[5].replace('[', '').replace(']', '').trim(),
    };
  });
  for (var i = 0; i < arr.length; i++) {
    for (var j = i + 1; j < arr.length; j++) {
      arr[i].port == arr[j].port && arr.splice(j, 1);
    }
  }
  return arr;
};

const log = rf.readFileSync(config.frpsLog, 'utf-8');
const logSplit = log.split(/\n/);
const logSplitFilter = logSplit.filter(item => item.indexOf('[web:') !== -1 && item.indexOf('connection') !== -1);
const logs = logSplitFilter.map(item => query(item));

const project = getProject(logSplit);
const watchProjectName = project.filter((item, index) => config.watchPort.includes(parseInt(item.port)));

const firewall = rf.readFileSync(config.firewallXml, 'utf-8');
// 捕捉 firewallXml 文件中所有的 ip
const firewalls = firewall.match(/(\d{1,3}\.){3}\d{1,3}/g);

module.exports.query = query;
module.exports.logs = logs;
module.exports.watchProjectName = watchProjectName;
module.exports.config = config;
module.exports.firewalls = firewalls;
