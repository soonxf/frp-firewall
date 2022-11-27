# 点个 star 再走吧

# 介绍

> 结合 frps 和 linux firewall 防火墙的日志来监控连接的ip

# 要求

* 开启 frps 日志和 linux 防火墙
* linux 服务器
* linux frps 0.45 版本(只测试过这个版本),不能使用需要修改 rule.js 
* linux 服务器安装了 node ,支持 es6 的版本即可

# frps 开启日志

> frps.ini common 配置下

```
[common]

log_file = /frps.log # 目录和 config.json 的 frpsLog 对应
log_level = info # 需要是 info 日志,其他自行测试
log_max_days = 3
```

# 配置

> 配置文件地址: 项目目录/config.json

> 带有 _ 的是注释

```json
{
    "frpsLog": "frp日志目录 示例:fpr/frps.log",
    "firewallXml": "防火墙文件 示例:firewalld/zones/public.xml",
    "_ip": " Ip 白名单 优先级:国家<省份<城市<IP,只有监控的项目不在白名单才会加入防火墙",
    "ip": [],
    "_whiteCountry": "白名单 国家",
    "whiteCountry": [],
    "_whiteProvince": "白名单省份",
    "whiteProvince": ["安徽"],
    "_whiteCity": "白名单城市",
    "whiteCity": [],
    "_jump": "显示的条数",
    "jump": 20,
    "_watchPort": "监控的项目,加入防火墙优先级次于 isChina,填入端口号",
    "watchPort": [],
    "_isChina": "优先级最高,不是中国境内 IP 直接加入黑名单",
    "isChina": true
}
```

# 运行

> 运行后即可检测日志来加入黑名单

> 后台运行:如使用的是宝塔,添加 shell 定时任务,每间隔一段时间运行即可,或修改 index.js 添加 定时器

```node
node index.js
```

# 批量 ip 加入防火墙

> 多个 ip 使用 , 间隔

> -f 会强制删除,(有的时候 ip 判断不准确误报)

```
node drop.js ip,ip -f
```
