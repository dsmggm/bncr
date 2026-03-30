/**
 * @author Dsmggm
 * @name Dsmggm_交互式菜单
 * @team Dsmggm
 * @version 1.0.3
 * @description 交互式菜单，可以设置是否触发插件，目前仅测试了Gewechat。用了都说妙~
 * @rule ^(菜单)$
 * @rule ^(帮助)$
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
交互式菜单，最多支持2级菜单<br>
用户可根据菜单序号进入二级菜单<br>
进入二级菜单可选择序号触发插件<br>
<br>
关于触发插件：<br>
当设置的二级菜单触发开发打开：打开触发会把填写的作为触发关键词，比如time，插件会发送time的内容给用户。<br>
当设置的二级菜单触发开发关闭：将触发关键词的文本发送给用户，可用于描述插件功能。<br>
<br>
关于异常：<br>
重启无界!!<br>
重启无界!!<br>
重启无界!!<br>
如还有插件异常，可到无界群反馈，将错误与问题描述清楚，寻求群内大哥求助。<br>
如非插件异常，自寻教程或咨询无界社区群。<br>
`;


// 日志函数
const logMessage = (level, message) => {
  const timestamp = sysMethod.getTime('yyyy-MM-dd hh:mm:ss');
  
  // 根据 level 选择合适的 console 方法
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] Dsmggm_交互式菜单 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_交互式菜单 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_交互式菜单 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_交互式菜单 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_交互式菜单 - ${message}`);
      break;
  }
};




// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
  // 开关
  switch: BncrCreateSchema.object({
    enable: BncrCreateSchema.boolean().setTitle('是否开启插件').setDescription(`设置为关则插件不启用`).setDefault(false),
}).setTitle('插件开关').setDefault({}),

  // 头部菜单
  title: BncrCreateSchema.string().setTitle('菜单头部文字').setDescription('在一级菜单的头部显示的文本，可留空').setDefault('欢迎使用本机器人🥰'),

  // 通知设置
  option: BncrCreateSchema.object({
      rooms: BncrCreateSchema.array(BncrCreateSchema.object({
        text :BncrCreateSchema.string().setTitle('').setDefault(''),
        rooms: BncrCreateSchema.array(BncrCreateSchema.object({
          text: BncrCreateSchema.string().setTitle('').setDefault(''),
          enable: BncrCreateSchema.boolean().setTitle().setDescription('触发插件开关').setDefault(false),
          rooms: BncrCreateSchema.object({
            text: BncrCreateSchema.string().setDescription('当打开上面的插件触发开关时，此处填写的值作为插件触发的关键词，比如time，用户选择此菜单发送time内容，当开关为关时，此处内容作为信息发送用户').setDefault('此处填写发送给用户的文本或触发插件的关键词')
          }).setDescription('下面填写触发或返回用户的信息')
        })).setDescription('二级菜单')
    }))
  }).setTitle('菜单内容').setDescription('一级菜单').setDefault({}),

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);




// 触发插件函数， 传入触发文明msg， 传入对话对象s
async function TriggerPlugin(msg, s) {
  await sysMethod.sleep(1);
  const from = s.getFrom();
  const userid = s.getUserId();
  const groupid = s.getGroupId();
  const friendid = '0';
  const msgInfo = {
    type: 'text',
    msg: msg,
    userId: userid || '0',
    groupId: groupid || '0',
    friendId: friendid|| '0',
  }
  console.log('触发插件，传入参数：', msgInfo);
  console.log('from:', from);
  sysMethod.Adapters(msgInfo, from, 'inlinemask', msgInfo); 
}

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

  
  // 一级菜单循环
  while (true) {
    let menus = {}; // 用于存储生成的菜单对象
    let menuIndex = 1; // 菜单序号，从1开始
    
    const rooms = ConfigDB.userConfig.option.rooms;
    for (const room of rooms) {
      const text = room.text;

      menus[menuIndex] = text; // 将菜单名和序号作为键值对存储在menus对象中
      menuIndex++;
    }

    let pushMessage = ''          // 设置菜单开头

    // 添加菜单头部内容
    const title_text = ConfigDB.userConfig.title;
    if (title_text !== undefined ) {
      pushMessage += title_text;
      pushMessage += '\n\n'
    }

    for (const key in menus) {
      pushMessage += `${key}. ${menus[key]}\n`;
    }
    pushMessage += 'q. 退出';
    // await sysMethod.push({
    //     platform: s.getFrom(),
    //     groupId: '0',
    //     userId: s.getUserId(),
    //     msg: pushMessage,
    // });
    await s.reply(pushMessage);

    // 等待用户输入，超时时间为120秒
    let newMsg2 = await s.waitInput(() => {}, 120);
    
    // 超时处理
    if (newMsg2 === null) {
        await s.reply('超时退出');
        return;
    }
    
    // 获取用户输入的消息
    const numMsg2 = newMsg2.getMsg();
    
    // 退出 
    if(numMsg2 === 'q'){
        await s.reply('退出');
        return;
    }
    
    // 匹配菜单
    if (numMsg2 && !isNaN(numMsg2) && /^[0-9]+$/.test(numMsg2) && parseInt(numMsg2) <= menuIndex) {
      let menus = {}; // 用于存储生成的菜单对象
      let menuIndex = 1; // 菜单序号，从1开始
      const rooms_2 = rooms[numMsg2 - 1].rooms;
      for (const room of rooms_2) {
        const text = room.text;
    
        menus[menuIndex] = text; // 将菜单名和序号作为键值对存储在menus对象中
        menuIndex++;
      }
    
      let pushMessage = ''          // 设置菜单开头
      pushMessage += '0. 返回上级菜单\n';
      for (const key in menus) {
        pushMessage += `${key}. ${menus[key]}\n`;
      }
      pushMessage += 'q. 退出';
      // await sysMethod.push({
      //     platform: s.getFrom(),
      //     groupId: '0',
      //     userId: s.getUserId(),
      //     msg: pushMessage,
      // });
      await s.reply(pushMessage);



      // 进入二级菜单循环
      while (true) {
        // 等待用户输入，超时时间为120秒
        let newMsg3 = await s.waitInput(() => {}, 120);
        
        // 超时处理
        if (newMsg3 === null) {
            await s.reply('超时退出');
            return;
        }
        
        // 获取用户输入的消息
        const numMsg3 = newMsg3.getMsg();
        
        // 退出 
        if(numMsg3 === 'q'){
            await s.reply('退出');
            return;
        }
      
        // 返回上级 
        if(numMsg3 === '0'){
          await s.reply('返回上级菜单');
          break;
        }

        // 匹配菜单
        if (numMsg3 && !isNaN(numMsg3) && /^[0-9]+$/.test(numMsg3) && parseInt(numMsg3) <= menuIndex) {
          // 判断是不是触发插件
          const PluginSwitch = ConfigDB.userConfig.option.rooms[numMsg2 - 1].rooms[numMsg3 - 1].enable;
          
          // 触发文本内容
          const keyword = ConfigDB.userConfig.option.rooms[numMsg2 - 1].rooms[numMsg3 - 1].rooms.text;

          // 如果开触发
          if (PluginSwitch === true) {
            
            TriggerPlugin(keyword, s);   // 触发插件，msg是触发关键词
            return;
            // 如果不开触发
          } else {
            await s.reply(keyword);
            return
          }


        } else {
          await s.reply('输入错误\n请输入对应菜单序号\n退出回复："q"');
          continue;
        }
      } 
    } else {
      await s.reply('输入错误\n请输入对应菜单序号\n退出回复："q"');
      continue;
    }
  }
  return 'next';  // 继续向下匹配插件
}

