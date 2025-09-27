/**
 * @author Dsmggm
 * @name Dsmggm_监测赞赏码信息
 * @team Dsmggm
 * @version 1.0.8
 * @description 监控赞赏码的插件，需要安装xml2js模块，需要登录微信才可使用，测试仅支持wechatFerry，借鉴于南下风来，感谢“南下风来”提供的匹配方式。用了都说妙~
 * @rule https:\/\/[A-Za-z0-9\-\._~:\/\?#\[\]@!$&'\*\+,%;\=]*
 * @parallel true 
 * parallel并行-匹配规则与spy相同的时候可以打开
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */

// 插件说明内容
const describe_text =`
1、插件用途：<br>
插件用于监控gewechat收款码信息。<br>
将其数据记录到无界Bncr的数据库中。<br>
通知设定人员。<br>
<br>
2、打赏记录：<br>
打赏只记录《打赏金额》，《微信名》，《留言》，《打赏时间》<br>
数据记录到无界的数据库user中的Reward_data_NoneUsers表，键为打赏时间，值为全部信息<br>
如果需要高性能可自行搭建redis或mysql之类的，自行对插件代码进行二次开发。<br>
<br>
3、关于异常：<br>
重启无界!!<br>
重启无界!!<br>
重启无界!!<br>
如还有插件异常，可到无界群反馈，将错误与问题描述清楚，寻求群内大哥求助。<br>
如非插件异常，自寻教程或咨询无界社区群。<br>
<br>
4、已知BUG：<br>
因为打赏获取到的信息只有《打赏金额》《微信名》《留言》《打赏时间》，与赞赏插件结合使用确认打赏者。<br>
`;

// 日志函数
const logMessage = (level, message) => {
  const timestamp = sysMethod.getTime('yyyy-MM-dd hh:mm:ss');

  // 根据 level 选择合适的 console 方法
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
  }
};


// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
  // 开关
  switch: BncrCreateSchema.object({
    enable: BncrCreateSchema.boolean().setTitle('是否开启插件').setDescription(`设置为关则插件不启用`).setDefault(false),
}).setTitle('插件开关').setDefault({}),

  // 通知设置
  option: BncrCreateSchema.object({
      pushenble: BncrCreateSchema.boolean().setTitle('开启收款推送').setDescription('设置为关则不推送收款信息给指定用户').setDefault(false),
      rooms: BncrCreateSchema.array(BncrCreateSchema.object({
        uid:BncrCreateSchema.string().setTitle('接收用户ID').setDefault(''),
        platform:BncrCreateSchema.string().setTitle('推送平台的适配器名称').setDefault(''),
    }))
  }).setTitle('收款推送设置').setDefault({}),

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);


// 写入数据库
const inputdb = async (amount, from, lmessage, time) => {
  try {
    const userdb = new BncrDB('Reward_data_NoneUsers');
    const valueToStore = {
      收款金额: amount,
      赞赏人: from,
      打赏留言: lmessage,
      到账时间: time
    };
    await userdb.get(time)
    const result  = await userdb.set(time, valueToStore)
    if (result) {
      logMessage('INFO', `成功存储数据：${JSON.stringify(valueToStore)}`);
      return '数据成功写入数据库。';
    } else {
      logMessage('ERROR', `存储数据失败`);
      return '数据写入数据库失败！！';
    }
  } catch (parseError) {
    logMessage('ERROR', `存储数据函数错误，键：${lmessage} , ${parseError}`);
    return '数据写入数据库函数错误！！！查看日志吧';
  }
}


// 插件主函数
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

  // 解析打赏xml内容
  const xml2js = require('xml2js');    // 导入xml2js
  const xmlString = s.getMsg(); // 获取gewechat的信息
  const parser = new xml2js.Parser();    // 创建xml解析器
  // console.log(xmlString)

  parser.parseString(xmlString, async (err, result) => {
    if (err) {
      logMessage('ERROR', '接收到的貌似不是xml信息，插件跳过处理~');
      return 'next';  // 继续向下匹配插件
    }

    // 处理收款信息
    try {
      const appmsg = result.msg.appmsg[0];
      const amount = appmsg.des[0].match(/收款金额￥([\d.]+)/)[1];
      let from = '匿名赞赏';
      try {
        from = appmsg.des[0].match(/来自([^\n]+)/)[1].trim();
      } catch (parseError) {}
      let lmessage = '无留言';
      try {
        lmessage = appmsg.des[0].match(/付款方留言([^\n]+)/)[1].trim();
      } catch (parseError) {}
      const time = appmsg.des[0].match(/到账时间([^\n]+)/)[1].trim();
      
      // 写入数据库
      const indb_status = await inputdb(amount, from, lmessage, time);

      // 定义通知内容
      const pushMessage = `收款金额：${amount}  \n赞赏人：${from}  \n打赏留言：${lmessage}  \n到账时间：${time}  \n${indb_status}`; 
      logMessage('DEBUG', pushMessage);

      // 推送通知
      if (ConfigDB.userConfig.option.pushenble == false) {
        logMessage('INFO', '未启用收款推送~');
        return;
      }

      // console.log(ConfigDB.userConfig.option)
      // 通知管理员
      const rooms = ConfigDB.userConfig.option.rooms;
      for (const room of rooms) {
        const uid = room.uid;
        const platform = room.platform;
        await sysMethod.push({
            platform: platform,
            groupId: '0',
            userId: uid,
            msg: pushMessage,
        });
    }} catch (parseError) {
      logMessage('ERROR', `解析数据出错，可能是转账，报错代码：${parseError}`);
    }
  });
  
  return 'next';  // 继续向下匹配插件
};

