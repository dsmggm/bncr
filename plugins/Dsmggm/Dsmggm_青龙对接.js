/**
 * @author Dsmggm
 * @name Dsmggm_青龙对接
 * @team Dsmggm
 * @version 1.0.0
 * @description 青龙对接工具
 * @rule ^(qltest)$
 * @admin true
 * @public false
 * @priority 3
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
1、配置青龙:<br>
设置用于对接青龙<br>
`;

const axios = require('axios');

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
  seting: BncrCreateSchema.object({
    enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
    qlip: BncrCreateSchema.string().setTitle('青龙访问IP与端口').setDescription(`例如http://192.168.10.10:5700`).setDefault('http://192.168.10.10:5700'),
    ClientId: BncrCreateSchema.string().setTitle('Client Id').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Id`),
    ClientSecret: BncrCreateSchema.string().setTitle('Client Secret').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Secret`),
  }).setTitle('设置').setDefault({}),
  
  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({}),
  token: BncrCreateSchema.string().setTitle('token').setDescription(`连接token，不用填，自动生成`)
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
  if (ConfigDB.userConfig.seting.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  // 插件默认触发函数
  // 测试青龙连接,并保存token，可用于刷新青龙连接状态
  // 成功时返回token，失败时返回false
  // if (await get_ql_token()) {
  //   sender.reply('青龙连接正常');
  // } else {
  //   sender.reply('青龙连接失败');
  // }

  // 获取青龙变量
  // 成功时返回环境变量数组，失败时返回false
  // const envs = await get_envs();
  // logger.info();
  // envs.forEach((env, index) => {
  //   logger.info(`  [${index+1}] 名称: ${env.name}, 值: ${env.value}, 备注: ${env.remarks || '无'}`);
  // })

  // 添加变量
  // 传入参数：value, name, remarks
  // value为变量值，name为变量名，remarks(可选)为变量备注
  // 失败时返回false
  // const addenv = await add_env('testvalue', 'testname', 'testremarks');
  // if (addenv) {
  //   logger.info(`添加变量成功: 名称: ${addenv[0].name}, 值: ${addenv[0].value}, 备注: ${addenv[0].remarks || '无'}`);
  // } else {
  //   logger.info('添加变量失败');
  // }

  // 更新变量
  // 传入参数：id, value, name, remarks
  // 根据id更新某个变量，value为变量值，name为变量名，remarks(可选)为变量备注
  // 失败时返回false
  // const updateenv = await update_env(1640, '11111', 'dasdasd', '3');
  // if (updateenv) {
  //   logger.info(`更新变量成功:`);
  // } else {
  //   logger.error('更新变量失败');
  // }

  // 禁用变量
  // 传入参数：id
  // 根据id禁用某个变量
  // 失败时返回false
  // const disableenv = await disable_env(1640);
  // if (disableenv) {
  //   logger.info(`禁用变量成功:`);
  // } else {
  //   logger.error('禁用变量失败');
  // }

  // 启用变量
  // 传入参数：id
  // 根据id启用某个变量
  // 失败时返回false
  // const enableenv = await enable_env(1640);
  // if (enableenv) {
  //   logger.info(`启用变量成功:`);
  // } else {
  //   logger.error('启用变量失败');
  // }

  // 删除变量
  // 传入参数：id
  // 根据id删除某个变量
  // 失败时返回false
  const delenv = await del_env(1640);
  if (delenv) {
    logger.info(`删除变量成功:`);
  } else {
    logger.error('删除变量失败');
  }

  // 运行脚本
  // 获取青龙运行日志

}



/////////////////////↓↓↓↓↓↓↓↓↓青龙请求函数↓↓↓↓↓↓↓↓↓↓//////////////////////////////

// 获取token
async function get_ql_token(){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.get(ConfigDB.userConfig.seting.qlip + '/open/auth/token', {
        params: {
          client_id: ConfigDB.userConfig.seting.ClientId,
          client_secret: ConfigDB.userConfig.seting.ClientSecret,
        },
      });

      logger.info('青龙连接成功-token: ' + response.data.data.token);
      const tokenvalue = ConfigDB.userConfig;
      tokenvalue.token = response.data.data.token;
      ConfigDB.set(tokenvalue);
      return response.data.data.token;

    } catch (error) {
        logger.error('青龙连接失败: ' + error.message);
      };

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    // await get_ql_token();  // 重新获取青龙token
  }
  return false;
}



// 获取全部变量
async function get_envs(){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.get(ConfigDB.userConfig.seting.qlip + '/open/envs', {
        headers: {
          Authorization: 'Bearer ' + ConfigDB.userConfig.token,
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error(`第${i}次-ql变量获取失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}




// 添加变量
async function add_env(value, name, remarks = ''){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.post(ConfigDB.userConfig.seting.qlip + '/open/envs', 
        [{
          "value": value,
          "name": name,
          "remarks": remarks
        }],
        {
          headers: {
            Authorization: 'Bearer ' + ConfigDB.userConfig.token,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data.data;
    } catch (error) {
      logger.error(`第${i}次-ql添加变量失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}



// 更新变量
async function update_env(id, value, name, remarks = ''){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.put(ConfigDB.userConfig.seting.qlip + '/open/envs', 
        {
          "id": id,
          "value": value,
          "name": name,
          "remarks": remarks
        },
        {
          headers: {
            Authorization: 'Bearer ' + ConfigDB.userConfig.token,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data.data;
    } catch (error) {
      logger.error(`第${i}次-ql更新变量失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}


// 禁用变量
async function disable_env(id){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.put(ConfigDB.userConfig.seting.qlip + '/open/envs/disable', 
        [ id ],
        {
          headers: {
            Authorization: 'Bearer ' + ConfigDB.userConfig.token,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`第${i}次-ql禁用变量失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}

// 启用变量
async function enable_env(id){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.put(ConfigDB.userConfig.seting.qlip + '/open/envs/enable', 
        [ id ],
        {
          headers: {
            Authorization: 'Bearer ' + ConfigDB.userConfig.token,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`第${i}次-ql启用变量失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}

// 删除变量
async function del_env(id){
  for (let i = 1; i < 4; i++) {

    /////////////////////////代码编辑区////////////////////////////////
    try {
      const response = await axios.delete(ConfigDB.userConfig.seting.qlip + '/open/envs', 
        [ id ],
        {
          headers: {
            Authorization: 'Bearer ' + ConfigDB.userConfig.token,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`第${i}次-ql删除变量失败: ` + error.message);
    }

    //////////////////////////////////////////////////////////////////

    // 等待一段时间再重试（指数退避）
    await sysMethod.sleep(5);
    await get_ql_token();  // 重新获取青龙token
  }
  return false;
}


// 运行脚本
// 获取青龙运行日志


////////////////////////////////////////////////////////////////////////////

// 导出模块
module.exports.get_ql_token = get_ql_token;
module.exports.get_envs = get_envs;
module.exports.add_env = add_env;
module.exports.update_env = update_env;
module.exports.disable_env = disable_env;
module.exports.enable_env = enable_env;
module.exports.del_env = del_env;
