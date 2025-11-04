/**
 * @author Dsmggm
 * @name Dsmggm_今天吃什么
 * @team Dsmggm
 * @version 1.0.3
 * @description 如果你不知道吃什么，那你就可以问问机器人
 * @rule ^(今天吃什么|吃什么)$
 * @rule ^(今天做什么|做什么)$
 * @admin true
 * @public true
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 * @classification ["工具"]
 */


// 插件说明内容
const describe_text =`
如果你不知道吃什么<br>
那么你可以问"今天做什么"<br>
但是如果你不想做饭，那么你可以问"今天吃什么"<br>
`;
// 日志函数
const plugins_name = 'Dsmggm_今天吃什么';
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
    // 说明
    describe: BncrCreateSchema.object({}).setTitle('说明').setDescription(describe_text).setDefault({})
  })
/* 完成后new BncrPluginConfig传递该jsonSchema */
const ConfigDB = new BncrPluginConfig(jsonSchema);



// 出去吃饭列表（侧重外食场景：特色正餐、聚餐、街头快餐、精致餐点）
const foodList_out = [
    // 中国菜系特色餐饮类（覆盖川粤鲁湘苏浙闽等主流菜系，城市正餐核心）
      "北京烤鸭", "水煮鱼", "毛血旺", "酸菜鱼", "佛跳墙", "东坡肉", "夫妻肺片", "剁椒鱼头",
      "宫保鸡丁", "麻婆豆腐", "梅菜扣肉", "白切鸡", "烧腊拼盘", "东坡肘子", "龙井虾仁",
      "松鼠鳜鱼", "叫花鸡", "白灼虾", "蒜蓉粉丝蒸扇贝", "豆豉鲮鱼油麦菜", "白灼菜心",
      "扬州炒饭", "腊味煲仔饭", "蜜汁叉烧", "冰糖葫芦（现做版）", "驴打滚（现做版）",
    // 异国主流料理（城市常见，不冗余）
      "寿司", "刺身", "天妇罗", "乌冬面", "日式拉面", "泰式冬阴功汤", "越南春卷", "披萨", "牛排", "意大利面",

    // 聚餐场景类（中国城市高频聚餐形式，突出分享性、互动性）
      "铜锅涮肉", "潮汕牛肉火锅", "猪肚鸡火锅", "椰子鸡火锅", "羊蝎子火锅", "麻辣火锅",
      "烤肉", "韩式烤肉", "烧烤", "海鲜烧烤", "小龙虾（麻辣/蒜蓉/十三香）", "铁板烧",
      "烤全羊", "烤羊腿", "盆菜", "自助餐", "冷餐会", "甜点塔", "荤素大拼盘", "芝士拼盘",
      "烤串", "冷锅串串", "钵钵鸡", "烤鱼", "纸包鱼", "地锅鸡", "铁锅炖", "干锅排骨",
      "干锅虾", "焖锅", "麻辣香锅", "串串香", "关东煮", "柴火鸡", "大盆鸡",

    // 快餐街头小吃类（城市便捷外食，覆盖南北特色）
      "汉堡", "炸鸡", "薯条", "麦辣鸡翅", "炸鸡汉堡", "鸡肉卷", "巨无霸", "鸡块", "炸鸡桶",
      "麻辣烫", "冒菜", "盖浇饭", "黄焖鸡米饭", "咖喱饭", "卤肉饭", "烤肉饭", "牛肉盖饭",
      "猪排饭", "鸡排饭", "兰州拉面", "重庆小面", "螺蛳粉", "桂林米粉", "云南过桥米线",
      "淮南牛肉汤", "驴肉火烧", "香河肉饼", "鸡蛋灌饼", "煎饼果子", "手抓饼", "葱油饼",
      "烤冷面", "肉夹馍", "凉皮", "凉面", "擀面皮", "油泼面", "biangbiang面", "刀削面",
      "肉臊子面", "酸辣粉", "炒河粉", "炒饼", "烩饼", "卤煮", "炒肝", "爆肚", "羊肉汤",
      "热狗", "烤面筋", "炸串", "糖炒栗子", "烤红薯", "臭豆腐", "麻团", "艾窝窝", "豌豆黄",

    // 精致餐点/甜点饮品（城市下午茶、轻食场景）
      "提拉米苏", "马卡龙", "奶油泡芙", "芝士蛋糕", "巧克力熔岩蛋糕", "冰淇淋蛋糕",
      "抹茶蛋糕", "双皮奶", "姜撞奶", "杨枝甘露", "椰汁西米露", "龟苓膏", "广式早茶点心（虾饺/烧卖/肠粉/叉烧包）",
      "珍珠奶茶", "抹茶拿铁", "冰美式", "芒果冰沙", "红茶拿铁", "可可", "酸梅汤", "绿豆沙",
      "章鱼小丸子", "糖画（街头特色）", "糖葫芦", "桂花糕", "马蹄糕"
];

