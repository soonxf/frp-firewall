const rf = require('fs');
const logRule = require(__dirname + '/logRule.js');
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

const getFrpsLogs = async (params = []) => {
  try {
    let log = []
    const fns = [async () => {
      // const tailLog = false;
      const tailLog = await exec.tail();
      log = (tailLog ? tailLog : await rf.promises.readFile(config.frpsLog, 'utf-8'))?.split(/\n/) ?? [];
    }, async () => log = params.split(/\n/) ?? []]
    await fns[logRule.config.mode]()
    const logConnection = log.filter(item => item.indexOf('proxy.go') !== -1);
    const logs = logConnection.map(item => parseEachLog(item));
    return logs;
  } catch (e) {
    console.log('getFrpsLogs 函数错误:请检查 frps 日志文件是否存在');
    if (new Date().getTime() - global.resetFrpsTime > 1000000 || global.resetFrpsTime == undefined) {
      await exec.resetFrps()
    }
    return [];
  }
};

//对Date的扩展，将 Date 转化为指定格式的String
//月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
//年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
//例子：
//(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
//(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};

module.exports.getFrpsLogs = getFrpsLogs;
module.exports.getFirewallRule = getFirewallRule;
module.exports.config = config;

