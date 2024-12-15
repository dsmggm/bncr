/**
 * @author svjdck
 * @name svjdck_re_device
 * @team svjdck
 * @version 1.0.0
 * @description svjdck更换设备插件
 * @rule ^(svjdck更换设备)$
 * @admin false
 * @public false
 * @priority 99999
 * // 是否服务模块，true不会作为插件加载，会在系统启动时执行该插件内容
 * @service false
 */

const crypto = require('crypto');
const axios = require('axios');

const BASE_URL = 'https://svjdckauth.dsmggm.cn'; // 替换为你的 Cloudflare Worker 基础 URL
const API_KEY = 'O3dLn4NOtjYZ3sUofwHDzngbLLlREOUyqZlbczwvRv5P23W1PSGo7fUyuHyDrBOv';

// 计算激活码
async function encryptMessage(message) {
    const key = Buffer.from('Yjfy@jfyanJie595595fEngyjf891130', 'utf-8');

    // Ensure message is a multiple of 16 bytes
    const messageBuffer = Buffer.from(message, 'utf-8');
    const paddingLength = 16 - (messageBuffer.length % 16);
    const paddedMessage = Buffer.concat([messageBuffer, Buffer.alloc(paddingLength, 0)]);

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
    cipher.setAutoPadding(false);
    const encrypted = Buffer.concat([cipher.update(paddedMessage), cipher.final()]);
    return encrypted.toString('hex');
}

// 查询用户
async function get_device_id(device_id) {
    const url = `${BASE_URL}/get-user`;
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    };
    const payload = { device_id: device_id };

    try {
        const response = await axios.post(url, payload, { headers: headers });
        return response.data; // 返回响应数据
    } catch (error) {
        console.error(`请求错误: ${error.response ? error.response.data : error.message}`);
        return null;
    }
}

// 添加用户
async function add_user(user_data) {
    const url = `${BASE_URL}/add-user`;
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    };

    try {
        const response = await axios.post(url, user_data, { headers: headers });
        return response.data; // 返回响应数据
    } catch (error) {
        console.error(`请求错误: ${error.response ? error.response.data : error.message}`);
        return null;
    }
}

// 更新用户
async function update_user(user_data) {
    const url = `${BASE_URL}/update-user`;
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    };

    try {
        const response = await axios.post(url, user_data, { headers: headers });
        return response.data; // 返回响应数据
    } catch (error) {
        console.error(`请求错误: ${error.response ? error.response.data : error.message}`);
        return null;
    }
}


module.exports = async s => {
    // 获取旧设备id
    let old_device_id;
    let old;
    while (true) {
        console.log(s.text);
        await s.reply('请输入旧device_id设备码，回复q退出');
        
        // 等待用户输入，超时时间为30秒
        let newMsg = await s.waitInput(() => {}, 120);
        
        // 超时处理
        if (newMsg === null) {
            await s.reply('超时退出');
            return;
        }
        
        // 获取用户输入的消息
        old_device_id = newMsg.getMsg();
        
        // 退出 
        if(old_device_id === 'q'){
            await s.reply('退出');
            return;
        }
        
        // 判断是否为38位
        if (old_device_id.length === 38) {
        } else {
            await s.reply('device_id必须是38位，请重新输入');
        }

        // 查询用户
        old = await get_device_id(old_device_id);
        if (old === null) {
            console.log('用户不存在');
            await s.reply('此device_id未激活，重新输入');
        } else {
            break;
        }
    }
    console.log('device_id旧设备码: ', old_device_id); 
    console.log('旧device_id信息');


    // 获取新设备id
    let new_device_id;
    while (true) {
        console.log(s.text);
        await s.reply('请输入新device_id设备码，回复q退出');
        
        // 等待用户输入，超时时间为30秒
        let newMsg = await s.waitInput(() => {}, 60);
        
        // 超时处理
        if (newMsg === null) {
            await s.reply('超时退出');
            return;
        }
        
        // 获取用户输入的消息
        new_device_id = newMsg.getMsg();
        
        // 退出 
        if(new_device_id === 'q'){
            await s.reply('退出');
            return;
        }
        
        // 判断是否为38位
        if (new_device_id.length === 38) {
            break; // 输入正确，跳出循环
        } else {
            await s.reply('device_id必须是38位，请重新输入');
        }
    }
    console.log('device_id新设备码: ', new_device_id); 

    // 计算激活码
    const message = new_device_id + old.auth_datetime;
    const auth_code = await encryptMessage(message);
    
    // 返回给用户
    await s.reply('新激活码:');
    await s.reply(auth_code);

    // 更新到数据库
    const user_data = {
        id: old.id,
        device_id: new_device_id,
        auth_code: auth_code,
        auth_datetime: old.auth_datetime,
        user_id: old.user_id
    };
    await update_user(user_data);

    return 'next';  // 继续向下匹配插件
}

