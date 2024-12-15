import aiohttp
import logging
import asyncio

# 确保 logger 已经配置
logger = logging.getLogger(__name__)
BASE_URL = 'https://svjdckauth.dsmggm.cn'  # 替换为你的 Cloudflare Worker 基础 URL
async def get_device_id_net(device_id):
    """
    根据设备ID获取设备信息。

    :param device_id: 设备的唯一 ID
    :return: 响应对象
    """
    # 基础 URL，请根据实际情况修改
    url = 'https://svjdckauth.dsmggm.cn/get-user'  # 确保 URL 是正确的
    api_key = 'O3dLn4NOtjYZ3sUofwHDzngbLLlREOUyqZlbczwvRv5P23W1PSGo7fUyuHyDrBOv'

    # 调用异步函数获取用户信息
    headers = {'Content-Type': 'application/json', 'x-api-key': api_key}
    payload = {'device_id': device_id}

    try:
        # 使用 aiohttp.request 发起异步 POST 请求
        async with aiohttp.request('POST', url, headers=headers, json=payload) as response:
            # 检查响应状态码
            print(response)
            response_data = await response.text()  # 使用 text() 方法获取响应内容
            print("响应内容:", response_data)
            return response_data  # 返回响应内容
    except aiohttp.ClientError as e:
        print(f"获取用户信息失败，错误信息: {e}")
        return None  # 返回 None 表示请求过程中发生错误


if __name__ == "__main__":
    asyncio.run(get_device_id_net('SKDMSFYVNPOXEPNNIMZHW3O5VD8SBCDFUPNZOX'))
