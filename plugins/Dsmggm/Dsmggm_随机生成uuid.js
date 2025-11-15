/**
 * @author Dsmggm
 * @name Dsmggm_随机生成uuid
 * @team Dsmggm
 * @version 1.0.0
 * @description 随机生成并返回UUID给用户
 * @rule ^(uuid)$
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */



// 插件说明内容
const describe_text =`
随机生成并返回UUID给用户
`;
// 日志函数
const plugins_name = 'Dsmggm_随机生成uuid';
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
    switch: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);




function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


module.exports = async (sender) => {
  await ConfigDB.get();
  // 初始化保存判断
  if(!Object.keys(ConfigDB.userConfig).length){
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.switch == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  return await sender.reply(`${uuidv4()}`);
}