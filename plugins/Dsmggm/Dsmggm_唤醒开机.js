/**
 * @author Dsmggm
 * @name Dsmggm_唤醒开机
 * @team Dsmggm
 * @version 1.0.0
 * @description 唤醒电脑开机，需要提前设置网口与BIOS，具体请自行百度查询设置方法
 * @rule ^(电脑开机)$
 * @rule ^(开机)$
 * @rule ^(唤醒电脑)$
 * @rule ^(开机电脑)$
 * @admin true
 * @public true
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
`;


// 日志函数
const logMessage = (level, message) => {
  const timestamp = sysMethod.getTime('yyyy-MM-dd hh:mm:ss');
  // console.log(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
  
  // 根据 level 选择合适的 console 方法
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] Dsmggm_赞赏信息 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_赞赏信息 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_赞赏信息 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_赞赏信息 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_赞赏信息 - ${message}`);
      break;
  }
};


// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
    // 开关
    switch: BncrCreateSchema.object({
      enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
      ip:BncrCreateSchema.string().setTitle('电脑固定IP').setDescription(`需要设置固定IP`).setDefault('192.168.1.11'),
      mac:BncrCreateSchema.string().setTitle('电脑MAC地址：').setDescription(`格式如：30:56:0F:09:39:2D`).setDefault('00:00:00:00:00:00'),
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
    logMessage('INFO', '插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.switch.enable == false) {
    logMessage('INFO', '插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  const wol = require('wake_on_lan');
  
  wol.wake(ConfigDB.userConfig.switch.mac, {
      address: ConfigDB.userConfig.switch.ip,
      port: 9
  }, (error) => {
      if (error) {
        s.reply('开机失败');
        console.error('无法发送唤醒数据包:', error);
      } else {
        s.reply('请求开机成功，请等待完成开机~');
        console.log('唤醒数据包已发送！');  
      }
  });
  
  return 'next';  // 继续向下匹配插件
};