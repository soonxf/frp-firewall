const rf = require('fs');
const { exec } = require('child_process');

process.argv[2]
  ? (() => {
      const drop = process.argv[2].split(',');
      drop.map((item, index) =>
        exec(
          `firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address="${item}" drop'`,
          (err, stdout, stderr) => {
            console.log(`${stdout} ${item}`);
            //console.log(`${stderr} ${item}`);
          }
        )
      );
    })()
  : console.log('请输入需要禁止访问的 IP ,以 , 间隔');
