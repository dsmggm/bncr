/**
 * @author Dsmggm
 * @name Dsmggm_HomeAssistant
 * @team Dsmggm
 * @version 1.0.0
 * @description 智能家居HomeAssistant对话插件
 * @rule ^(HA|ha|Ha)$
 * @admin true
 * @public false
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
*/



// 插件说明内容
const describe_text =`
配置HomeAssistant：<br>
1、侧边栏-设置-语音助手-添加助手-语言选<中文><br>
2、侧边栏-用户设置-安全-底部创建长期访问令牌(token)<br>
3、配置本插件的IP与token<br>
使用规则：<br>
1、触发命令，ha或HA或Ha<br>
1、使用示例：打开 {某区域} {某设备}   例：打开客厅风扇<br>
2、如果不想带区域控制，可以到HomeAssistant侧边栏-设置-语音助手-公开-设置设备别名<br>
`;

const plugins_name = 'Dsmggm_测试';

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

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);




// 请求HA
async function sendCommand(text) {
    try {
        // 构建请求参数
        const requestData = {
            text: text,
            language: 'zh-cn'
        };

        // 发送POST请求
        const response = await fetch(`${ConfigDB.userConfig.switch.ip}/api/conversation/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ConfigDB.userConfig.switch.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`);
        }

        // 解析并返回结果
        const result = await response.json();
        return result;
    } catch (error) {
        logger.error('发送指令出错:', error);
        return null;
    }
}






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
  
  s.reply('请指示...回复q退出');
  await sysMethod.sleep(3);
  s.reply('打开 {某区域} {某设备}\n示例：打开客厅风扇');   //提示语

  let newMsg = await s.waitInput(async (s)=> {
    //手机号
    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
    } else {
      
      returnmsg = await sendCommand(msg);
      // logger.info(returnmsg.response.speech.plain.speech);
      s.reply(returnmsg.response.speech.plain.speech);
      return 'again';
    }
}, 120);
  if (newMsg === null) return s.reply('超时自动退出');
  if (newMsg.getMsg() === 'q') return s.reply('已退出');

  return 'next';  // 继续向下匹配插件
}
