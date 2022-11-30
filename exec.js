const rf = require('fs');
const { exec, spawn } = require('child_process');
const logRule = require(__dirname + '/logRule.js');

const strReplace = str => str.replace(/\n/, '');

const queryFirewallAllList = () => {
  return new Promise((resolve, reject) => {
    exec(`firewall-cmd --list-all`, (err, stdout, stderr) => {
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

const drop = (ip, name = '', siteTemp = '', firewalls) => {
  const fn = () => {
    if (firewalls?.includes(ip)) return console.log('drop 的 ip 已存在');
    ip
      ? exec(
          `firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address="${ip}" drop'`,
          (err, stdout, stderr) => {
            stdout && console.log(`drop 防火墙:${strReplace(stdout)} ${name} ${ip} ${siteTemp}`);
            stderr && console.log(strReplace(stderr));
            err && console.log('drop 错误');
          }
        )
      : console.log('drop 的 ip 错误');
  };
  firewalls
    ? fn()
    : queryFirewallAllList().then(execFirewalls => {
        firewalls = execFirewalls;
        fn();
      });
};

const accept = (ip, name = '', siteTemp = '', firewalls) => {
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
  firewalls
    ? fn()
    : queryFirewallAllList().then(execFirewalls => {
        firewalls = execFirewalls;
        fn();
      });
};

const resetFrps = ()=>{
  return new Promise((resolve, reject) => {
    exec(`systemctl restart frps`, (err, stdout, stderr) => {
      //frps 服务名必须是 frps 
      resolve(`frps 已重启,请查看 日志是否生成 ${new Date().Format("yyyy-M-d h:m:s.S")}`);
      err && console.log(`frps 重启失败${new Date().Format("yyyy-M-d h:m:s.S")}`);
    });
  }); 
}

const reload = () => {
  setTimeout(() =>{
    exec(`firewall-cmd --reload`, (err, stdout, stderr) => {
      global.dropIps = [];
      stdout && console.log(`防火墙 reload 成功:${strReplace(stdout)} ${new Date().Format("yyyy-M-d h:m:s.S")}`);
      stderr && console.log(strReplace(stderr));
      err && console.log('firewallReload 错误');
    });
  }, 5000);
};

const firewallReload = (flag = false) => (flag ? reload() : global.dropIps.length !== 0 && reload());

module.exports.tail = tail;
module.exports.drop = drop;
module.exports.accept = accept;
module.exports.resetFrps = resetFrps
module.exports.queryFirewallAllList = queryFirewallAllList;
module.exports.firewallReload = firewallReload;
