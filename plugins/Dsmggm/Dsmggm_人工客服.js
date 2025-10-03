/**
 * @author Dsmggm
 * @name Dsmggm_人工客服
 * @team Dsmggm
 * @version 1.0.4
 * @description 当用户请求人工客服，可以进行留言并通知管理员。用了都说妙~
 * @rule ^(人工)$
 * @rule ^(人工服务)$
 * @rule ^(人工客服)$
 * @rule ^(客服)$
 * @admin false
 * @public false
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
当用户请求人工客服，可以进行通知管理员，并转发留言给管理员
`;


// 日志函数
const logMessage = (level, message) => {
  const timestamp = sysMethod.getTime('yyyy-MM-dd hh:mm:ss');
  
  // 根据 level 选择合适的 console 方法
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] Dsmggm_人工客服 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_人工客服 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_人工客服 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_人工客服 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_人工客服 - ${message}`);
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
      rooms: BncrCreateSchema.array(BncrCreateSchema.object({
        uid: BncrCreateSchema.string().setTitle('接收用户ID').setDefault(''),
        platform: BncrCreateSchema.string().setTitle('推送平台的适配器名称').setDefault(''),
    }))
  }).setTitle('留言推送设置').setDefault({}),

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);

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

  await s.reply('已经帮您通知管理员，请留言');
  let From = s.getFrom(); //  获取获取平台
  let GroupId = s.getGroupId() // 获取群消息 id
  let UserName = s.getUserName();
  if (UserName === undefined) {
    await sysMethod.pushAdmin({platform: [], msg: `${From}平台用户呼叫人工服务`});
  } else {
    await sysMethod.pushAdmin({platform: [], msg: `${From}平台${UserName}用户呼叫人工服务`});
  }
  await s.waitInput(async (s) => {
    const message = s.getMsg();
    let pushMessage = ''
    if (UserName === undefined) {
      pushMessage = `${From}平台留言:\n留言内容：${message}`
    } else {
      pushMessage = `${From}平台留言:\n${UserName}留言内容：${message}`
    }

    // 内置的推送函数
    sysMethod.pushAdmin({
      //推送所有平台
      platform: [],
      msg: pushMessage,
    });

    await s.reply('留言成功，请耐心等待人工回复，已退出');
  }, 120); 

  return 'next';  // 继续向下匹配插件
}