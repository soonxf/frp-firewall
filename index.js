require('v8-compile-cache')
const logRule = require(__dirname + '/logRule.js');
const exec = require(__dirname + '/exec.js');
const searcher = require('dy-node-ip2region').create();
const removeLog = process.argv[2] == '-r';

class app {
    constructor() {
        this.removeLog = removeLog;
        this.frpsLogs = [];
        this.firewalls = [];
        this.groupType = {};
        this.watchTime = 15000
        this.isReadFile = false
        this.ip = logRule.config.ip ?? []
        this.run()
    }
    execDrop = (ip, name, fullSite) => {
        if (global.dropIps.includes(ip)) return;
        global.dropIps.push(ip);
        const t = setTimeout(() => {
            exec.drop(ip, name, fullSite, this.firewalls);
            clearTimeout(t)
        }, global.dropIps.length * 100)
    }
    push = (name, time, ip, site,) => {
        this.groupType[name] == undefined && (this.groupType[name] = []);
        let timeIp = `   ${time}    ${ip}`;
        let s = '';
        for (let i = 0; i < 18 - ip.length; i++) s += ` `;
        this.groupType[name].push(`${timeIp}${s}${site}`);
    }
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
        const search = searcher.binarySearchSync(ip);
        const region = search?.region.split('|').filter(item => item) ?? [];
        const cityNo = search?.city ?? '??????????????????';
        const country = region[0] ?? '????????????';
        const province = region[2] ?? '????????????';
        const city = region[3] ?? '????????????';
        const isp = region[4] ?? '????????????';
        const fullSite = `${country}-${province}-${city}-${isp}`
        return {
            country, province, city, cityNo, isp, fullSite
        }
    }
    isWatch = (name) => {
        return name.trim() == 'login' || logRule.config.watchProjectName.some(item => item.trim() == name.trim());
    }
    isSkip = (ip, site) => {
        return (this.firewalls?.indexOf(ip) != -1 ||
            this.ip.indexOf(ip) != -1 ||
            logRule.ipInSegment(ip) ||
            logRule.config.cityNo?.includes(site.cityNo) ||
            site?.country == '??????' ||
            site == null) ? true : false
    }
    forFrpsLogs = () => {
        const fn = (time, ip, name, site) => this.sitePriority(site) ? this.push(name, time, ip, site.fullSite) : this.isWatch(name) ? this.execDrop(ip, name, site.fullSite) : this.push(name, time, ip, site.fullSite);
        this.frpsLogs.forEach(item => {
            const { time, name, ip } = item;
            const site = this.parseSite(ip)
            if (this.isSkip(ip, site)) return
            logRule.config.isChina
                ? site.country?.indexOf('??????') == -1
                    ? this.execDrop(ip, name, site.fullSite)
                    : fn(time, ip, name, site)
                : fn(time, ip, name, site);
        })
    }
    setWatchTime = () => {
        let watchTime = logRule.config?.watchTime
        watchTime == undefined || logRule.config?.watchTime < 15000 && (watchTime = 15000)
        this.watchTime = watchTime
    }
    initLogFirewalls = async () => {
        global.dropIps = [];
        this.groupType = {};
        await exec.timer()
        this.frpsLogs = await logRule.getFrpsLogs(this.isReadFile);
        await exec.timer()
        this.firewalls = await exec.queryFirewallAllList();
        return true
    }
    getReadFile = async () => {
        const isReadFile = await exec.isReadFile()
        this.isReadFile = isReadFile
        isReadFile || console.log("??????????????????????????????,????????????????????????")
    }
    isFirewallReload = () => {
        logRule.config.dropTime == 0 && exec.firewallReload();
    }
    run = async () => {
        this.setWatchTime()
        await exec.timer()
        const start = async () => {
            console.log(`????????????: ${new Date().Format('yyyy-MM-dd hh:mm:ss.S')} `);
            await this.getReadFile()
            await this.initLogFirewalls();
            await exec.timer();
            this.forFrpsLogs();
            this.isFirewallReload()
            this.print();
        };
        start()
        setInterval(() => start(), this.watchTime);
    }
}

new app()
