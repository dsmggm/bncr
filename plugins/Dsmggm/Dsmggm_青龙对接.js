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
青龙开发参考api连接：https://qinglong-api.taozhiyu.tk/<br>
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
    qlseting: BncrCreateSchema.array(
      BncrCreateSchema.object({
        Name: BncrCreateSchema.string().setTitle('容器名称').setDescription(`自定义容器名，便于插件调用或者备注识别使用`),
        Host: BncrCreateSchema.string().setTitle('青龙访问IP与端口').setDescription(`例如http://192.168.10.10:5700`),
        ClientID: BncrCreateSchema.string().setTitle('Client ID').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Id`),
        ClientSecret: BncrCreateSchema.string().setTitle('Client Secret').setDescription(`青龙侧边栏-应用设置-右上角创建应用-赋予全部权限-复制Client Secret`),
      })
      ).setTitle('青龙设置').setDescription('可配置多个青龙').setDefault([{"Name": "京东容器1", "Host": "http://192.168.1.1:5700","ClientID": "w_z****FVc","ClientSecret": "qJw****-****Nrq"}
    ]),
  }).setTitle('设置').setDefault({}),
  
  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({}),
})
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);

// 创建青龙数据库实例
const qinglongDB = new BncrDB('qinglong');   


// 主函数
module.exports = async (sender) => {
  await ConfigDB.get();
  // 初始化保存判断
  if(!Object.keys(ConfigDB.userConfig).length) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.seting.enable == false) {
    logger.info('插件未启用~');
    return 'next';  // 继续向下匹配插件
  }

  // 插件默认触发函数，测试并写入全部青龙token并保存
  await for_all_qinglong();

  // 获取token，可用于刷新青龙连接状态
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
  // const delenv = await del_env(1640);
  // if (delenv) {
  //   logger.info(`删除变量成功:`);
  // } else {
  //   logger.error('删除变量失败');
  // }

  // 获取脚本内容
  // 传入参数：filename
  // 传入filename脚本名称，path脚本路径
  // 成功返回脚本内容，失败时返回false
  // const getscript = await get_script('test.py');
  // if (getscript) {
  //   logger.info(`获取脚本内容成功:`);
  // } else {
  //   logger.error('获取脚本内容失败');
  // }

  // 运行脚本
  // 传入参数：filename, content
  // 传入filename脚本名称，content脚本内容(可选)
  // 失败时返回false
  // 示例1——直接运行获取的脚本：
  // const runscript = await run_script('test.py', getscript.data);
  // if (runscript) {
  //   logger.info(`运行脚本成功:`);
  // } else {
  //   logger.error('运行脚本失败');
  // }
  // 示例2——-运行自定义脚本：
//   const code = `from datetime import datetime
// print(datetime.now())
// print('test')
// with open("timefile.txt", 'w', encoding='utf-8') as file:
//     file.write(str(datetime.now()))`
//   const runscript = await run_script('test.py', '', code);
//   if (runscript) {
//     logger.info(`运行脚本成功:`);
//   } else {
//     logger.error('运行脚本失败');
//   }

  // 获取日志列表
  // 成功时返回日志列表，失败时返回false
//   const getlogslist = await get_logs_list();
//   if (getlogslist) {
//     logger.info(`获取日志列表成功: `);
// getlogslist.data.forEach((log, index) => {
//   logger.info(`  [${index+1}] 完整日志对象: ${JSON.stringify(log, null, 2)}`);
//     })
//   } else {
//     logger.error('获取日志列表失败');
//   }

  // 获取青龙运行日志
  // 传入参数：file, path
  // 传入file日志文件名称，path日志文件路径
  // 失败时返回false
  // 示例1——获取某文件夹下某日志文件内容：
  // const getlog = await get_log('2025-09-28-21-28-00-204.log', '6dylan6_jdpro_jd_bean_change_665');
  // 示例2——获取日志根目录下某日志文件内容：
  // const getlog = await get_log('6dylan6_jdpro_jd_bean_change_665/2025-09-28-21-28-00-204.log');
  // if (getlog) {
  //   logger.info(`获取日志成功: ${getlog.data}`);
  // } else {
  //   logger.error('获取日志失败');
  // }


}


// 刷新全部青龙token并保存
async function for_all_qinglong() {
  for (const qldata of ConfigDB.userConfig.seting.qlseting) {
    // 获取token
    const qinglong = new ql(qldata.Name, qldata.Host, qldata.ClientID, qldata.ClientSecret);
    const token = await qinglong.get_ql_token();
    if (!token) {
      logger.error(`青龙${qldata.Name}连接失败，跳过保存`);
      return;
    }
  }
} 

/////////////////////↓↓↓↓↓↓↓↓↓青龙请求函数↓↓↓↓↓↓↓↓↓↓//////////////////////////////



class ql { 
  constructor(Name = '', Host = '', ClientID = '', ClientSecret = '') {
    this.Name = Name;
    this.Host = Host;
    this.ClientID = ClientID;
    this.ClientSecret = ClientSecret;
    this.token = '';
    // 这里还需要写只传入Name的时候，从数据库读取其它参数的功能
    if (Host === '') {
      const abc = qinglongDB.get(Name);
      this.Host = abc.Host;
      this.ClientID = abc.ClientID;
      this.ClientSecret = abc.ClientSecret;
      this.token = abc.token;
    }
  }

  
  // 获取token
  async get_ql_token() {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.get(this.Host + '/open/auth/token', {
          params: {
            client_id: this.ClientID,
            client_secret: this.ClientSecret,
          },
        });
        
        logger.info('青龙连接成功-token: ' + response.data.data.token);
        qinglongDB.set(this.Name, {
          'Name': this.Name,
          'Host': this.Host,
          'ClientID': this.ClientID,
          'ClientSecret': this.ClientSecret,
          'token': response.data.data.token 
        });
        return response.data.data.token;
        
      } catch (error) {
        logger.error('青龙连接失败: ' + error.message);
      };
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      // this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  
  
  // 获取全部变量
  async get_envs() {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.get(this.Host + '/open/envs', {
          headers: {
            Authorization: 'Bearer ' + this.token,
          }
        });
        return response.data.data;
      } catch (error) {
        logger.error(`第${i}次-ql变量获取失败: ` + error.message);
      }
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  
  
  
  // 添加变量
  async add_env(value, name, remarks = '') {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.post(this.Host + '/open/envs', 
          [{
            "value": value,
            "name": name,
            "remarks": remarks
          }],
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
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
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  
  
  // 更新变量
  async update_env(id, value, name, remarks = '') {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.put(this.Host + '/open/envs', 
          {
            "id": id,
            "value": value,
            "name": name,
            "remarks": remarks
          },
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
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
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  
  // 禁用变量
  async disable_env(id) {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.put(this.Host + '/open/envs/disable', 
          [ id ],
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
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
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  // 启用变量
  async enable_env(id) {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.put(this.Host + '/open/envs/enable', 
          [ id ],
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
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
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
  
  // 删除变量
  async del_env(id) {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.delete(this.Host + '/open/envs', 
          {
            data: [ id ],
            headers: {
              Authorization: 'Bearer ' + this.token,
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
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }



  // 获取脚本内容
  async get_script(file, path = '') {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.get(this.Host + '/open/scripts/detail', 
          {
            params: {
              file: file,
              path: path
            },
            headers: {
              Authorization: 'Bearer ' + this.token
            }
          }
        );
        return response.data;
      } catch (error) {
        logger.error(`第${i}次-ql获取${file}脚本内容失败: ` + error.message);
      }
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }


  // 运行脚本
  async run_script(filename, content = '') {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.put(this.Host + '/open/scripts/run', 
          {
            "filename": filename,
            "path": '',
            "content": content
          },
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
              'Content-Type': 'application/json'
            },
          }
        );
        return response.data;
      } catch (error) {
        logger.error(`第${i}次-ql运行${filename}脚本失败: ` + error.message);
      }
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }


  // 获取日志列表
  async get_logs_list() {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.get(this.Host + '/open/logs', 
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
              // 'Content-Type': 'application/json'
            },
          }
        );
        return response.data;
      } catch (error) {
        logger.error(`第${i}次-ql获取日志列表失败: ` + error.message);
      }
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }


// 获取日志
  async get_log(file, path = '') {
    for (let i = 1; i < 4; i++) {
      
      /////////////////////////代码编辑区////////////////////////////////
      try {
        const response = await axios.get(this.Host + `/open/logs/detail`, 
          {
            params:{
              file: file,
              path: path
            },
            headers: {
              Authorization: 'Bearer ' + this.token,
            },
          }
        );
        return response.data;
      } catch (error) {
        logger.error(`第${i}次-ql获取${path}${file}日志失败: ` + error.message);
      }
      
      //////////////////////////////////////////////////////////////////
      
      // 等待一段时间再重试（指数退避）
      await sysMethod.sleep(5);
      this.get_ql_token();  // 重新获取青龙token
    }
    return false;
  }
}

////////////////////////////////////////////////////////////////////////////

// 导出模块
module.exports.ql = ql;

