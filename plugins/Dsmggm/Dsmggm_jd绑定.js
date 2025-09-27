/**
 * @author Dsmggm
 * @name Dsmggm_jd绑定
 * @team Dsmggm
 * @version 1.0.0
 * @description 京东账号绑定与解绑插件
 * @rule ^(jd绑定|绑定jd|jd删除|删除jd|jd解绑|解绑jd)$
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
京东查询插件
`;

// 日志函数
const plugins_name = 'Dsmggm_jd绑定';
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
  
  if (sender.getMsg().trim() === 'jd绑定' || sender.getMsg().trim() === '绑定jd') {

    sender.reply('请1分钟内输入jd_pin,回复q退出');
    let newMsg =  await sender.waitInput(()=> {}, 60)

    if (newMsg.getMsg() === 'q') {
      sender.reply('已退出');
      return 'next';  // 继续向下匹配插件
    }
    if (!newMsg) {
      sender.reply('输入超时，已退出');
    }

    await bind_pin(sender, newMsg.getMsg()); // 绑定pin
    sender.reply(`绑定成功，pin为：${newMsg.getMsg()}`);

  } else if (sender.getMsg().trim() === 'jd删除' || sender.getMsg().trim() === '删除jd' || sender.getMsg().trim() === 'jd解绑' || sender.getMsg().trim() === '解绑jd') {

    sender.reply('请1分钟内输入jd_pin,回复q退出');
    let newMsg =  await sender.waitInput(()=> {}, 60)

    if (newMsg.getMsg() === 'q') {
      sender.reply('已退出');
      return 'next';  // 继续向下匹配插件
    }
    if (!newMsg) {
      sender.reply('输入超时，已退出');
    }
    await remove_pin(sender, newMsg.getMsg());
    sender.reply(`删除成功：${newMsg.getMsg()}`);

  }else {
    sender.reply('请输入正确的命令,已退出');
    return 'next';
  }
  
}


async function bind_pin(sender, pin) {
  const pinDB = new BncrDB('pinDB');   // pin数据库
  uid = sender.getUserId(); // 获取消息 id
  username = sender.getUserName();  // 获取获取用户名
  from = sender.getFrom();  // 获取来自什么平台
  
  // 读取现有数据
  let existing_data = await pinDB.get(`${from}:${uid}`);
  
  if (existing_data && Array.isArray(existing_data.Pin)) {
    // 如果已有数据且Pin是数组，则添加新的pin（避免重复）
    if (!existing_data.Pin.includes(pin)) {
      existing_data.Pin.push(pin);
    }
  } else {
    // 如果没有现有数据或数据格式不正确，创建新数据结构
    existing_data = {
      'Pin': [pin],
      'From': from,
      'ID': uid,
      'Name': username
    };
  }
  
  // 保存更新后的数据
  await pinDB.set(`${from}:${uid}`, existing_data); // 成功 true 失败false
}




async function remove_pin(sender, pin_to_remove) {
  const pinDB = new BncrDB('pinDB');   // pin数据库
  const uid = sender.getUserId();      // 获取消息 id
  const from = sender.getFrom();       // 获取来自什么平台
  
  // 读取现有数据
  let existing_data = await pinDB.get(`${from}:${uid}`);
  
  if (existing_data && Array.isArray(existing_data.Pin) && existing_data.Pin.length > 0) {
    // 过滤掉要删除的pin
    const updated_pins = existing_data.Pin.filter(pin => pin !== pin_to_remove);
    
    if (updated_pins.length !== existing_data.Pin.length) {
      // 如果有pin被删除
      if (updated_pins.length > 0) {
        // 如果还有剩余的pin，更新数据
        existing_data.Pin = updated_pins;
        await pinDB.set(`${from}:${uid}`, existing_data);
        return { success: true, message: `成功删除pin: ${pin_to_remove}` };
      } else {
        // 如果没有剩余的pin，删除整个记录
        await pinDB.delete(`${from}:${uid}`);
        return { success: true, message: `已删除最后一个pin，清除用户记录` };
      }
    } else {
      return { success: false, message: `未找到要删除的pin: ${pin_to_remove}` };
    }
  } else {
    return { success: false, message: '未找到用户绑定数据或数据格式不正确' };
  }
}