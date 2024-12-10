// 计算返回授权日期，dateStr授权起算日期，day授权天数
async function calculate_dates(dateStr, authday) {
    // 将字符串转换为Date对象
    var date = new Date(dateStr.substring(0, 4) + "-" + dateStr.substring(4, 6) + "-" + dateStr.substring(6, 8));
  
    // 增加n天
    date.setDate(date.getDate() + authday);
  
    // 将Date对象转换回字符串格式
    const resultDateStr = date.toISOString().substring(0, 10).replace(/-/g, "");
    return resultDateStr
  }




const money = '9.00'
let authday = parseFloat(money) * 10;
const sd = await calculate_dates('20241218', authday);
console.log(sd);
