/**
 * @author Dsmggm
 * @name Dsmggm_jd查询
 * @team Dsmggm
 * @version 1.0.0
 * @description 京东账号查询插件
 * @rule ^(jdcx|京东查询|jd查询|查询)$
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
const plugins_name = 'Dsmggm_jd查询';
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
const { log } = require('wechaty');

// 构建插件配置
const jsonSchema = BncrCreateSchema.object({
    // 开关
    settings: BncrCreateSchema.object({
      enable: BncrCreateSchema.boolean().setTitle('插件开关').setDescription(`设置为关则插件不启用`).setDefault(false),
      container:BncrCreateSchema.string().setTitle('京东容器名称').setDescription(`与青龙对接容器名称一致`).setDefault('jd'),
  }).setTitle('设置').setDefault({}),

    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);




let UserAgents;








//////////////////////////////////////////京豆明细查询//////////////////////////////////////

//日期转字符串格式
function DateToStr(date) {
    var year = date.getFullYear();//年
    var month = date.getMonth();//月
    var day = date.getDate();//日
    return year + "-" +
        ((month + 1) > 9 ? (month + 1) : "0" + (month + 1)) + "-" +
        (day > 9 ? day : ("0" + day));
}
async function getJingBeanBalanceDetail(cookie, page = 1) {
    const body = encodeURIComponent(JSON.stringify({ "pageSize": "20", "page": page.toString() }));
    
    try {
        const response = await axios({
            url: "https://api.m.jd.com/client.action?functionId=getJingBeanBalanceDetail",
            method: "post",
            data: "body=" + body + "&appid=ld",
            headers: {
                "User-Agent": UserAgents(),
                "Host": "api.m.jd.com",
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": cookie
            },
            timeout: 10000
        });
        
        return response.data;
    } catch (error) {
        logger.error(`请求失败: ${error.message}`);
        return null;
    }
}

async function getJingBeanBalanceDetail2(cookie, page = 1) {
    const body = encodeURIComponent(JSON.stringify({ "pageSize": "20", "page": page.toString() }));
    
    try {
        const response = await axios({
            url: "https://bean.m.jd.com/beanDetail/detail.json?page=" + page,
            method: 'POST',
            data: "body=" + body + "&appid=ld",
            headers: {
                'User-Agent': UserAgents(),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
            },
            timeout: 10000
        });
        
        return response.data;
    } catch (error) {
        logger.error(`请求失败: ${error.message}`);
        return null;
    }
}

//汇总豆豆
async function sumBean(cookie) {
    //统计收入
    var todayIn = 0
    var todayOut = 0
    var yesterIn = 0
    var yesterOut = 0
    //获取当前日期
    var curDate = new Date();
    var yesDate = new Date();
    yesDate.setDate(curDate.getDate() - 1)
    //日期字符串
    strToday = DateToStr(curDate)
    strYester = DateToStr(yesDate)
    page = 1
    while (true) {
        data = await getJingBeanBalanceDetail2(cookie, page)
        //Debug(JSON.stringify(data))
        exitWhile = false
        if (data) {
            obj = data
            try {
                if (!data.jingDetailList) {
                    data = { jingDetailList: await getJingBeanBalanceDetail(cookie, page).detailList }
                }
            }
            catch (e) {
                return
            }
            for (i = 0; i < data.jingDetailList.length; i++) {
                dateStr = data.jingDetailList[i].date
                if (dateStr.slice(0, 10) == strToday) {
                    amount = parseInt(data.jingDetailList[i].amount)
                    if (amount > 0) {
                        todayIn += amount
                    } else {
                        todayOut += amount
                    }
                } else if (dateStr.slice(0, 10) == strYester) {
                    amount = parseInt(data.jingDetailList[i].amount)
                    if (amount > 0) {
                        yesterIn += amount
                    } else {
                        yesterOut += amount
                    }

                } else {
                    exitWhile = true
                    break
                }
            }
        } else {
            break
        }
        if (exitWhile) {
            break
        }
        page++
    }
    return `【🫘京豆】\n今日收入: ${todayIn}  今日支出: ${todayOut}\n昨日收入 ${yesterIn}  昨日支出：${yesterOut}`
}


//获取红包数据
async function getRedPacket(cookie) {
    try {
        const response = await axios({
            url: `https://api.m.jd.com/client.action?functionId=myhongbao_getUsableHongBaoList&body=%7B%22appId%22%3A%22appHongBao%22%2C%22appToken%22%3A%22apphongbao_token%22%2C%22platformId%22%3A%22appHongBao%22%2C%22platformToken%22%3A%22apphongbao_token%22%2C%22platform%22%3A%221%22%2C%22orgType%22%3A%222%22%2C%22country%22%3A%22cn%22%2C%22childActivityId%22%3A%22-1%22%2C%22childActiveName%22%3A%22-1%22%2C%22childActivityTime%22%3A%22-1%22%2C%22childActivityUrl%22%3A%22-1%22%2C%22openId%22%3A%22-1%22%2C%22activityArea%22%3A%22-1%22%2C%22applicantErp%22%3A%22-1%22%2C%22eid%22%3A%22-1%22%2C%22fp%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22shshshfpb%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22activityType%22%3A%221%22%2C%22isRvc%22%3A%22-1%22%2C%22pageClickKey%22%3A%22-1%22%2C%22extend%22%3A%22-1%22%2C%22organization%22%3A%22JD%22%7D&appid=JDReactMyRedEnvelope&client=apple&clientVersion=7.0.0`,
            method: "post",
            headers: {
                "Cookie": cookie,
                "Host": "api.m.jd.com",
                "Connection": "keep-alive",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": "https://h5.m.jd.com",
                "User-Agent": "JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)",
                "Accept-Language": "zh-Hans-CN;q=1",
            },
            timeout: 10000
        });

        const data = response.data;
        logger.info(JSON.stringify(data))
        // 初始化变量
        let jxRed = 0,
            jsRed = 0,
            jdRed = 0,
            jdhRed = 0,
            jdwxRed = 0,
            jdGeneralRed = 0,
            jxRedExpire = 0,
            jsRedExpire = 0,
            jdRedExpire = 0,
            jdhRedExpire = 0,
            jdwxRedExpire = 0,
            jdGeneralRedExpire = 0;

        let t = new Date();
        t.setDate(t.getDate() + 1);
        t.setHours(0, 0, 0, 0);
        t = parseInt((t - 1) / 1000);

        for (let vo of data.hongBaoList || []) {
            if (vo.orgLimitStr) {
                if (vo.orgLimitStr.includes("京喜") && !vo.orgLimitStr.includes("特价")) {
                    jxRed += parseFloat(vo.balance);
                    if (vo['endTime'] === t) {
                        jxRedExpire += parseFloat(vo.balance);
                    }
                    continue;
                } else if (vo.orgLimitStr.includes("购物小程序")) {
                    jdwxRed += parseFloat(vo.balance);
                    if (vo['endTime'] === t) {
                        jdwxRedExpire += parseFloat(vo.balance);
                    }
                    continue;
                } else if (vo.orgLimitStr.includes("京东商城")) {
                    jdRed += parseFloat(vo.balance);
                    if (vo['endTime'] === t) {
                        jdRedExpire += parseFloat(vo.balance);
                    }
                    continue;
                } else if (vo.orgLimitStr.includes("极速") || vo.orgLimitStr.includes("京东特价") || vo.orgLimitStr.includes("京喜特价")) {
                    jsRed += parseFloat(vo.balance);
                    if (vo['endTime'] === t) {
                        jsRedExpire += parseFloat(vo.balance);
                    }
                    continue;
                } else if (vo.orgLimitStr && vo.orgLimitStr.includes("京东健康")) {
                    jdhRed += parseFloat(vo.balance);
                    if (vo['endTime'] === t) {
                        jdhRedExpire += parseFloat(vo.balance);
                    }
                    continue;
                }
            }
            jdGeneralRed += parseFloat(vo.balance);
            if (vo['endTime'] === t) {
                jdGeneralRedExpire += parseFloat(vo.balance);
            }
        }
        
        const balance = (jxRed + jsRed + jdRed + jdhRed + jdwxRed + jdGeneralRed).toFixed(2);
        jxRed = jxRed.toFixed(2);
        jsRed = jsRed.toFixed(2);
        jdRed = jdRed.toFixed(2);
        jdhRed = jdhRed.toFixed(2);
        jdwxRed = jdwxRed.toFixed(2);
        jdGeneralRed = jdGeneralRed.toFixed(2);
        const expiredBalance = (jxRedExpire + jsRedExpire + jdRedExpire + jdhRedExpire + jdwxRedExpire + jdGeneralRedExpire).toFixed(2);

        // 构建返回文本
        let result = "";
        result += "\n🧧红包总额：" + balance + "(总过期" + expiredBalance + ")";
        
        if (jxRed > 0) {
            result += "\n🧧京喜红包：" + jxRed + "(将过期" + jxRedExpire.toFixed(2) + ")";
        }
        if (jsRed > 0) {
            result += "\n🧧极速红包：" + jsRed + "(将过期" + jsRedExpire.toFixed(2) + ")";
        }
        if (jdRed > 0) {
            result += "\n🧧京东红包：" + jdRed + "(将过期" + jdRedExpire.toFixed(2) + ")";
        }
        if (jdhRed > 0) {
            result += "\n🧧健康红包：" + jdhRed + "(将过期" + jdhRedExpire.toFixed(2) + ")";
        }
        if (jdwxRed > 0) {
            result += "\n🧧微小程序：" + jdwxRed + "(将过期" + jdwxRedExpire.toFixed(2) + ")";
        }
        if (jdGeneralRed > 0) {
            result += "\n🧧平台通用：" + jdGeneralRed + "(将过期" + jdGeneralRedExpire.toFixed(2) + ")";
        }

        return result;
    } catch (error) {
        logger.error(`红包数据查询失败: ${error.message}`);
        return "【红包数据】查询异常";
    }
}




async function cheack(cookie) {
  let text = "";
  
  // 京豆近两天2天
  text += await sumBean(cookie);

  // 红包信息
  text += await getRedPacket(cookie);

  return text
}



///////////////////////////////////////////////////////////////////////////////////////////////////////



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
  if (!ConfigDB.userConfig.settings.container) {
    logger.info('svjdck容器IP未设置，请在插件配置中设置');
    return 'next';  // 继续向下匹配插件
  }

  // 导入青龙对接
  let ql;
  try {
    ql = require('./Dsmggm_青龙对接.js').ql;
  } catch (error) {
    logger.error('未找到 Dsmggm_青龙对接.js');
    return 'next';  // 继续向下匹配插件
  }

  // 导入userAgents.js
  try {
    UserAgents = require('./UserAgents.js').USER_AGENT;

  } catch (error) {
    logger.error('未找到 UserAgents.js');
    return 'next';  // 继续向下匹配插件
  }

  // 打印全部pin
  let pinDB = new BncrDB('pinDB');
  const key = `${sender.getFrom()}:${sender.getUserId()}`
  const users = await pinDB.get(key);
  if (users === undefined) {
    sender.reply('未找到绑定账号，请先登录或绑定');
    return;
  }
  // 创建一个字典，用来存储pin与数字
  let pinDict = {};
  let num = 1; 
  // 遍历users，将pin与数字存储在pinDict中
  for (const user of users.Pin) {
    pinDict[num++] = user;
  }
  logger.info(JSON.stringify(pinDict));
  await sender.reply(`请选择要查询的账号：\n0.全部账号\n${Object.keys(pinDict).map(key => `${key}. ${pinDict[key]}`).join('\n')}\nq.退出`);

  // 监听输入
  let usernum = await sender.waitInput(async (s)=> {
    let msg = s.getMsg();
    if (msg === 'q') {
      return 'q';
    }
  }, 120);
  if (usernum === null) return sender.reply('超时自动退出');
  if (usernum.getMsg() === 'q') return sender.reply('已退出');

  // 初始化青龙示例并获取全部变量
  const qinglong = await ql.init(ConfigDB.userConfig.settings.container);
  let envs = await qinglong.get_envs();

  // 全部账号
  if (usernum.getMsg() === '0') {
    for (const user of users.Pin) {
      const jd_cookie = envs.filter(item => {
        // 筛选条件：包含user 字符串 的项
        return item.value.includes(`pt_pin=${user}`);
      });
      if (jd_cookie.length === 0) {
        await sender.reply(`${user}CK未找到`);
        continue;
      }
      if (jd_cookie[0].status === 1) {
        await sender.reply(`${user}  ❌CK过期禁用了`);
        continue;
      }
      // 查询
      logger.info(`正在查询${user}`);
      // sender.reply(`正在查询${user}`);
      // logger.info(`✅查询结果${JSON.stringify(jd_cookie)}`);
      await sender.reply(`${user}\n${await cheack(jd_cookie[0].value)}`);
      await sysMethod.sleep(3);
    }

  // 指定账号
  } else {
    // 查询
    logger.info(`查询测试`)
    const selectedNum = usernum.getMsg();

    // 检查序号是否有效
    if (!pinDict[selectedNum]) {
      await sender.reply('选择的序号无效,已退出');
      return;
    }
    // 根据序号获取对应的pin
    const selectedPin = pinDict[selectedNum];
    logger.info(`查询账号: ${selectedPin}`);
    sender.reply(`正在查询${selectedPin}`);

    // 
    const jd_cookie = envs.filter(item => {
      // 筛选条件：包含user 字符串 的项
      return item.value.includes(`pt_pin=${selectedPin}`);
    });
    if (jd_cookie.length === 0) {
      await sender.reply(`${selectedPin}CK未找到，请先登录`);
    }
    if (jd_cookie[0].status === 1) {
      await sender.reply(`${selectedPin}  ❌CK过期禁用了`);
    }
    
    await sender.reply(`${selectedPin} 查询结果：\n${await cheack(jd_cookie[0].value)}`);

  }





}

