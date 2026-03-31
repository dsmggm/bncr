/**
 * @author Dsmggm
 * @name Dsmggm_微软离线电话激活
 * @team Dsmggm
 * @version 1.0.0
 * @description Dsmggm_微软离线电话激活插件，用于激活微软离线电话功能
 * @rule ^微软|激活|电话激活$
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */



// 插件说明内容
const describe_text =`
发送“微软”到机器人激活此功能<br>
自行到https://pidkey.com/apis注册apikeys<br>
拍离线安装ID给机器人，机器人自动返回确认ID。或者是发送离线安装ID给机器人，机器人自动返回确认ID。<br>
安装ID格式1：xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx<br>
安装ID格式2：xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx<br>
`;

const plugins_name = 'Dsmggm_微软离线电话激活';
const logger = {
  // 使用方法： logger.info('日志文本');
  // 其它级别自行写
  
  // 获取格式化的当前时间
  getFormattedTime() {
    const date = new Date(Date.now() + 8 * 60 * 60 * 1000);
    // 格式化为 YYYY-MM-DDTHH:mm:ss.sss 格式
    return date.toISOString().slice(0, -1);
  },
  // DEBUG级日志
  debug(message = '') {
    console.log(`\x1b[34m[${this.getFormattedTime()}] [DEBUG] ${plugins_name} - ${message}\x1b[0m`);
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
  }).setTitle('设置').setDefault({}),
    apikey: BncrCreateSchema.string().setTitle('apikey').setDescription(`自行到https://pidkey.com/apis注册key`).setDefault('nVHBz3RIsHpXHofLv3B89iFK8'),

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
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.switch.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  
  s.reply('请5分钟内发送安装ID，回复q退出');

  //监听用户输入
  let newMsg =  await s.waitInput(()=> {}, 300)

  if (newMsg.getMsg() === 'q') {
    s.reply('已退出');
    return 'next';  // 继续向下匹配插件
  }
  if (!newMsg) {
    s.reply('输入超时，已退出');
    return;
  }

  const axios = require('axios');

  // 判断是图片还是文本
  if (newMsg.msgInfo.type === 'image') {
    logger.info('接收到图片消息');
    newMsg.reply('暂不支持图片解析，请发送安装ID文本消息');

  // 文本消息处理
  } else if (newMsg.msgInfo.type === 'text') {
    logger.info('接收到文本消息，开始处理');
    
    // 识别格式 - 匹配微软离线安装ID格式
    const installIdPattern1 = /^[a-zA-Z0-9]{7}(-[a-zA-Z0-9]{7}){8}$/;
    const installIdPattern2 = /^\d{63}$/;     // 63个数字
    const msg = newMsg.getMsg();
    logger.info(`接收到的文本消息: ${msg}`);
    
    if (!msg.match(installIdPattern1) && !msg.match(installIdPattern2)) {
      logger.info('文本消息不符合安装ID格式，继续向下匹配插件，已退出');
      return 'next';  // 继续向下匹配插件
    }
    
    logger.info('文本消息符合安装ID格式，开始调用API');
    const url = `https://pidkey.com/ajax/cidms_api?iids=${msg}&justforcheck=0&apikey=${ConfigDB.userConfig.apikey}`
    logger.info(`发送文本解析API请求: ${url}`);
    
    axios.get(url)
      .then(response => {
        // logger.info(`文本解析API响应状态: ${response.status}`);
        // logger.info(`文本解析API响应数据: ${JSON.stringify(response.data)}`);
        
        if (response.data && (response.data.status === 'success' || response.data.result === 'Successfully')) {
          const confirmationId = response.data.cid || response.data.confirmation_id || response.data.confirmationid || response.data.confirmation_id_with_dash;
          if (confirmationId) {
            s.reply(`确认ID：\n${confirmationId}`);
            logger.info(`文本解析成功，返回确认ID: ${confirmationId}`);
          } else {
            s.reply('无法生成确认ID，请检查安装ID是否正确');
            logger.error('文本解析失败：未生成确认ID');
          }
        } else {
          s.reply('生成确认ID失败，请检查安装ID是否正确');
          logger.error(`文本解析失败: ${response.data?.message || response.data?.result || '未知错误'}`);
        }
      })
      .catch(error => {
        s.reply('网络请求失败，请稍后重试');
        logger.error(`API请求失败: ${error.message}`);
        logger.error(`错误详情: ${JSON.stringify(error)}`);
      });
  }


  return 'next';  // 继续向下匹配插件
}