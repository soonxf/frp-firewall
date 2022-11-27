# 介绍

> 结合 frps 和 linux firewall 防火墙的日志来监控连接的ip

# 要求

* linux 服务器
* linux frps 0.45版本(只测试过这个版本),不能使用需要修改 rule.js 
* linux 服务器安装了 node ,node 版本应该没有要求

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

```
node drop.js ip,ip
```

