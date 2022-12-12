const rf = require('fs');
const exec = require(__dirname + '/exec.js');
//读取配置
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

const ipMatch = str => str.match(/(\d{1,3}\.){3}\d{1,3}/g);

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

const parseLoginLog = async () => {
  try {
    await exec.timer()
    const loginInfo = await exec.queryLoginInfo();
    return loginInfo
      ?.split(/\n/)
      ?.filter(item => item)
      .map(item => {
        const str = item.split(/\s{1,}/g);
        const time = `${str[0] ?? '1970/01/01'} ${str[1] ?? '00:00:00'}`;
        const ip = `${item.match(/(\d{1,3}\.){3}\d{1,3}/g)?.[0] ?? '1.1.1.1'}`;
        return {
          name: 'login',
          time,
          ip,
        };
      });
  } catch (error) {
    return []
  }
};

// 获取防火墙中被 drop 的 ip
const getFirewallRule = stdout => {
  const ips = [];
  stdout?.split(/\n{1,}/g).forEach(item => {
    const ip = ipMatch(item);
    item.indexOf('drop') != -1 && ip != null && ips.push(ip[0]);
  });
  return ips;
};

const getFrpsLogs = async (isReadFile) => {
  try {
    // const tailLog = false;
    await exec.timer()
    const tailLog = await exec.tail();
    const log = (tailLog && isReadFile ? tailLog : await rf.promises.readFile(config.frpsLog, 'utf-8'))?.split(/\n/) ?? [];
    const loginLog = await parseLoginLog();
    const logConnection = log.filter(item => item.indexOf('proxy.go') !== -1);
    const logs = logConnection.map(item => parseEachLog(item));
    return logs.concat(loginLog);
  } catch (e) {
    console.log('getFrpsLogs 函数错误:请检查 frps 日志文件是否存在');
    if (global.resetFrpsTime == undefined || new Date().getTime() - global.resetFrpsTime > 600000) {
      await exec.resetFrps();
    }
    return [];
  }
};

const ipInSegment = (ip) => {
  const iParse = ip.split(".").map(item => parseInt(item))
  const ipIn = config.ip.some(item => {
    return /\-|\//g.test(item) && item.split(".").every((item, index) => {
      const ipSegment = item.split(/\-|\//).map(item => parseInt(item))
      const ipIn = ipSegment.length == 1 ? ipSegment[0] == iParse[index] : (ipSegment[0] <= iParse[index] && iParse[index] <= ipSegment[1])
      return ipIn
    })
  })
  return ipIn
}
//对Date的扩展，将 Date 转化为指定格式的String
//月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
//年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
//例子：
//(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
//(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt))
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
  return fmt;
};

module.exports.getFrpsLogs = getFrpsLogs;
module.exports.getFirewallRule = getFirewallRule;
module.exports.ipInSegment = ipInSegment;
module.exports.config = config;
