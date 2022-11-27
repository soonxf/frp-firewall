const { exec } = require('child_process');
const logRule = require(__dirname + '/logRule.js');

const drop = (ip, name = '', siteTemp = '') => {
  if (logRule.firewalls.includes(ip)) return;
  ip
    ? exec(
        `firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address="${ip}" drop'`,
        (err, stdout, stderr) => {
          stdout && console.log(`drop 防火墙:${stdout.replace(/\n/, '')} ${name} ${ip} ${siteTemp}`);
          stderr && console.log(stderr.replace(/\n/, ''));
          err && console.log('drop 错误');
        }
      )
    : console.log('drop 的 ip 错误');
};

const accept = (ip, name = '', siteTemp = '') => {
  ip && logRule.firewalls.includes(ip)
    ? exec(
        `firewall-cmd --permanent --remove-rich-rule='rule family="ipv4" source address=${ip} drop'`,
        (err, stdout, stderr) => {
          stdout && console.log(`accept 防火墙:${stdout.replace(/\n/, '')} ${name} ${ip} ${siteTemp}`);
          stderr && console.log(stderr.replace(/\n/, ''));
          err && console.log('accept 错误');
        }
      )
    : console.log('accept 的 ip 错误');
};

const firewallReload = () => {
  setTimeout(function () {
    exec(`firewall-cmd --reload`, (err, stdout, stderr) => {
      stdout && console.log(`防火墙 reload 成功:${stdout.replace(/\n/, '')}`);
      stderr && console.log(stderr.replace(/\n/, ''));
      err && console.log('firewallReload 错误');
    });
  }, 1500);
};

module.exports.drop = drop;
module.exports.accept = accept;
module.exports.firewallReload = firewallReload;
