const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');
const searcher = require('dy-node-ip2region').create();
const removeLog = process.argv[2] == '-r';

class app {
    constructor() {
        this.searcher = searcher;
        this.removeLog = removeLog;
        this.frpsLogs = [];
        this.firewalls = [];
        this.groupType = {};
        this.run();
    }
    execDrop = (ip, name, fullSite) => {
        if (global.dropIps.includes(ip) || this.firewalls.includes(ip)) return;
        global.dropIps.push(ip);
        exec.drop(ip, name, fullSite, this.firewalls);
    };
    push = (name, time, ip, site,) => {
        this.groupType[name] == undefined && (this.groupType[name] = []);
        let timeIp = `   ${time}    ${ip}`;
        let s = '';
        for (let i = 0; i < 18 - ip.length; i++) s += ` `;
        this.groupType[name].push(`${timeIp}${s}${site}`);
    };
    sitePriority = (site) => {
        return logRule.config.whiteCity.some(item => site.city.indexOf(item) != -1 || item.indexOf(site.city) != -1) ||
            logRule.config.whiteProvince.some(
                item => site.province.indexOf(item) != -1 || item.indexOf(site.province) != -1
            ) ||
            logRule.config.whiteCountry.some(
                item => site.country.indexOf(item) != -1 || item.indexOf(site.country) != -1
            )
            ? true
            : false;
    }
    print = () => {
        if (this.removeLog) return;
        Object.keys(this.groupType).forEach(key => {
            console.info(`---------------${key}---------------`);
            console.log('\r');
            const item = this.groupType[key];
            item.slice(-logRule.config.jump).map(item => console.log(item));
            console.log('\r');
        });
    }
    parseSite = (ip) => {
        const search = this.searcher.binarySearchSync(ip);
        const region = search?.region.split('|').filter(item => item) ?? [];
        const cityNo = search?.city ?? '未知城市编号';
        const country = region[0] ?? '未知国家';
        const province = region[2] ?? '未知省份';
        const city = region[3] ?? '未知城市';
        const isp = region[4] ?? '未知网络';
        const fullSite = `${country}-${province}-${city}-${isp}`
        return {
            country, province, city, cityNo, isp, fullSite
        }
    }
    isWatch = (name) => {
        return name.trim() == 'login' || logRule.config.watchProjectName.some(item => item.trim() == name.trim());
    }
    isSkip = (ip, site) => {
        return (this.firewalls?.includes(ip) ||
            logRule.config.ip?.includes(ip) ||
            logRule.config.cityNo?.includes(site.cityNo) ||
            site?.country == '保留' ||
            site == null) ? true : false
    }
    forFrpsLogs = () => {
        const fn = (time, ip, name, site) => this.sitePriority(site) ? this.push(name, time, ip, site.fullSite) : this.isWatch(name) ? this.execDrop(ip, name, site.fullSite) : this.push(name, time, ip, site.fullSite);

        for (let index = 0; index < this.frpsLogs.length; index++) {
            const { time, name, ip } = this.frpsLogs[index];
            const site = this.parseSite(ip)
            if (this.isSkip(ip, site)) return
            logRule.config.isChina
                ? site.country?.indexOf('中国') == -1
                    ? this.execDrop(ip, name, site.fullSite)
                    : fn(time, ip, name, site)
                : fn(time, ip, name, site);
        }
    }
    initLogFirewalls = async () => {
        global.dropIps = [];
        this.groupType = {};
        this.frpsLogs = await logRule.getFrpsLogs();
        this.firewalls = await exec.queryFirewallAllList();
    }
    run = () => {
        const start = async () => {
            console.log(`正在运行:${new Date().Format('yyyy-MM-dd hh:mm:ss.S')}`);
            await this.initLogFirewalls()
            this.forFrpsLogs()
            exec.firewallReload();
            this.print();
        };
        start()
        setInterval(() => start(), logRule.config?.watchTime ?? 300000);
    }
}
new app()
