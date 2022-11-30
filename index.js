/*
 * @Author: error: git config user.name && git config user.email & please set dead value or install git
 * @Date: 2022-11-27 05:41:56
 * @LastEditors: error: git config user.name && git config user.email & please set dead value or install git
 * @LastEditTime: 2022-11-30 15:36:57
 * @FilePath: /coder/index.js
 * @Description:
 *
 * Copyright (c) 2022 by error: git config user.name && git config user.email & please set dead value or install git, All Rights Reserved.
 */
const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');
const searcher = require('dy-node-ip2region').create();

const removeLog = process.argv[2] == '-r';

(async () => {
  let frpsLogs = [];
  global.dropIps = [];
  const start = async () => {
    const groupType = {};
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

    if (logRule.config.mode == 0) {
      exec.firewallReload();
    } else {
      if (global.reloadTime == undefined || new Date().getTime() - global.reloadTime > logRule.config.watchTime) {
        exec.firewallReload();
      }
    }

    if (removeLog) return;

    Object.keys(groupType).forEach(key => {
      console.info(`---------------${key}---------------`);
      console.log('\r');
      const item = groupType[key];
      item.slice(-logRule.config.jump).map(item => console.log(item));
      console.log('\r');
    });
  };
  listen = [
    async () => {
      setInterval(async () => {
        console.log(`正在运行:${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
        frpsLogs = await logRule.getFrpsLogs();
        await start();
      }, logRule.config?.watchTime ?? 300000);
      frpsLogs = await logRule.getFrpsLogs();
      await start();
    },
    () => {
      console.log(`正在运行:${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
      exec.listen(async res => {
        frpsLogs = await logRule.getFrpsLogs(res);
        await start();
      });
    },
  ];
  listen[logRule.config.mode]();
})();
