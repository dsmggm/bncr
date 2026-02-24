/**
 * @author Dsmggm
 * @name Dsmggm_HomeAssistant
 * @team Dsmggm
 * @version 1.0.1
 * @description 智能家居HomeAssistant对话插件
 * @rule .*
 * @admin true
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */



// 插件说明内容
const describe_text =`
1
`;


const plugins_name = 'Dsmggm_HomeAssistant';
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
  switch: BncrCreateSchema.object({
    enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
    ip:BncrCreateSchema.string().setTitle('HomeAssistant访问IP与端口').setDescription(`例如http://192.168.10.10:8123`).setDefault('http://192.168.10.10:8123'),
    token:BncrCreateSchema.string().setTitle('长期访问令牌(token)').setDescription(`HomeAssistant侧边栏-用户设置-安全-底部创建令牌`).setDefault('eyJhbGciOi.....请更改为自己的令牌token'),
  }).setTitle('设置').setDefault({}),

  option: BncrCreateSchema.array(
    BncrCreateSchema.object({
      switch: BncrCreateSchema.boolean().setTitle('是否启用').setDescription(`设置为关则该条命令不启用`).setDefault(false),
      name: BncrCreateSchema.string().setTitle('命令名称').setDescription(`例如：打开客厅灯`).setDefault(''),
      entity_id: BncrCreateSchema.string().setTitle('Home Assistant实体ID').setDescription(`例如：switch.room_light`).setDefault(''),
      service: BncrCreateSchema.string().setTitle('服务操作').setDescription('打开或者关闭或切换').setEnum(['turn_on', 'turn_off', 'toggle']).setEnumNames(['打开', '关闭', '切换']).setDefault('toggle'),
    })
  ).setTitle('匹配命令').setDescription(`匹配命令命中操作的实例ID与操作`),

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);


/**
 * 通用的 Home Assistant 服务调用函数（fetch 版）
 * @param {string} entityId 实体标识符
 * @param {string} service 服务名（turn_on/turn_off/toggle）
 * @param {object} [serviceData={}] 额外参数
 * @returns {Promise<void>}
 */
async function callHassServiceFetch(entityId, service, serviceData = {}) {
  if (!entityId || !entityId.includes(".")) {
    throw new Error("实体标识符格式错误");
    return '实体标识符格式错误';
  }
  if (!service) {
    throw new Error("必须指定服务名");
    return '必须指定服务名';
  }

  const [domain] = entityId.split(".");
  const apiUrl = `${ConfigDB.userConfig.switch.ip}/api/services/${domain}/${service}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ConfigDB.userConfig.switch.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entity_id: entityId,
        ...serviceData
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP错误：${response.status} ${response.statusText}`);
      return `HTTP错误：${response.status} ${response.statusText}`;
    }

    const result = await response.json();
    console.log(`✅ 操作成功：${domain}.${service} → ${entityId}`, result);
    return '操作成功';
  } catch (error) {
    console.error(`❌ 操作失败：${domain}.${service} → ${entityId}`, error.message);
    throw error;
    return `操作失败：${error.message}`;
  }
}

// 调用示例
// const targetEntity = "switch.room_light_xu_ni_kai_guan";
// callHassServiceFetch(targetEntity, "turn_on");





// 插件主函数
module.exports = async (s) => {
  await ConfigDB.get();
  // 初始化保存判断
  if(!Object.keys(ConfigDB.userConfig).length){
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.switch.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  
  if (s.getMsg() === 'HA' || s.getMsg() === 'ha' || s.getMsg() === 'Ha') {
    // 返回全部支持的命令名称
    let commandList = ConfigDB.userConfig.option
      .filter(cmd => cmd.switch)  // 只显示启用的命令
      .map(cmd => cmd.name)
      .join('\n');
    s.reply(`当前支持的命令有：\n${commandList}`);
    return 'next';  // 继续向下匹配插件
  }

  // 遍历匹配命令
  let matchedCommand = ConfigDB.userConfig.option.find(cmd => s.getMsg().includes(cmd.name));
  if (matchedCommand) {
    // 调用 Home Assistant 服务
    let result = await callHassServiceFetch(matchedCommand.entity_id, matchedCommand.service);
    s.reply(result);
  }

  return 'next';  // 继续向下匹配插件
}
