/**
 * @author svjdck
 * @name svjdck_auth
 * @team svjdck
 * @version 1.0.0
 * @description svjdck的授权插件
 * @rule ^(激活jdck)$
 * @admin true
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
    // 输入device_id
    let device_id;
    while (true) {
        console.log(s.text);
        await s.reply('请输入device_id设备码');
        
        // 等待用户输入，超时时间为120秒
        let newMsg = await s.waitInput(() => {}, 120);
        
        // 超时处理
        if (newMsg === null) {
            await s.reply('超时退出');
            return;
        }
        
        // 获取用户输入的消息
        device_id = newMsg.getMsg();
        // console.log('device_id: ', device_id);
        
        // 退出 
        if(device_id === 'q'){
            await s.reply('退出');
            return;
        }
        
        // 判断是否为38位
        if (device_id.length === 38) {
            break; // 输入正确，跳出循环
        } else {
            await s.reply('device_id必须是38位，请重新输入');
        }
    }
    console.log('device_id设备码: ', device_id); 



    // 输入激活到期时间
    let auth_datetime;
    let auth_code;
    while (true) {
        await s.reply('请输入激活到期时间，格式：yyyymmdd');
        
        // 等待用户输入，超时时间为120秒
        let newMsg = await s.waitInput(() => {}, 120);
        
        // 超时处理
        if (newMsg === null) {
            await s.reply('超时退出');
            return;
        }
        
        // 获取用户输入的消息
        auth_datetime = newMsg.getMsg();
        // console.log('auth_datetime: ', auth_datetime);
        
        // 退出 
        if(auth_datetime === 'q'){
            await s.reply('退出');
            return;
        }
        
        // 判断是否为38位
        if (auth_datetime.length === 8) {

            // 计算激活码
            const message = device_id + auth_datetime;
            auth_code = await encryptMessage(message);

            await s.reply('激活码:');
            await s.reply(auth_code);
            break; // 输入正确，跳出循环
        } else {
            await s.reply('auth_datetime格式错误，请重新输入');
        }
    }
    console.log('auth_datetime激活到期时间: ', auth_datetime);

    // 查询用户
    const existingUser = await get_device_id(device_id);

    // 更新或添加用户

    if (existingUser === null) {
        // 如果查询结果为 null，添加用户
        console.log('用户不存在，添加新用户');
        const user_data = {
            device_id: device_id,
            auth_code: auth_code,
            auth_datetime: auth_datetime,
            user_id: 'Bncr_admin'
        };
        await add_user(user_data);
    } else {
        // 如果查询结果不为 null，更新用户
        console.log('用户已存在，更新用户信息');
        const user_data = {
            id: existingUser.id,
            device_id: device_id,
            auth_code: auth_code,
            auth_datetime: auth_datetime,
            user_id: 'Bnrc_admin'
        };
        await update_user(user_data);
    }

    console.log('user_data: ', user_data);

    return 'next';  // 继续向下匹配插件
}

