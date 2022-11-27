const rf = require('fs');
const { exec } = require('child_process');

const rule = require(__dirname + '/rule.js');

const IP2Region = require('ip2region').default;
const query = new IP2Region({
  disableIpv6: true,
});

//-----------条件--------------
const config = JSON.parse(rf.readFileSync(__dirname + '/config.json', 'utf-8'));

//过滤的 IP
const loclhostIp = config.ip;

//显示的条数
const jump = config.jump;

//-----------条件--------------

//解析日志
const log = rf.readFileSync(config.frpsLog, 'utf-8');
const logSplit = log.split(/\n/);
const logTemp = logSplit.filter(item => item.indexOf('[web:') !== -1 && item.indexOf('connection') !== -1);

const project = rule.project(logSplit);

const watchprojectName = project.filter((item, index) => config.watchPort.includes(parseInt(item.port)));

//解析日志

const firewall = rf.readFileSync(config.firewallXml, 'utf-8');
const firewallTemp = firewall.match(/(\d{1,3}\.){3}\d{1,3}/g);

const type = {};

const drop = (ip, siteTemp) => {
  exec(
    `firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address="${ip}" drop'`,
    (err, stdout, stderr) => console.log(`加入防火墙:${stdout} ${ip} ${siteTemp}`)
  );
};

logTemp.map(item => {
  // const port =
  const { time, name, ip } = rule.query(item);
  const site = query.search(ip);
  const sitePriority = () => {
    if (config.whiteCity.some(item => site.city.indexOf(item) != -1)) return true;
    if (config.whiteProvince.some(item => site.province.indexOf(item) != -1)) return true;
    if (config.whiteCountry.some(item => site.country.indexOf(item) != -1)) return true;
    return false;
  };
  // port;
  const condition =
    firewallTemp?.includes(ip) ||
    loclhostIp?.includes(ip) ||
    site == null ||
    site?.city == '内网IP' ||
    site?.isp == '内网IP';

  //跳过条件
  condition
    ? ''
    : (() => {
        const isWatch = watchprojectName.some(item => item.name == name);

        const siteTemp = `${site.country}-${site.province}-${site.city}-${site.isp}`;
        const push = () => {
          if (type[name] == undefined) type[name] = [];
          let timeIp = `   ${time}   ${ip}`;
          let s = '';
          for (let i = 0; i < 17 - ip.length; i++) s += ` `;
          type[name].push(`${timeIp}${s}${siteTemp}`);
        };
        const fn = () => (sitePriority() ? push() : isWatch ? drop(ip, siteTemp) : push());
        config.isChina ? (site.country?.indexOf('中国') == -1 ? drop(ip, siteTemp) : fn()) : fn();
      })();
});

Object.keys(type).map(key => {
  console.info(`---------------${key}---------------`);
  console.log('\r');
  const item = type[key];
  item.slice(-jump).map(item => console.log(item));
  console.log('\r');
});
