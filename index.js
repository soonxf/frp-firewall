const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');

const IP2Region = require('ip2region').default;
const query = new IP2Region({
  disableIpv6: true,
});
const removeLog = process.argv[2] == '-r';

(async () => {
  global.dropIps = [];
  const start = async () => {
    console.log(`正在运行:${new Date()}`);
    const groupType = {};
    const frpsLogs = await logRule.getFrpsLogs();
    const firewalls = await exec.queryFirewallAllList();

    const execDrop = (ip, name, siteTemp) => {
      if (global.dropIps.includes(ip)) return;
      global.dropIps.push(ip);
      exec.drop(ip, name, siteTemp, firewalls);
    };

    frpsLogs.forEach(item => {
      const { time, name, ip } = item;

      const site = query.search(ip);

      const sitePriority = () => {
        return logRule.config.whiteCity.some(item => site.city.indexOf(item) != -1) ||
          logRule.config.whiteProvince.some(item => site.province.indexOf(item) != -1) ||
          logRule.config.whiteCountry.some(item => site.country.indexOf(item) != -1)
          ? true
          : false;
      };

      if (
        firewalls?.includes(ip) ||
        logRule.config.ip?.includes(ip) ||
        site == null ||
        site?.city == '内网IP' ||
        site?.isp == '内网IP'
      )
        return;

      const isWatch = logRule.config.watchProjectName.some(item => item.trim() == name.trim());

      const siteTemp = `${site.country}-${site.province}-${site.city}-${site.isp}`;
      const push = () => {
        groupType[name] == undefined && (groupType[name] = []);
        let timeIp = `   ${time}    ${ip}`;
        let s = '';
        for (let i = 0; i < 18 - ip.length; i++) s += ` `;
        groupType[name].push(`${timeIp}${s}${siteTemp}`);
      };
      const fn = () => (sitePriority() ? push() : isWatch ? execDrop(ip, name, siteTemp) : push());
      logRule.config.isChina ? (site.country?.indexOf('中国') == -1 ? execDrop(ip, name, siteTemp) : fn()) : fn();
    });

    if (removeLog) return;
    Object.keys(groupType).forEach(key => {
      console.info(`---------------${key}---------------`);
      console.log('\r');
      const item = groupType[key];
      item.slice(-logRule.config.jump).map(item => console.log(item));
      console.log('\r');
    });

    exec.firewallReload();
  };
  setInterval(() => start(), logRule.config?.watchTime ?? 300000);

  await start();
})();
