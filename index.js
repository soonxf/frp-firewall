const rf = require('fs');
const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

const IP2Region = require('ip2region').default;
const query = new IP2Region({
  disableIpv6: true,
});
const removeLog = process.argv[2] == '-r';
const app = () => {
  global.dropIps = [];
  const start = () => {
    exec.queryFirewallAllList(firewalls => {
      const type = {};
      const execDrop = (ip, name, siteTemp) => {
        if (firewalls.includes(ip) || global.dropIps.includes(ip)) return;
        global.dropIps.push(ip);
        exec.drop(ip, name, siteTemp, firewalls);
      };

      logRule.logs.forEach(item => {
        const { time, name, ip } = item;

        const site = query.search(ip);
        const sitePriority = () => {
          if (logRule.config.whiteCity.some(item => site.city.indexOf(item) != -1)) return true;
          if (logRule.config.whiteProvince.some(item => site.province.indexOf(item) != -1)) return true;
          if (logRule.config.whiteCountry.some(item => site.country.indexOf(item) != -1)) return true;
          return false;
        };

        const condition =
          firewalls?.includes(ip) ||
          logRule.config.ip?.includes(ip) ||
          site == null ||
          site?.city == '内网IP' ||
          site?.isp == '内网IP';

        //跳过条件
        condition ||
          (() => {
            const isWatch = logRule.watchProjectName.some(item => item.name == name);
            const siteTemp = `${site.country}-${site.province}-${site.city}-${site.isp}`;
            const push = () => {
              type[name] == undefined && (type[name] = []);
              let timeIp = `   ${time}    ${ip}`;
              let s = '';
              for (let i = 0; i < 18 - ip.length; i++) s += ` `;
              type[name].push(`${timeIp}${s}${siteTemp}`);
            };
            const fn = () => (sitePriority() ? push() : isWatch ? execDrop(ip, name, siteTemp) : push());
            logRule.config.isChina ? (site.country?.indexOf('中国') == -1 ? execDrop(ip, name, siteTemp) : fn()) : fn();
          })();
      });

      removeLog ||
        Object.keys(type).forEach(key => {
          console.info(`---------------${key}---------------`);
          console.log('\r');
          const item = type[key];
          item.slice(-logRule.config.jump).map(item => console.log(item));
          console.log('\r');
        });

      exec.firewallReload();
    });
  };
  const watchTime = config.watchTime;
  let time = watchTime == undefined || watchTime < 10000 ? 10000 : watchTime;
  time == 10000 && console.log('watchTime 小于 10 秒 或未设置,已经按默认启动');
  setInterval(() => start(), time);
  start();
};

app();
