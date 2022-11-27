const exec = require(__dirname + '/exec.js');
const ips = process.argv[2];
const force = process.argv[3] ?? '';
// 从 drop 删除黑名单
ips
  ? (() => {
      const ips = process.argv[2].split(',');
      let change = false;
      ips.map((item, index) => {
        if (/(\d{1,3}\.){3}\d{1,3}/g.test(item) || force?.indexOf('-f') != -1) {
          change = true;
          exec.accept(item);
        } else console.log('请输入正确的 ip');
      });
      change && exec.firewallReload();
    })()
  : console.log('请输入需要禁止访问的 IP ,以 , 间隔');
