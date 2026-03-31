/**
 * @author Dsmggm
 * @name Dsmggm_WeChatWorkBot
 * @team Dsmggm
 * @version 1.0.0
 * @description 企业微信机器人
 * @adapter true
 * @admin false
 * @public true
 * @disable false
 * @priority 666
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
使用信息：<br>
填写BotID与Secret<br>
设置之后应该要重启<br>
群聊需要@才能收到信息，所以可能会匹配不到字符<br>
<br>
开发信息：<br>
插件开发可使用Bncr信息的type字段判断信息类型，如text、image、file<br>
图片/文件：接收到的图片/文件会默认保存到/tmp目录下，同时返回base64到Bncr的msg字段<br>
暂不支持mixed（图文混排）、voice（语音）

`;

// 检测模块是否存在
sysMethod.testModule(['@wecom/aibot-node-sdk'], { install: true });

// 日志函数
const plugins_name = 'Dsmggm_WeChatWorkBot';
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


/* 配置构造器 */
const jsonSchema = BncrCreateSchema.object({
  switch: BncrCreateSchema.boolean().setTitle('是否开启插件').setDescription(`设置为关则不加载该插件`).setDefault(false),
  // option: BncrCreateSchema.array(BncrCreateSchema.object({
  //   BotID: BncrCreateSchema.string().setTitle('BotID').setDefault(''),
  //   Secret: BncrCreateSchema.string().setTitle('Secret').setDefault(''),
  //   enable: BncrCreateSchema.boolean().setTitle().setDescription('机器人开关').setDefault(true),
  // })),
  BotID: BncrCreateSchema.string().setTitle('BotID').setDefault(''),
  Secret: BncrCreateSchema.string().setTitle('Secret').setDefault(''),
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

  // 实例化一个适配器
  const WWB = new Adapter('WechatWorkBot');

  // 引入企业微信机器人SDK
  const AiBot = require('@wecom/aibot-node-sdk');

  // 1. 创建客户端实例
  const wsClient = new AiBot.WSClient({
    botId: ConfigDB.userConfig.BotID,       // 企业微信后台获取的机器人 ID
    secret: ConfigDB.userConfig.Secret,  // 企业微信后台获取的机器人 Secret
  });

  // 2. 建立连接（支持链式调用）
  wsClient.connect();

  // 3. 监听认证成功事件
  wsClient.on('authenticated', () => {
    logger.info('🔐 认证成功');
  });


  /////////【 接收消息】/////////
  let msgInfo = {};

  ///////////////// 文本消息
  /*
  返回示例：
  {
    "msgid": "1a59d91d9beb3b6exxxxx6064c1c6",
    "aibotid": "aibpuxxxxQGtcUd_ShARSxxxxHZ1Ac_T83",
    "chattype": "single",
    "from": {
        "userid": "Yxxxxx"
    },
    "msgtype": "text",
    "response_url": "https://qyapi.weixin.qq.com/cgi-bin/aibot/response?response_code=F7dK-1ZrTLyHmxxxUewAA_q_tnd15yxxxvJk7jLWtCoeGw-0N0r1mn6xxxxUe4WTJ8ud6N7L_KQPm9Gv",
    "text": {
        "content": "你好"
    }
  }
  */
  wsClient.on('message.text', (frame) => {
    // logger.debug('【官方原始frame】: ' + JSON.stringify(frame, null, 2));
    // logger.info('文本消息：' + frame.body.text?.content);
    // logger.info('发送人userid：' + frame.body?.from?.userid);
    // logger.info('消息类型：' + frame.body?.msgtype);    // 消息类型text、image、mixed、voice、file
    // logger.info('聊天类型：' + frame.body?.chattype);    // single私聊  group群聊
    // logger.info('消息id：' + frame.body?.msgid);    // 消息id
    // if(frame.body?.chattype === 'group'){
    //   logger.info('群聊id：' + frame.body?.chatid);
    // }



    msgInfo = {
      userId: frame.body?.from?.userid || '',    // 用户ID
      userName: frame.body?.from?.userid || '',    // 用户名
      groupId: frame.body?.chattype === 'single' ? '0' : (frame.body?.chatid || ''),
      groupName: frame.body?.chattype === 'single' ? '' : (frame.body?.chatid || ''),
      msg: frame.body?.text?.content || '',    // 文本消息内容
      msgId: frame.body?.msgid || '',
      type: 'text',
    }
    WWB.receive(msgInfo);
  });

  ///////////////// 图片消息
  /*
  返回示例：
  {
    "msgid": "1a0511870fxxxxx8bc38b56e",
    "aibotid": "aibpuMyxxxxxxx1Ac_T83",
    "chattype": "single",
    "from": {
        "userid": "xxxxxx"
    },
    "msgtype": "image",
    "response_url": "https://qyapi.weixin.qq.com/cgi-bin/aibot/response?response_code=2CCbxxxx3fabxmt-QAA_l3lDm2yMwrTiFFFxxxxxMYj9DPPHhl38bn8xxcpJ",
    "image": {
        "url": "https://ww-aibot-img-1258476243.cos.ap-guangzhou.myqcloud.com/mH7wwNX/762xxx9975154?sign=q-sign-algorithm%3Dsha1%26q-ak%3DAxxxU1UoGo%26q-sign-time%3D1774607114%3B17xx7414%26q-key-time%3D1774607114%3B1774607414%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3Db0bfd5xxx0d6ee53430d4851",
        "aeskey": "o+KCphAbT4uw0Fmxxx3U0gUn3FxvMe8rvI"
    }
  }
  */
  wsClient.on('message.image',async (frame) => {
    // logger.info('图片消息url：' + frame.body.image.url);
    // logger.info('图片消息aeskey：' + frame.body.image.aeskey);
    // logger.info('发送人userid：' + frame.body?.from?.userid);
    // logger.info('消息类型：' + frame.body?.msgtype);    // 消息类型text、image、mixed、voice、file
    // logger.info('聊天类型：' + frame.body?.chattype);    // single私聊  group群聊
    // logger.info('消息id：' + frame.body?.msgid);    // 消息id
    // if(frame.body?.chattype === 'group'){
    //   logger.info('群聊id：' + frame.body?.chatid);
    // }

    // 解密图片
    const base64image = await decryptFile(frame.body.image.url, frame.body.image.aeskey);
  
    msgInfo = {
      userId: frame.body?.from?.userid || '',    // 用户ID
      userName: frame.body?.from?.userid || '',    // 用户名
      groupId: frame.body?.chattype === 'single' ? '0' : (frame.body?.chatid || ''),
      groupName: frame.body?.chattype === 'single' ? '' : (frame.body?.chatid || ''),
      msg: base64image,    // 文本消息内容
      msgId: frame.body?.msgid || '',
      type: 'image',
    }
    WWB.receive(msgInfo);
  });

  ///////////////// 文件消息
  /*
  返回示例：
  {
    "msgid": "0474551cxxx7b296                                                                 ",
    "aibotid": "aibpuMyG1xxxxxxHZ1Ac_T83",
    "chattype": "single",
    "from": {
        "userid ": "Yxxxxx"
    },
    "msgtype": "file",
    "response_url": "https://qyapi.weixin.qq.com/cgi-bin/aibot/response?response_code=0-C6BnxKQuqAlR5xxxxxCpyE7Bi5xxxxxxxxbdhD3Gtl11V",
    "file": {
        "url": "https://ww-aibot-img-1258476243.cos.ap-guangzhou.myqcloud.com/rSFLfEt/7621xxxx43261?sign=q-sign-algorithm%3Dsha1%2xxxxxPuaO5f9U1UoGo%26q-sign-time%3D1774607125%3B1774607425%26q-key-time%3D1774607125%3B1774607425%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3D75a571d1f1b9c7c2a534f36099eb730f65a57d20",
        "aeskey": "EhhBSWU8RjxxxxxxxxwEqmaL13Qs"
    }
  }
  */
  wsClient.on('message.file',async (frame) => {
    // logger.info('文件消息url：' + frame.body.file.url);
    // logger.info('文件消息aeskey：' + frame.body.file.aeskey);
    // logger.info('发送人userid：' + frame.body?.from?.userid);
    // logger.info('消息类型：' + frame.body?.msgtype);    // 消息类型text、image、mixed、voice、file
    // logger.info('聊天类型：' + frame.body?.chattype);    // single私聊  group群聊
    // logger.info('消息id：' + frame.body?.msgid);    // 消息id
    // if(frame.body?.chattype === 'group'){
    //   logger.info('群聊id：' + frame.body?.chatid);
    // }

    const base64file = await decryptFile(frame.body.file.url, frame.body.file.aeskey);
    
    msgInfo = {
      userId: frame.body?.from?.userid || '',    // 用户ID
      userName: frame.body?.from?.userid || '',    // 用户名
      groupId: frame.body?.chattype === 'single' ? '0' : (frame.body?.chatid || ''),
      groupName: frame.body?.chattype === 'single' ? '' : (frame.body?.chatid || ''),
      msg: base64file,    // 文本消息内容
      msgId: frame.body?.msgid || '',
      type: 'file',
    }

    WWB.receive(msgInfo);
  });


  ///////////////// 图文混排
  /*
  返回示例：
  {
    "msgid": "29518xxxxxxxxxxxx62",
    "aibotid": "aibpuMyGxxxxxxxxxZ1Ac_T83",
    "chattype": "single",
    "from": {
        "userid": "xxxxxxxx"
    },
    "msgtype": "mixed",
    "response_url": "https://qyapi.weixin.qq.com/cgi-bin/aibot/response?response_code=V-RLxxxxxxxgAA_zjAb-cyj0WUqocTao5o_sWXO8xxxxxxxxx3mHLgx-ksuNlmGxxxxxxKS",
    "mixed": {
        "msg_item": [
            {
                "msgtype": "image",
                "image": {
                    "url": "https://ww-aibot-img-1258476243.cos.ap-guangzhou.myqcloud.com/iF4pVFF/762187zzzzzzzz7035?sign=q-sign-algorithm%3Dsha1%26q-ak%zzzzzzzzzzzbcYcfyPuaO5f9U1UoGo%26q-sign-time%3D1774607119%3B1774607419%26q-key-time%3D1774607119%zzzz74607419%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3Dfe7f8zzzzzzzzzzzz0ac6463898",
                    "aeskey": "BGvSiLgjRvGuDzzzzzzzzzzqiy5xO894pYs"
                }
            },
            {
                "msgtype": "text",
                "text": {
                    "content": "2213"
                }
            }
        ]
    }
  }
  */
  wsClient.on('message.mixed', (frame) => {
    // 暂不支持，因为太麻烦不想写
  });


  ///////////////// 语音消息
  /*
  返回示例：
  {
    "msgid": "28564xxxxxxxxxxxxxxfdce",
    "aibotid": "aibpuMyGxxxxxxxxxxxxxxxAc_T83",
    "chattype": "single",
    "from": {
        "userid": "xxxxx"
    },
    "msgtype": "voice",
    "response_url": "https://qyapi.weixin.qq.com/cgi-bin/aibot/response?response_code=hLpWckaqRExxxxxxxx5AAA_vT7VT20xxxxxxxxxxxxxxxH7ijLrSvKW4-_0NSnxxxxxxxxxJTWwQUSFpL",
    "voice": {
        "content": ""
    }
  }
  */
  wsClient.on('message.voice', (frame) => {
    // 官方sdk里语音消息content是空的，暂不支持
  });

  // // 打印frame全部信息
  // logger.info('frame：' + JSON.stringify(frame, null, 2));


  // 解密图片或文件
  async function decryptFile(url, aeskey){
    try {
      // 核心：调用 SDK 下载 + 解密（一步完成）
      const { buffer, filename } = await wsClient.downloadFile(url, aeskey);

      // 保存到本地
      const path = require('path');
      const finalFilename = filename || `WeChatWorkBot_TempFile_${Date.now()}`;
      const savePath = path.join('/tmp', finalFilename);
      logger.info(`✅ 文件/图片已解密并保存到：${savePath}`);

      // 可选：把文件 base64 编码
      const base64File = buffer.toString('base64');
      return base64File;
    } catch (err) {
      logger.error('图片/文件 下载/解密失败：' + err.message);
    }
  }

  /////////【 接收消息结束】/////////



  /////////【 发送消息】/////////
  WWB.reply = async function (replyInfo) {
    const msgType = replyInfo.type || 'text';

    // 发送文本信息
    if (msgType === 'text') {
      // 判断群聊还是私聊
      const chatId = replyInfo.groupId === '0' ? replyInfo.userId : replyInfo.groupId;

      await wsClient.sendMessage(chatId, {
        msgtype: 'markdown', // 固定为text
        markdown: { content: replyInfo.msg },
      });
    

    // 发送图片信息
    } else if (msgType === 'image') {
      // 判断群聊还是私聊
      const chatId = replyInfo.groupId === '0' ? replyInfo.userId : replyInfo.groupId;
      // 读取图片文件
      const imageBuffer = fs.readFileSync(replyInfo.path);
      const result = await wsClient.uploadMedia(imageBuffer, {
        type: 'image',
        filename: replyInfo.path,
      });
      await sendMedie(replyInfo.path, msgType, chatId, 'image');


    // 发送文件信息
    } else if (msgType === 'file') {
      // 判断群聊还是私聊
      const chatId = replyInfo.groupId === '0' ? replyInfo.userId : replyInfo.groupId;
      await sendMedie(replyInfo.path, msgType, chatId, 'file');
    }
    return '';

    // 发送媒体通用函数
    async function sendMedie(path, msgType, chatId, WeComMediaType) {
      // 引入文件系统模块
      const fs = require('fs');

      // 上传图片
      const imageBuffer = fs.readFileSync(path);
      const result = await wsClient.uploadMedia(imageBuffer, {
        type: msgType,
        filename: path,
      });
      // 发送文件
      wsClient.sendMediaMessage(
        chatId,            // 会话 ID
        WeComMediaType, // 媒体类型：'file' | 'image' | 'voice' | 'video'
        result.media_id,           // 临时素材 media_id
      );
    }
  }
  
  
  /////////【 发送消息结束】/////////

  // 伪装信息
  WWB.inlinemask = async function (msgInfo) {
      return WWB.receive(msgInfo);
  };
  
  // 推送信息
  WWB.push = async function (replyInfo) {
    return this.reply(replyInfo);
  };

  return WWB;
}


