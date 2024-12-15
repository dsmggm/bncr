/**
 * @author Dsmggm
 * @name Dsmggm_插件更新
 * @team Dsmggm
 * @version 1.0.0
 * @description 交互式菜单，可以设置是否触发插件，目前仅测试了Gewechat。用了都说妙~
 * @rule ^(插件更新)$
 * @rule ^(更新插件)$
 * @admin true
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 * // 定时任务cron规则，默认1天，如需修改，请自行修改脚本
 * @cron 1 1 1 1 * *
 */

// 插件说明内容
const describe_text = `
无需填写无界ip与账号密码，即可使用更新插件功能。<br>
<br>
1. 更新命令“插件更新”或“更新插件”。 <br>
2. 可设置全部更新。 <br>
3. 可设置黑名单模式。 <br>
4. 可设置白名单。 <br>
5. 可设置定时运行，修改脚本顶部注释块，使用cron时间规则，不懂默认即可，默认1天更新一次。 <br>
6. 插件更新后，可选重启无界。 <br>
7. 插件更新规则是不管是否有可升级都进行重新拉取。 <br>
`;

// 日志函数
const logMessage = (level, message) => {
  const timestamp = sysMethod.getTime('yyyy-MM-dd hh:mm:ss');
  
  // 根据 level 选择合适的 console 方法
  switch (level) {
    case 'ERROR':
      console.error(`[${timestamp}] [${level}] Dsmggm_插件更新 - ${message}`);
      break;
    case 'WARN':
      console.warn(`[${timestamp}] [${level}] Dsmggm_插件更新 - ${message}`);
      break;
    case 'INFO':
      console.info(`[${timestamp}] [${level}] Dsmggm_插件更新 - ${message}`);
      break;
    case 'DEBUG':
      console.debug(`[${timestamp}] [${level}] Dsmggm_插件更新 - ${message}`);
      break;
    default:
      console.log(`[${timestamp}] [${level}] Dsmggm_插件更新 - ${message}`);
      break;
  }
};

// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
  // 开关
  enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
  
  // 重启按钮
  reboot: BncrCreateSchema.boolean().setTitle('重启开关').setDescription(`更新插件后是否自动重启`).setDefault(false),

  // 模式
  Select: BncrCreateSchema.string().setTitle('模式').setDescription('选择更新插件的方式，黑名单，白名单，全部更新').setEnum(['全部更新', '黑名单', '白名单']),
  
  // 名单列表
  rooms: BncrCreateSchema.array(BncrCreateSchema.string().setTitle('').setDefault('')).setTitle('名单列表').setDescription('设置白名单或黑名单列表，如:\'qq.js\'。只有在黑名单模式跟白名单模式有效'),

  // 说明
  describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
});
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);


// 第一步：登录并获取token
async function login(username, password) {
  const response = await fetch(`http://127.0.0.1:9090/webApi/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ userName: username, password: password })
  });
  const data = await response.json();
  return data.data.token;
}

// 第二步：获取子URL数组
async function getSubUrlArray(token) {
  try {
    const response = await fetch(`http://127.0.0.1:9090/webApi/getSubUrlArray`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('获取子URL数组请求失败');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    logMessage('error', `获取子URL数组失败: ${error}`);
    throw error;
  }
}

// 第三步：获取子URL数据
async function getSubUrlData(token, subArray) {
  try {
    const response = await fetch(`http://127.0.0.1:9090/webApi/getSubUrlData`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subArray })
    });

    if (!response.ok) {
      throw new Error('获取子URL数据请求失败');
    }

    const data = await response.json();

    return data.data;
  } catch (error) {
    logMessage('error', `获取子URL数据失败: ${error}`);
    throw error;
  }
}

