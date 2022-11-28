const { exec } = require('child_process');

const strReplace = str => str.replace(/\n/, '');
const strMatch = str => str.match(/(\d{1,3}\.){3}\d{1,3}/g);

const queryFirewallAllList = callBack => {
  exec(`firewall-cmd --list-all`, (err, stdout, stderr) => {
    stdout && callBack(strMatch(stdout));
    stderr && console.log(strReplace(stderr));
    err && console.log('queryFirewallAllList 错误');
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
    : queryFirewallAllList(execFirewalls => {
        firewalls = execFirewalls;
        fn();
      });
};

const accept = (ip, name = '', siteTemp = '', firewalls) => {
  const fn = () => {
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
    : queryFirewallAllList(execFirewalls => {
        firewalls = execFirewalls;
        fn();
      });
};

const reload = () => {
  setTimeout(function () {
    exec(`firewall-cmd --reload`, (err, stdout, stderr) => {
      global.dropIps = [];
      stdout && console.log(`防火墙 reload 成功:${strReplace(stdout)}`);
      stderr && console.log(strReplace(stderr));
      err && console.log('firewallReload 错误');
    });
  }, 5000);
};

const firewallReload = (flag = false) => (flag ? reload() : global.dropIps.length !== 0 && reload());

module.exports.drop = drop;
module.exports.accept = accept;
module.exports.queryFirewallAllList = queryFirewallAllList;
module.exports.firewallReload = firewallReload;
