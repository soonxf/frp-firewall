const rf = require('fs');
const { get } = require('http');
const exec = require(__dirname + '/exec.js');
//读取配置
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

const ipMatch = str => str.match(/(\d{1,3}\.){3}\d{1,3}/g);

const parseEachLog = item => {
  const str = item.split(/\s{1,}/g);
  const time = `${str[0] ?? '1970/01/01'} ${str[1] ?? '00:00:00'}`;
  const name = `${str[5]?.replace(/\[|\]/g, '') ?? 'name:none'}`;
  const ip = `${str[10]?.match(/(\d{1,3}\.){3}\d{1,3}/g)?.[0] ?? '1.1.1.1'}`;
  // const ip = item.match(/(\d{1,3}\.){3}\d{1,3}/g)?.[0] ?? '1.1.1.1';
  // const name =
  //   item
  //     .match(/\[.{1,}\]/g)?.[0]
  //     ?.split(' ')[3]
  //     .replace(/\[|\]/g, '') ?? 'name:none';
  // const time =
  //   item.match(
  //     /((([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})\/(((0[13578]|1[02])\/(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)\/(0[1-9]|[12][0-9]|30))|(02\/(0[1-9]|[1][0-9]|2[0-8]))))|((([0-9]{2})(0[48]|[2468][048]|[13579][26])|((0[48]|[2468][048]|[3579][26])00))\/02\/29))\s{0,1}([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])/g
  //   )?.[0] ?? '1970/01/01 00:00:00';

  return {
    time,
    name,
    ip,
  };
};

// 获取防火墙中被 frop 的 ip
const getFirewallRule = stdout => {
  const ips = [];
  stdout?.split(/\n{1,}/g).forEach(item => {
    const ip = ipMatch(item);
    item.indexOf('drop') != -1 && ip != null && ips.push(ip[0]);
  });
  return ips;
};

const getFrpsLogs = async () => {
  try {
    // const tailLog = false;
    const tailLog = await exec.tail();
    const log = (tailLog ? tailLog : await rf.promises.readFile(config.frpsLog, 'utf-8'))?.split(/\n/) ?? [];
    const logConnection = log.filter(item => item.indexOf('proxy.go') !== -1);
    const logs = logConnection.map(item => parseEachLog(item));
    return logs;
  } catch (e) {
    console.log('getFrpsLogs 函数错误:请检查 frps 日志文件是否存在');
    return [];
  }
};

module.exports.getFrpsLogs = getFrpsLogs;
module.exports.getFirewallRule = getFirewallRule;
module.exports.config = config;
