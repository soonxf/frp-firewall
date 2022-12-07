const rf = require('fs');
const { exec, spawn } = require('child_process');
const logRule = require(__dirname + '/logRule.js');

const strReplace = str => str.replace(/\n/, '');

const queryFirewallAllList = () => {
  return new Promise((resolve, reject) => {
    //firewall-cmd --list-all
    exec(`firewall-cmd --list-rich-rules`, (err, stdout, stderr) => {
      stdout && resolve(logRule.getFirewallRule(stdout));
      stderr && console.log(strReplace(stderr));
      stderr && reject(strReplace(stderr));
      err && console.log('queryFirewallAllList 错误');
    });
  });
};

const tail = () => {
  return new Promise((resolve, reject) => {
    try {
      const bufferList = [];
      const child = spawn('tail', ['-n', logRule.config.line, logRule.config.frpsLog]);
      child.stdout.on('data', data => bufferList.push(data));
      child.stderr.on('data', data => data && resolve(false));
      child.on('close', data => {
        const log = Buffer.concat(bufferList).toString();
        data == 0 && resolve(log);
      });
    } catch (e) {
      console.log('tail 命令失败 转为 node 读取 frp 日志文件');
      resolve(false);
      throw e;
    }
  });
};


const isReadFile = () => {
  return new Promise((resolve, reject) => {
    try {
      const child = exec(`cat /proc/uptime`);
      child.stdout.on('data', data => {
        const time = data?.split(/\s{1,}/g)[0] * 1000
        const flag = time - logRule.config.watchTime > 0 ? true : false;
        resolve(flag)
      });
      // child.stdout.on('close', data => resolve(true));
      child.stderr.on('data', data => data && resolve(true));
    } catch (e) {
      console.log('查询开机时间失败');
      resolve(true);
    }
  });
}

const queryLoginInfo = () => {
  return new Promise((resolve, reject) => {
    try {
      const child = exec(`grep  "login" ${(logRule.config.line, logRule.config.frpsLog)}`);
      child.stdout.on('data', data => resolve(data));
      child.stdout.on('close', data => resolve(false));
      child.stderr.on('data', data => data && resolve(false));
    } catch (e) {
      console.log('grep 查询登录信息命令失败');
      resolve(false);
    }
  });
};

const drop = async (ip, name = '', siteTemp = '', firewalls) => {
  const fn = () => {
    if (firewalls?.includes(ip)) return console.log('drop 的 ip 已存在');
    const command =
      logRule.config.dropTime == 0
        ? `firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address="${ip}" drop'`
        : `firewall-cmd --add-rich-rule='rule family=ipv4 source address="${ip}"  drop' --timeout=${logRule.config.dropTime ?? 86400
        }`;
    ip
      ? exec(command, (err, stdout, stderr) => {
        stdout &&
          console.log(`drop 防火墙:${strReplace(stdout)} ${name} ${ip} ${siteTemp} ${logRule.config.dropTime}`);
        stderr && console.log(strReplace(stderr));
        err && console.log('drop 错误');
      })
      : console.log('drop 的 ip 错误');
  };
  firewalls == undefined && (firewalls = await queryFirewallAllList());
  fn();
};

const accept = async (ip, name = '', siteTemp = '', firewalls) => {
  const fn = () => {
    logRule.config.ip.includes(ip)
      ? console.log(`ip 已经存在白名单配置中 ${ip}`)
      : (() => {
        logRule.config.ip?.push(ip);
        rf.writeFile(__dirname + '/config.json', JSON.stringify(logRule.config), err => {
          err == null ? console.log(`配置白名单 Ip 成功 ${ip}`) : console.log('writeFile 写入配置失败');
        });
      })();
    ip && firewalls.includes(ip)
      ? exec(
        `firewall-cmd --permanent --remove-rich-rule='rule family="ipv4" source address=${ip} drop'`,
        (err, stdout, stderr) => {
          stdout && console.log(`accept 防火墙:${strReplace(stdout)} ${name} ${ip} ${siteTemp}`);
          stderr && console.log(strReplace(stderr));
          err && console.log('accept 错误');
        }
      )
      : console.log('accept 的 ip 错误 或者 不存在');
  };
  firewalls == undefined && (firewalls = await queryFirewallAllList());
  fn();
};

const resetFrps = () => {
  return new Promise((resolve, reject) => {
    global.resetFrpsTime = new Date().getTime();
    exec(`systemctl restart frps`, (err, stdout, stderr) => {
      //frps 服务名必须是 frps
      resolve(`frps 已重启,请查看 日志是否生成 ${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
      err && console.log(`frps 重启失败${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
    });
  });
};

const reload = () => {
  const time = global.dropIps?.length ?? 10 * 100;
  setTimeout(() => {
    exec(`firewall-cmd --reload`, (err, stdout, stderr) => {
      global.dropIps = [];
      stdout && console.log(`防火墙 reload 成功:${strReplace(stdout)} ${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
      stderr && console.log(strReplace(stderr));
      err && console.log('firewallReload 错误');
    });
  }, time + 3000);
};

const timer = () =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      resolve(t);
      t && clearTimeout(t);
    }, 1000);
  });

const firewallReload = (flag = false) => (flag ? reload() : global.dropIps.length !== 0 && reload());

module.exports.tail = tail;
module.exports.drop = drop;
module.exports.timer = timer;
module.exports.accept = accept;
module.exports.isReadFile = isReadFile;
module.exports.resetFrps = resetFrps;
module.exports.queryLoginInfo = queryLoginInfo;
module.exports.queryFirewallAllList = queryFirewallAllList;
module.exports.firewallReload = firewallReload;
