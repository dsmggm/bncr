/**
 * @author Dsmggm
 * @name Dsmggm_通用变量提交
 * @team Dsmggm
 * @version 1.0.1
 * @description 提交变量到指定容器
 * @rule ^(提交ck)$
 * @admin true
 * @public false
 * @priority 3
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
设置变量提交的容器名
`;


// 日志函数
const plugins_name = '通用变量提交';
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
    container: BncrCreateSchema.string().setTitle('存放容器').setDescription(`变量存储环境的容器名`),
  }).setTitle('全局设置').setDefault({}),

  // // 说明
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
  
  try {
    const {ql} = require('./Dsmggm_青龙对接.js')
  } catch (error) {
    logger.error('未找到 Dsmggm_青龙对接.js');
    return 'next';  // 继续向下匹配插件
  }
  
  // 变量名
  sender.reply(`请输入变量名，q退出`);
  let name = await sender.waitInput(async (s)=> {

    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
    }

  }, 120);
  if (name === null) return sender.reply('超时自动退出');
  if (name.getMsg() === 'q') return sender.reply('已退出');


  // 变量值
  sender.reply(`请输入变量值，q退出`);
  let vlaue = await sender.waitInput(async (s)=> {

    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
    }

  }, 120);
  if (vlaue === null) return sender.reply('超时自动退出');
  if (vlaue.getMsg() === 'q') return sender.reply('已退出');


  // 备注
  sender.reply(`请输入备注，q退出`);
  let remarks = await sender.waitInput(async (s)=> {

    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
    }

  }, 120);
  if (remarks === null) return sender.reply('超时自动退出');
  if (remarks.getMsg() === 'q') return sender.reply('已退出');
  
  // 初始化青龙实例
  const qinglong = await ql.init(ConfigDB.userConfig.settings.container)
  // 提交变量
  await qinglong.add_env(vlaue.getMsg(), name.getMsg(), remarks.getMsg() + '@@' + sender.getUserId());

  sender.reply(`变量提交成功`);


}


