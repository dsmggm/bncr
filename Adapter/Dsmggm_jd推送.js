/**
 * @author Dsmggm
 * @name Dsmggm_jd推送
 * @team Dsmggm
 * @version 1.0.0
 * @description 青龙推送京东
 * @adapter true
 * @admin false
 * @public true
 * @disable false
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
接收京东日志,然后进行推送<br>
{<br>
pt_pin': '日志内容'<br>
}<br>
`;


// 日志函数
const plugins_name = 'Dsmggm_jd推送';
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


/* 配置构造器 */
const jsonSchema = BncrCreateSchema.object({
  switch: BncrCreateSchema.boolean().setTitle('是否开启插件').setDescription(`设置为关则不加载该插件`).setDefault(false),
  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
});

/* 配置管理器 */
const ConfigDB = new BncrPluginConfig(jsonSchema);


// 主函数
module.exports = async () => {
  await ConfigDB.get();
  // 初始化保存判断
  if(!Object.keys(ConfigDB.userConfig).length){
    logger.info('插件未启用~');
    return
  }
  // 开关判断
  if (ConfigDB.userConfig.switch == false) {
    logger.info('插件未启用~');
    return
  }

  const jdPush = new Adapter('jdPush');

  let pinDB = new BncrDB('pinDB');

  router.post('/api/jd/push', async (req, res) => {
    body = req.body;
    
    // 获取所有键
    const keys = await pinDB.keys();
    // logger.info('All keys in pinDB: ' + JSON.stringify(pins));

    // 遍历所有键的Pin
    for (const key of keys) {

      // 获取到键列表
      const userdata = await pinDB.get(key);
      const pin_list = userdata.Pin;

      // 遍历pin列表
      for (const pin of pin_list) {

        // 在body中找到匹配pin的数据
        if (body.hasOwnProperty(pin)) {

          // 找到匹配的pin，处理对应的数据
          const text = body[pin];
          logger.info(`找到匹配的pin: ${pin}`);
          logger.info(`用户数据: ${text}`);

          // 推送给用户
          sysMethod.push({
              platform: userdata.From,
              groupId: 0,
              userId: userdata.ID,
              msg: text,
              type: 'text',
          }); 
          await sysMethod.sleep(2);
        }
      }
    }
    
    res.send({ status: 200, data: '', msg: 'ok' });  // 返回请求信息
  });
}
