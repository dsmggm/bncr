/**
 * @author Dsmggm
 * @name Dsmggm_jd查询
 * @team Dsmggm
 * @version 1.0.1
 * @description 京东账号查询插件
 * @rule ^(jdcx|京东查询|jd查询)$
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */

// 插件说明内容
const describe_text =`
1、暂无说明:<br>
设置svjdck对接
`;
// 日志函数
const plugins_name = 'Dsmggm_jd查询';
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

const axios = require('axios');

// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
    // 开关
    settings: BncrCreateSchema.object({
      enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
      container:BncrCreateSchema.string().setTitle('京东容器名称').setDescription(`与青龙对接容器名称一致`).setDefault('jd'),
  }).setTitle('设置').setDefault({}),

    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);















// 主函数
module.exports = async (sender) => {
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
  // 判断svjdck容器IP是否存在
  if (!ConfigDB.userConfig.switch.ip) {
    logger.info('svjdck容器IP未设置，请在插件配置中设置');
    return 'next';  // 继续向下匹配插件
  }

}



