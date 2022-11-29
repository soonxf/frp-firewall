const rf = require('fs');
const exec = require(__dirname + '/exec.js');
//读取配置
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

const parseEachLog = item => {
  const str = item.split(/\s{1,}/g);
  const time = `${str[0] ?? '1970/01/01'} ${str[1] ?? '00:00:00'}`;
  const name = `${str[5]?.replace(/\[|\]/g, '') ?? 'name:none'}`;
  const ip = `${str[10]?.match(/(\d{1,3}\.){3}\d{1,3}/g)?.[0] ?? '1.1.1.1'}`;
  return {
    time,
    name,
    ip,
  };
};

const getLogs = async () => {
  try {
//     const tailLog = false;
    const tailLog = await exec.tail();
    const readFileLog = await rf.promises.readFile(config.frpsLog, 'utf-8');
    const log = (tailLog ? tailLog : readFileLog).split(/\n/);
    const logConnection = log.filter(item => item.indexOf('proxy.go') !== -1);
    const logs = logConnection.map(item => parseEachLog(item));
    return logs;
  } catch (e) {
    console.log('getLogs 错误');
  }
};

module.exports.getLogs = getLogs;
module.exports.config = config;

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