// 自己做饭列表（侧重家庭便捷烹饪：家常、健康、易操作）
const foodList_in = [
    // 主食类（兼顾杂粮健康、南北习惯，易制备）
      "白米饭", "糙米饭", "杂粮饭", "素炒饭", "蛋炒饭", "炒面", "杂酱面", "打卤面", "荞麦面",
      "蔬菜面", "鸡蛋面", "面条", "水饺", "馄饨", "素水饺", "素馄饨", "馒头", "花卷", "豆沙包",
      "素包子", "肉包", "菜包", "糯米鸡", "油条（简易版）", "蛋饼", "糊塌子", "锅贴", "生煎包",
      "灌汤包", "小笼包", "凉皮（自制）", "燕麦饭", "小米饭", "玉米饭", "荞麦饭", "高粱饭",
      "蒸山药", "蒸芋头", "紫薯", "红薯", "玉米", "糙米饭团", "全麦三明治", "全麦面包",
      "蔬菜粥", "小米粥", "黑米粥", "薏米粥", "南瓜粥", "皮蛋瘦肉粥", "白粥", "山药粥",
      "红枣粥", "桂圆粥", "莲子粥", "百合粥", "疙瘩汤", "焖面", "炒饼", "烩饼", "揪面片",

    // 家常菜类（家庭高频烹饪，荤素均衡，易操作）
      "红烧肉", "可乐鸡翅", "红烧排骨", "糖醋排骨", "清炖排骨", "冬瓜排骨汤", "玉米排骨汤",
      "番茄牛腩", "土豆炖牛肉", "萝卜炖羊肉", "宫保鸡丁", "麻婆豆腐", "鱼香肉丝", "青椒炒肉",
      "回锅肉", "蚂蚁上树", "青椒土豆丝", "酸辣土豆丝", "醋溜白菜", "红烧茄子", "清炒西兰花",
      "蒜蓉菠菜", "清炒油麦菜", "白灼菜心", "豆豉鲮鱼油麦菜", "清炒时蔬", "香菇青菜", "炝炒圆白菜",
      "清蒸南瓜", "糖拌西红柿", "家常豆腐", "松仁玉米", "素炒三丝", "拌豆腐丝", "豆皮", "素鸡",
      "木须肉", "西红柿炒鸡蛋", "韭菜炒鸡蛋", "洋葱炒鸡蛋", "丝瓜炒蛋", "清炒虾仁", "白灼虾",
      "蒜蓉粉丝蒸虾（简易版）", "清蒸鱼（鲈鱼/多宝鱼）", "家常烧鱼", "酸辣藕丁", "土豆丝炒肉丝",
      "芹菜炒肉", "炒豆角", "干煸豆角", "虎皮青椒", "凉拌三丝", "皮蛋豆腐", "凉拌海带丝",
      "凉拌藕片", "清炒花生米", "盐水花生", "蒜蓉黄瓜", "拌木耳", "凉拌番茄",

    // 简单小吃/佐餐小食（家庭易制作，解馋/佐餐）
      "茶叶蛋", "卤蛋", "水煮蛋", "蒸蛋羹", "烤豆腐", "煎豆腐", "炸花生米", "腌萝卜",
      "自制泡菜", "卤鸡爪", "卤鸡翅", "卤豆干", "水果沙拉", "蔬菜沙拉", "凉拌黄瓜",
      "拌海带丝", "拌木耳", "煮玉米", "蒸红薯", "烤红薯", "水煮鸡胸肉", "清蒸白切鸡（简易版）",
      "虾仁滑蛋", "豆腐脑（自制）", "咸豆浆", "咸菜", "绿豆芽", "清炒荷兰豆", "蒜蓉粉丝娃娃菜",

    // 健康饮品类（家庭易冲泡/熬制，贴合养生习惯）
      "豆浆", "无糖豆浆", "牛奶", "杏仁奶", "燕麦奶", "果汁", "蔬果汁", "绿茶", "红茶",
      "茉莉花茶", "菊花茶", "金银花茶", "玫瑰花茶", "大麦茶", "陈皮水", "薄荷水", "姜茶",
      "冰糖雪梨水", "蜂蜜柚子茶", "柠檬蜂蜜水", "酸梅汤（自制）", "绿豆汤", "红豆汤",
      "冬瓜茶", "山楂水", "红枣枸杞水", "桂圆红枣茶", "荞麦茶", "玉米汁", "山药汁"
];


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

  let text = '';

  if (sender.getMsg() === '今天吃什么' || sender.getMsg() === '吃什么') {
      text += '今天吃这几个吧：'
    const randomIndex1 = Math.floor(Math.random() * foodList_out.length);
    text += `\n${foodList_out[randomIndex1]}`
    const randomIndex2 = Math.floor(Math.random() * foodList_out.length);
    text += `\n${foodList_out[randomIndex2]}`
    const randomIndex3 = Math.floor(Math.random() * foodList_out.length);
    text += `\n${foodList_out[randomIndex3]}`
    await sender.reply(text);

  } else if (sender.getMsg() === '今天做什么' || sender.getMsg() === '做什么') {
    text += '今天做这几个菜吧：'
    const randomIndex1 = Math.floor(Math.random() * foodList_in.length);
    text += `\n${foodList_in[randomIndex1]}`
    const randomIndex2 = Math.floor(Math.random() * foodList_in.length);
    text += `\n${foodList_in[randomIndex2]}`
    const randomIndex3 = Math.floor(Math.random() * foodList_in.length);
    text += `\n${foodList_in[randomIndex3]}`
    await sender.reply(text);
  }

}
