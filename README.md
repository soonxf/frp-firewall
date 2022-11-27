# 介绍

> 结合 frps 和 linux firewall 防火墙的日志来监控连接的ip

# 配置

> 项目目录 config.json

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

```node
node index.js
```

