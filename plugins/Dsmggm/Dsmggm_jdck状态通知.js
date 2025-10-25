/**
 * @author Dsmggm
 * @name Dsmggm_jdck状态通知
 * @team Dsmggm
 * @version 1.0.3
 * @description https://github.com/dsmggm/svjdck jd账密通知插件
 * @rule ^(jdck状态通知)$
 * @admin true
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 * // 定时任务cron规则，默认1天，如需修改，请自行修改脚本
 * @cron 0 12 * * *
 */


// 插件说明内容
const describe_text =`
定时通知用户状态
`;
// 日志函数
const plugins_name = 'Dsmggm_jdck通知';
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
    switch: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
    ip:BncrCreateSchema.string().setTitle('svjdck容器IP').setDescription(`svjdck的容器ip，包括port端口，例如http://192.168.1.100:4321 。注意：如果是https协议请加s`),
    user:BncrCreateSchema.string().setTitle('用户名').setDescription(`svjdck后台管理用户名`).setDefault(''),
    password:BncrCreateSchema.string().setTitle('密码').setDescription(`svjdck后台管理密码`).setDefault(''),
    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);


const axios = require('axios');
async function get_ck() { 
  // 发送验证码
  try {
    const response = await axios.post(ConfigDB.userConfig.ip + '/admin/login', 
      {
        "adminname": ConfigDB.userConfig.user,
        "adminpasswd": ConfigDB.userConfig.password
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
      const token = response.headers.token;
      logger.info(`响应头: ${JSON.stringify(response.headers['set-cookie'][0])}`);
      const cookie = response.headers['set-cookie'][0];
      const tokenMatch = cookie.match(/token=([^;]+)/);
      return tokenMatch[1]
    } else {
      logger.error(`获取token失败，${response.data.msg}`);
    }
  } catch (error) {
    logger.error(`发送验证码失败，请联系管理员` + error.message);
  }
}


// 获取用户列表
async function get_users_list(token) {
  // 获取后台账号列表
  try {
    const response = await axios.post(ConfigDB.userConfig.ip + '/admin/users_list', 
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`
        },
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        })
      }
    );
    
    // 根据状态码处理不同情况
    if (response.status === 200) {
      // 获取成功，返回账号列表数据
      return response.data
    } else if (response.status === 401) {
      // 未登录或登录状态过期
      logger.error('未登录或登录状态过期');
    } else {
      // 其他错误
      logger.error('获取账号列表失败: ' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    logger.error('获取账号列表请求失败: ' + error.message);
    
    // 如果有响应数据，返回服务器的错误信息
    if (error.response && error.response.data) {
      logger.error('服务器错误: ' + error.response.data.msg);
    } else {
      // 如果没有响应数据，返回通用错误信息
      logger.error('网络请求失败: ' + error.message);
    }
  }
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
  if (ConfigDB.userConfig.switch == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 判断设置
  if (!ConfigDB.userConfig.ip || !ConfigDB.userConfig.user || !ConfigDB.userConfig.password) {
    logger.info('svjdck设置完成，请在插件配置中设置');
    return 'next';  // 继续向下匹配插件
  }


  
  // 请求jdck获取后台ck
  const token = await get_ck();
  if (!token) {
    logger.error('获取token失败，请检查用户名密码是否正确');
    return 'next';  // 继续向下匹配插件
  }
  
  // 获取用户列表
  const userslist = await get_users_list(token);
  if (!userslist) {
    logger.error('获取用户列表失败，请检查用户名密码是否正确');
    return 'next';  // 继续向下匹配插件
  }

  // userlist转为字典
  const user_dict = {};
  for (const user of userslist) {
    user_dict[user[5]] = {
      "phone": user[1],
      "pass": user[2],
      "remark": user[3],
      "UID": user[4],
      "jd_pt_pin": user[5],
      "status": user[6],
      "last": user[7],
      "pt_key": user[8]
    };
  }

  // 获取所有键
  const pinDB = new BncrDB('pinDB');
  const keys = await pinDB.keys();

  // 遍历所有键的Pin
  for (const key of keys) {
    // 获取到键列表
    const userdata = await pinDB.get(key);
    const pin_list = userdata.Pin;

    // 遍历pin列表
    for (const pin of pin_list) {
      if (user_dict[pin].status === '0') {
        text = `【jdck自动登录失败通知】\n账号:${user_dict[pin].remark} 自动登录已失效\n原因: ${user_dict[pin].last}`;

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
}



