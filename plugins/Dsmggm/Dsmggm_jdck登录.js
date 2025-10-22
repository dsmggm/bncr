/**
 * @author Dsmggm
 * @name Dsmggm_jdck登录
 * @team Dsmggm
 * @version 1.0.3
 * @description https://github.com/dsmggm/svjdck jd账密登录插件
 * @rule ^(jd登录|jd登陆|登陆|登录|登录jd|登陆jd|jd)$
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
const plugins_name = 'Dsmggm_jdck登录';
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
      ip:BncrCreateSchema.string().setTitle('svjdck容器IP').setDescription(`svjdck的容器ip，包括port端口，例如http://192.168.1.100:4321 。注意：如果是https协议请加s`)
  }).setTitle('设置').setDefault({}),

    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);













// 京东登录类
class jdlogin{
  constructor() {
    this.username = '';
    this.password = '';
    this.remarks = '';
    this.uid = '';
  }

  async sendcode(phone) { 
    this.username = phone;
    // 发送验证码
    try {
      const response = await axios.post(ConfigDB.userConfig.settings.ip + '/sendcode', 
        {
          "username": phone,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          httpsAgent: new (require('https')).Agent({
            rejectUnauthorized: false
          })
        }
      );
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      logger.error(`${this.username}发送验证码失败: ` + error.message);
      
      // 如果有响应数据，返回服务器的错误信息
      if (error.response && error.response.data) {
        return error.response.data;
      } else {
        // 如果没有响应数据，返回通用错误信息
        logger.error(`发送验证码失败，请联系管理员` + error.message);
        return {msg: '发送验证码失败，请联系管理员'};
      }
    }
  }

  async verifycode(code) {
    // 发送验证码
    try {
      const response = await axios.post(ConfigDB.userConfig.settings.ip + '/verifycode', 
        {
          "username": this.username,
          "code": code,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          httpsAgent: new (require('https')).Agent({
            rejectUnauthorized: false
          })
        }
      );
      this.password = response.data.password;
      this.remarks = response.data.remarks;
      this.uid = response.data.uid;
      return response.data;
    } catch (error) {
      logger.error(`${this.username}提交验证码: ` + error.message);
      
      // 如果有响应数据，返回服务器的错误信息
      if (error.response && error.response.data) {
        return error.response.data;
      } else {
        // 如果没有响应数据，返回通用错误信息
        return {msg: '提交验证码出错，请联系管理员'};
      }
    }
  }
  
  async submit_user_info(password = '', remarks = '') {
    if (password !== '') {
      this.password = password;
    }
    if (remarks !== '') {
      this.remarks = remarks;
    }
    // 提交用户信息
    try {
      logger.info(`username类型: ${typeof this.username}, 值: ${this.username}`);
      logger.info(`password类型: ${typeof this.password}, 值: ${this.password}`);
      logger.info(`remarks类型: ${typeof this.remarks}, 值: ${this.remarks}`);
      logger.info(`uid类型: ${typeof this.uid}, 值: ${this.uid}`);
      const response = await axios.post(ConfigDB.userConfig.settings.ip + '/submit_user_info', 
        {
          "username": this.username,
          "remark": this.remarks,
          "password": this.password,
          "uid": this.uid,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          httpsAgent: new (require('https')).Agent({
            rejectUnauthorized: false
          })
        }
      );
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      
      // 如果有响应数据，返回服务器的错误信息
      if (error.response && error.response.data) {
        logger.error(`${this.username}提交用户信息失败: ` + error.message);
        return error.response.data;
      } else {
        // 如果没有响应数据，返回通用错误信息
        logger.error(`提交用户信息出错，请联系管理员` + error.message);
        return {msg: '提交用户信息出错，请联系管理员'};
      }
    }
  }

  async wxpusher_qrcode() {
    // 获取扫码图片
    try {
      const response = await axios.post(ConfigDB.userConfig.settings.ip + '/wxpusher_qrcode', 
        {
          "username": this.username
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          httpsAgent: new (require('https')).Agent({
            rejectUnauthorized: false
          })
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`${this.username}请求uid出错: ` + error.message);
      
      // 如果有响应数据，返回服务器的错误信息
      if (error.response && error.response.data) {
        return error.response.data;
      } else {
        // 如果没有响应数据，返回通用错误信息
        logger.error(`${this.username}登录失败: 请求uid出错，请联系管理员` + error.message);
        return {msg: '请求uid出错，请联系管理员'};
      }
    }
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
  if (!ConfigDB.userConfig.settings.ip) {
    logger.info('svjdck容器IP未设置，请在插件配置中设置');
    return 'next';  // 继续向下匹配插件
  }

  const isgroup = await sender.getGroupId()
  if (isgroup !== "0") {
    return sender.reply('请私聊我进行登录');
  }

  // 请输入登录账号
  await sender.reply('请输入jd手机号\n回复q退出');
  let phone = await sender.waitInput(async (s)=> {
    // sender.reply('请输入登录账号，q退出');
    
    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
      // 判断是不是11位手机号
    } else if (!(/^1\d{10}$/.test(msg))) {
      await sender.reply('请输入正确的手机号');
      return 'again';
    }
  }, 120);
  if (phone === null) return sender.reply('超时自动退出');
  if (phone.getMsg() === 'q') return sender.reply('已退出');
  
  const login = new jdlogin();
  // 正在发送验证码
  await sender.reply('正在发送验证码...');
  const sendcode_status = await login.sendcode(phone.getMsg());
  if (sendcode_status.msg !== '验证码发送成功') {
    sender.reply(`发送验证码失败：${sendcode_status.msg}`);
    return
  } else {
    sender.reply(`${sendcode_status.msg}`);
  }

  // 输入验证码
  while (true) {
    sender.reply('请输入验证码\n回复q退出');
    let code = await sender.waitInput(async (s)=> {
      
      let msg = s.getMsg();
      if (msg === 'q') {
        return 'q';                   //等价
        // 判断是不是6个数字
      } else if (!(/\d{6}$/.test(msg))) {
        sender.reply('请输入正确验证码');
        return 'again';
      }
    }, 120);
    if (code === null) return sender.reply('超时自动退出');
    if (code.getMsg() === 'q') return sender.reply('已退出');

    await sender.reply(`正在验证...`);
    // 判断验证码是否正确
    const code_status = await login.verifycode(code.getMsg());
    if (code_status.msg === '登录成功') {
      await sender.reply('登录成功，ck已提交');
      await sysMethod.sleep(1);
      await sender.reply(`账号：${phone.getMsg()}\n密码：${code_status.password}\n备注：${code_status.remarks}`);
      await bind_pin(sender, code_status.pt_pin);      // 绑定pin到数据库
      break;
    } else {
      await sender.reply(`验证码失败：${code_status.msg}`);
      return;
    }
  }

  // 提交密码
  await sysMethod.sleep(1);
  await sender.reply('请输入登录密码用于密码自动登录\n回复c跳过此步骤\n回复q退出');
  let password = await sender.waitInput(async (s)=> {
    
    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';                   //等价
      // 判断是不是11位手机号
    }
    if ( msg === 'c') {
      return 'c';
    }
  }, 120);
  if (password === null) return sender.reply('超时自动退出');
  if (password.getMsg() === 'q') return sender.reply('已退出');
  let passwordMsg = password.getMsg();
  if (password.getMsg() === 'c') {
    passwordMsg = '';
  }

  // 备注
  await sender.reply('请输入账号备注\n回复c跳过此步骤\n回复q退出');
  let remarks = await sender.waitInput(async (s)=> {
    
    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';
    }
    if ( msg === 'c') {
      return 'c';
    }
  }, 120);
  if (remarks === null) return sender.reply('超时自动退出');
  if (remarks.getMsg() === 'q') return sender.reply('已退出');
  let remarksMsg = remarks.getMsg();
  if (remarks.getMsg() === 'c') {
    remarksMsg = '';
  }

  // 如果密码或者备注不是空的就进行提交
  if (password !== '' || remarks !== '') {
    const sumbit_status = await login.submit_user_info(passwordMsg, remarksMsg);
    if (sumbit_status.msg === '提交用户信息成功') {
      await  sender.reply('提交成功');
    } else {
      await sender.reply(`提交失败：${sumbit_status.msg}`);
      return
    };
  };

  
  // 扫码提交uid
  const uid_qrcode = await login.wxpusher_qrcode();
  await sender.reply('扫码关注WxPusher，接受推送消息(可忽略)')
  if (uid_qrcode.msg === '处理成功') {
    await sender.reply({
      type: 'image', // video
      msg: '',
      path: uid_qrcode.data.shortUrl,
    });
    return;
  }
  
}