// 第四步：返回筛选后的列表
function filterInstalledPlugins(pluginsData) {
  let installedPlugins = [];

  // 筛选出isInstall为true的插件信息
  for (const data of pluginsData) {
    if (data.pluginsList) {
      // 遍历每个插件列表
      for (const plugin of data.pluginsList) {
        if (plugin.isInstall) {
          plugin.remarks = data.remarks;
          plugin.subUrl = data.subUrl;
          installedPlugins.push(plugin);
        }
      }
    }
  }
  return installedPlugins;
}

// 第五步：安装插件
async function installPlugins(token, plugins) {
  for (const plugin of plugins) {
    try {
      // 获取插件内容
      const contentResponse = await fetch(`http://127.0.0.1:9090/webApi/getSubUrlPluginsContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: plugin.type, remarks: plugin.remarks, subUrl: plugin.subUrl, id: plugin.id })
      });

      if (!contentResponse.ok) {
        throw new Error(`获取插件内容 ${plugin.filename} 失败`);
      }

      const contentData = await contentResponse.json();
      // 安装插件
      const installResponse = await fetch(`http://127.0.0.1:9090/webApi/savePluginsContent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: contentData.data,
          noBncrDataPath: plugin.fileDir,
          errMsg: `安装插件 ${plugin.filename} 失败!`,
          okMsg: `安装插件 ${plugin.filename} 成功!`
        })
      });

      if (!installResponse.ok) {
        throw new Error(`安装插件 ${plugin.filename} 失败`);
      }

    } catch (error) {
      logMessage('error', `处理插件 ${plugin.filename} 失败, ${error}`);
    }
  }
}

// 主函数，执行所有步骤
function selectplugins(installedPlugins) {
  // 获取模式配置
  const mode = ConfigDB.userConfig.Select;

  // 全部更新
  if (mode === '全部更新') {
    return installedPlugins;
  }

  // 获取名单列表
  const rooms = ConfigDB.userConfig.rooms;
  // 筛选出符合名单列表的插件

  // 黑名单
  if (mode === '黑名单') {
    const filteredPlugins = installedPlugins.filter(plugin => !rooms.includes(plugin.filename));
    return filteredPlugins;
  }

  // 白名单
  if (mode === '白名单') {
    const filteredPlugins = installedPlugins.filter(plugin => rooms.includes(plugin.filename));
    return filteredPlugins;
  }
}


module.exports = async (s) => {
  await ConfigDB.get();
  
  // 初始化保存判断
  if (!Object.keys(ConfigDB.userConfig).length) {
    logMessage('INFO', '插件未启用~');
    return 'next';  // 继续向下匹配插件
  }
  // 开关判断
  if (ConfigDB.userConfig.enable == false) {
    logMessage('INFO', '插件未启用~');
    return 'next';
  }

  // sysMethod.cron.newCron('50 * * * * *', () => {
  //   sysMethod.inline('更新插件');
  // });

  // 更新主函数
  try {
    await s.reply('开始更新');
    // 登录
    const systemdb = new BncrDB('system');
    const username = await systemdb.get('name');
    const password = await systemdb.get('password');
    const token = await login(username, password);
  
    // 获取订阅信息，包括订阅类型type，订阅备注remarks，订阅链接subUrl
    const subUrlArray = await getSubUrlArray(token);
  
    // 获取插件信息，包括插件文件名filename，安装状态isInstall，文件路径fileDir，插件id
    const subUrlData = await getSubUrlData(token, subUrlArray);
  
    // 筛选已安装的插件列表，并将remarks与subUrl添加到插件对象中返回
    const installedPlugins = filterInstalledPlugins(subUrlData);
  
    // 名单模式列表处理
    const pluginslist = selectplugins(installedPlugins);
  
    // 安装插件
    await installPlugins(token, pluginslist);
  
    await s.reply('更新完成');
  } catch (error) {
    logMessage('error', `插件更新失败: ${error}`);
    s.reply(`插件更新失败：${error}`);
  }

  if (ConfigDB.userConfig.reboot == true) {
    sysMethod.inline('重启');
  }
  
  return 'next';
};