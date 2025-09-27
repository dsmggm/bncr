/**
 * @author Dsmggm
 * @name Dsmggm_青龙对接
 * @team Dsmggm
 * @version 1.0.0
 * @description 青龙对接工具
 * @rule ^(qltest)$
 * @adapter true
 * @admin false
 * @public false
 * @priority 3
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
1、暂无说明:<br>
设置用于对接青龙
`;


// 日志函数
const plugins_name = 'Dsmggm_青龙对接';
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
    qlip:BncrCreateSchema.string().setTitle('青龙访问IP与端口').setDescription(`例如http://192.168.10.10:5700`).setDefault('http://192.168.10.10:5700'),
    ClientId:BncrCreateSchema.string().setTitle('Client Id').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Id`),
    ClientSecret:BncrCreateSchema.string().setTitle('Client Secret').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Secret`)
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
  if (ConfigDB.userConfig.switch.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  sender.reply(`青龙连接正常……`);
  const token = get_ql_token();
  sender.reply(token);

}


function get_ql_token(){
  let url = `${ConfigDB.userConfig.switch.qlip}/open/auth/token?client_id=${ConfigDB.userConfig.switch.ClientId}&client_secret=${ConfigDB.userConfig.switch.ClientSecret}`;
  let res = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      return data.data.token;
    })
    .catch(error => {
      logger.error(`获取青龙token失败：${error}`);
    });
}