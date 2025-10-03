/**
 * @author Dsmggm
 * @name Dsmggm_唤醒开机
 * @team Dsmggm
 * @version 1.0.2
 * @description 唤醒电脑开机，需要提前设置网口与BIOS，具体请自行百度查询设置方法
 * @rule ^(电脑开机|开机|唤醒电脑|开机电脑|打开电脑)$
 * @admin true
 * @public false
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
1、设置电脑开机唤醒功能，需要设置BIOS与网口唤醒功能，具体请自行百度查询设置方法<br>
2、需要电脑MAC与固定IP地址<br>
3、仅管理员可使用<br>
4、插件会自动安装wake_on_lan与ping依赖包，如果没自动安装需要手动执行命令：npm i wake_on_lan与npm i ping<br>
5、确认并反馈电脑开机成功与否<br>
`;

sysMethod.testModule(['wake_on_lan'], { install: true }); //发现少模块自动安装
sysMethod.testModule(['ping'], { install: true }); //发现少模块自动安装

const wol = require('wake_on_lan');


// 日志函数
const plugins_name = 'Dsmggm_唤醒开机';
const logger = {
  // 使用方法： logger.info('日志文本');
  // 其它级别自行写
  
  // 获取格式化的当前时间
  getFormattedTime() {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    // 格式化为 YYYY-MM-DDTHH:mm:ss.sss 格式
    return date.toISOString().slice(0, -1);
  },
  
  // INFO级日志
  info(message = '') {
    console.log(`\x1b[32m[${this.getFormattedTime()}] [INFO] ${plugins_name} - ${message}\x1b[0m`);
  },
  
  // WARE级日志
  ware(message = '') {
    console.log(`\x1b[33m[${this.getFormattedTime()}] [WARE] ${plugins_name} - ${message}\x1b[0m`);
  },

  // ERROR级日志
  error(message = '') {
    console.error(`\x1b[31m[${this.getFormattedTime()}] [ERROR] ${plugins_name} - ${message}\x1b[0m`);
  },
};



// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
    // 开关
    settings: BncrCreateSchema.object({
      enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
      ip:BncrCreateSchema.string().setTitle('电脑固定IP').setDescription(`需要设置固定IP`).setDefault('192.168.1.11'),
      mac:BncrCreateSchema.string().setTitle('电脑MAC地址：').setDescription(`格式如：3B:A6:0F:09:49:2D或者3B-A6-0F-09-49-2D`).setDefault('00:00:00:00:00:00'),
  }).setTitle('设置').setDefault({}),

    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);


module.exports = async (s) => {
  await ConfigDB.get();
  // 初始化保存判断
  if(!Object.keys(ConfigDB.userConfig).length){
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.settings.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  logger.info('正在请求开机...');
  s.reply('正在请求开机...');
  wol.wake(ConfigDB.userConfig.settings.mac, {
      address: ConfigDB.userConfig.settings.ip,
      port: 9,
      // num_packets: 300,
      interval: 1000
  }, (error) => {
      if (error) {
        s.reply('开机失败');
        logger.error('无法发送唤醒数据包:', error);
      } else {
        s.reply('请求开机成功，请等待完成开机~');
        logger.info('唤醒数据包已发送！');  
      }
  });

  await sysMethod.sleep(10); //等待10秒再检测是否开机成功

  const ping = require('ping');

  // 配置 ping 检测
  const options = {
      address: ConfigDB.userConfig.settings.ip, // 目标 IP 地址
      timeout: 2000, // 超时时间（毫秒）
      retries: 30,    // 重试次数
  };

  // 发送 ping 请求并处理结果
  let res = await ping.promise.probe(ConfigDB.userConfig.settings.ip, {
   timeout: 60,
  });
  if (res.alive) {
    s.reply('电脑已开机');
    logger.info('开机成功');
  } else {
    s.reply('电脑未开机、请重试~');
    logger.error('开机失败');
  }


  return 'next';  // 继续向下匹配插件
};