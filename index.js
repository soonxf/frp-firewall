const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');
const searcher = require('dy-node-ip2region').create();

const removeLog = process.argv[2] == '-r';


(async () => {
  const start = async () => {
    global.dropIps = [];

    console.log(`正在运行:${new Date().Format("yyyy-M-d h:m:s.S")}`);

    const groupType = {};
    const frpsLogs = await logRule.getFrpsLogs();
    const firewalls = await exec.queryFirewallAllList();

    const execDrop = (ip, name, siteTemp) => {
      if (global.dropIps.includes(ip) || firewalls.includes(ip)) return;
      global.dropIps.push(ip);
      exec.drop(ip, name, siteTemp, firewalls);
    };

    frpsLogs.forEach(item => {
      const { time, name, ip } = item;

      const site = {};
      const binarySearchSync = searcher.binarySearchSync(ip);
      const cityNo = binarySearchSync?.city;
      const region = binarySearchSync?.region.split('|').filter(item => item) ?? [];
      site.country = region[0] ?? '未知国家';
      site.province = region[2] ?? '未知省份';
      site.city = region[3] ?? '未知城市';
      site.isp = region[4] ?? '未知网络';
      site.cityNo = cityNo ?? '未知城市编号';

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
        logRule.config.cityNo?.includes(site.cityNo) ||
        site?.country == '保留' ||
        site == null
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

    exec.firewallReload();

    if (removeLog) return;

    Object.keys(groupType).forEach(key => {
      console.info(`---------------${key}---------------`);
      console.log('\r');
      const item = groupType[key];
      item.slice(-logRule.config.jump).map(item => console.log(item));
      console.log('\r');
    });
  };
  setInterval(() => start(), logRule.config?.watchTime ?? 300000);

  start();
})();

