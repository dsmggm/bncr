/**
 * @author Dsmggm
 * @name Dsmggm_赞赏
 * @team Dsmggm
 * @version 1.0.8
 * @description 请求赞赏，记录用户ID与赞赏内容到无界数据库，便于其它插件读取赞赏数据。用了都说妙~
 * @rule ^(赞赏|赞赏码|打款)$
 * @admin false
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
1、赞赏码设置<br>
将赞赏码命名为zsm.jpg<br>
然后放到无界的public目录下<br>
设置IP<br>
2、打赏记录：<br>
需要搭配《监测赞赏码信息》插件。<br>
打赏只记录《打赏金额》，《微信名》，《留言》，《打赏时间》<br>
《监测赞赏码信息》数据记录到无界的数据库user中的Reward_data_NoneUsers表，认领之后会到Reward_data表，键为打赏者id+打赏时间(对机器人说'我的id'返回)，值为全部信息<br>
如果需要高性能可自行搭建redis或mysql之类的，自行对插件代码进行二次开发。<br>
3、插件获取打赏记录：<br>
插件开发可以用const dsdb = new BncrDB('Reward_data');  获取到数据<br>
4、关于异常：<br>
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
      console.error(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_监测赞赏码信息 - ${message}`);
      break;
  }
};


// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
    // 开关
    settings: BncrCreateSchema.object({
      enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
      image:BncrCreateSchema.string().setTitle('打赏二维码图片URL：').setDescription(`返回给用户的打赏码，需要与机器人bot同一微信(目前只支持gwwechat)`).setDefault('http://无界IP:9090/public/zsm.jpg')
  }).setTitle('设置').setDefault({}),

    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);

// 检查付款
async function check_money(s) {
    const userdb = new BncrDB('Reward_data_NoneUsers');
    const userdb_user = new BncrDB('Reward_data');
    const allkeys = await userdb.keys();
    // console.log(allkeys);
    // 获取当前时间
    const now = new Date();

    // 计算 2 分钟前的时间
    const twoMinutesAgo = new Date(now.getTime() - 20000 * 60 * 1000);

    // 筛选出近 2 分钟的时间
    const recentKeys = allkeys.filter(timeKey => {
        const eventTime = new Date(timeKey); // 将时间字符串转换为 Date 对象
        return eventTime >= twoMinutesAgo && eventTime <= now; // 检查时间是否在范围内
    });

    // 判断2分钟内的订单
    // 如果没有打赏记录
    if (recentKeys.length === 0) {
      logMessage('INFO', `${s.getUserId}没有查询到赞赏记录`);
      s.reply('没有查询到赞赏记录');

    // 如果有一个打赏记录
    } else if (recentKeys.length === 1) {
      const only = await userdb.get(recentKeys[0]);
      const userid = await s.getUserId();
      // const status = await userdb.set(userid, only);
      const status = await userdb_user.set(userid + '@' + only.到账时间 ,only);
      await userdb.del(recentKeys[0]);   // 删除
      if (status === true) {
        const text = `收到打赏 \n赞赏人： ${only.赞赏人} \n赞赏金额：${only.收款金额} \n留言：${only.打赏留言}  \n赞赏时间：${only.到账时间} `
        s.reply(text)
        return;
      } else {
        s.reply('收到打赏数据处理异常，请联系客服管理员')
        return;
      }
    
    // 如果有多个打赏记录
    } else {
      // s.reply('查询到多个赞赏记录')
      let names = ''
      let index = 1;
      for (const key of recentKeys) {
        const only = await userdb.get(key); 
        // 添加到 names 字符串，格式为 "编号: 赞赏人\n"
        names += `${index}. ${only.赞赏人}\n`; // 使用换行符分隔
        index++; // 增加编号
      }
      s.reply('当前收到多笔赞赏，请确认对应打赏序号：\n' + names)

      // 用户回复对应赞赏记录
      while (true) {
        // 等待用户输入，超时时间为120秒
        let newMsg = await s.waitInput(() => {}, 600);

        // 超时处理
        if (newMsg === null) {
            await s.reply('超时退出');
            return;
        }

        // 获取用户输入的消息
        let num = newMsg.getMsg();

        // 退出 
        if(num === 'q'){
            await s.reply('退出');
            return;
        }

        // 数字
        if (!isNaN(num) && parseInt(num) < index && parseInt(num) > 0) {
          num--;
          const only = await userdb.get(recentKeys[num]);
          const userid = await s.getUserId();
          // const status = await userdb.set(userid, only);
          const status = await userdb_user.set(userid + '@' + only.到账时间 ,only);
          await userdb.del(recentKeys[num]);   // 删除
          if (status === true) {
            const text = `收到打赏 \n赞赏人： ${only.赞赏人} \n赞赏金额：${only.收款金额} \n留言：${only.打赏留言}  \n赞赏时间：${only.到账时间} `
            s.reply(text)
            return;
          } else {
            s.reply('收到打赏数据处理异常，请联系客服管理员')
            return;
          }
        } else {
            await s.reply('输入错误\n请回复对应数字 \n退出回复："q"');
        }
      } 

    }
}



module.exports = async (s) => {
    await ConfigDB.get();
    // 初始化保存判断
    if(!Object.keys(ConfigDB.userConfig).length){
      logMessage('INFO', '插件未启用~');
      return 'next';  // 继续向下匹配插件
    }
    // 开关判断
    if (ConfigDB.userConfig.settings.enable == false) {
      logMessage('INFO', '插件未启用~');
      return 'next';  // 继续向下匹配插件
    }
    
    // 发赞赏码
    const image = ConfigDB.userConfig.settings.image;
    await s.reply({
        type: 'image',
        path: image
    });

    // 过2秒发提示
    await sysMethod.sleep(1);
    await s.reply('请在2分钟内完成赞赏');

    // 过2秒发提示
    await sysMethod.sleep(4);
    await s.reply('完成赞赏后回复："y"或"1"\n退出回复："q"');

    // 回复赞赏
    while (true) {
      // 等待用户输入，超时时间为120秒
      let newMsg = await s.waitInput(() => {}, 120);
      
      // 超时处理
      if (newMsg === null) {
          await s.reply('超时退出');
          return;
      }
      
      // 获取用户输入的消息
      const one = newMsg.getMsg();
      
      // 退出 
      if(one === 'q'){
          await s.reply('退出');
          return;
      }
      
      // 字符
      if (one === 'y' || one === '1') {
          break; // 输入正确，跳出循环
      } else {
          await s.reply('输入错误\n完成打赏回复："y"或"1" \n退出回复："q"');
      }
    }
      

    // 检查是否已经付款
    await check_money(s);
  return 'next';  // 继续向下匹配插件
};