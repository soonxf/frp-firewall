const rule = item => {
  // 分析 frp 日志的规则
  const itemTemp = item.split(' ');

  const time = `${itemTemp[0]} ${itemTemp[1]}`;
  const name = itemTemp[5].replace('[', '').replace(']', '');
  const ip = itemTemp[itemTemp.length - 1].replace('[', '').replace(']', '').split(':')[0];

  return {
    time,
    name,
    ip,
  };
};

const project = logSplit => {
  const ports = logSplit.filter(item => item.indexOf('port') != -1);
  const arr = ports.map(item => ({
    port: item.split('port')[1].replace('[', '').replace(']', '').trim(),
    name: item.split('port')[0].split(' ')[5].replace('[', '').replace(']', '').trim(),
  }));

  //过滤重复端口
  for (var i = 0; i < arr.length; i++) {
    for (var j = i + 1; j < arr.length; j++) {
      if (arr[i].port == arr[j].port) {
        arr.splice(j, 1);
      }
    }
  }

  return arr;
};
module.exports.query = rule;
module.exports.project = project;
