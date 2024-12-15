import requests

# 基础 URL，请根据实际情况修改
BASE_URL = 'https://svjdckauth.dsmggm.cn'  # 替换为你的 Cloudflare Worker 基础 URL
API_KEY =  'O3dLn4NOtjYZ3sUofwHDzngbLLlREOUyqZlbczwvRv5P23W1PSGo7fUyuHyDrBOv'
def add_user(user_data):
    """
    添加一个新用户到数据库。

    :param user_data: 包含用户信息的字典
    :return: 响应对象
    """
    url = f"{BASE_URL}/add-user"
    headers = {'Content-Type': 'application/json' , 'x-api-key': API_KEY}
    try:
        response = requests.post(url, headers=headers, json=user_data)  # 使用 json 参数自动序列化
        return response
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return None

def get_device_id(device_id):
    """
    根据用户 ID 获取用户信息。

    :param user_id: 用户的唯一 ID
    :return: 响应对象
    """
    url = f"{BASE_URL}/get-user"
    headers = {'Content-Type': 'application/json' , 'x-api-key': API_KEY}
    payload = {'device_id': device_id}
    try:
        response = requests.post(url, headers=headers, json=payload)  # 使用 json 参数自动序列化
        return response
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return None
def query_users():
    """
    获取所有用户信息。

    :return: 响应对象
    """
    url = f"{BASE_URL}/query-users"
    headers = {'Content-Type': 'application/json' , 'x-api-key': API_KEY}
    try:
        response = requests.get(url, headers=headers)  # GET 请求不需要 body
        return response
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return None

def update_user(user_data):
    """
    更新用户信息。

    :param user_data: 包含用户信息的字典
    :return: 响应对象
    """
    url = f"{BASE_URL}/update-user"
    headers = {'Content-Type': 'application/json', 'x-api-key': API_KEY}
    try:
        response = requests.post(url, headers=headers, json=user_data)  # 使用 json 参数自动序列化
        return response
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {e}")
        return None

def main():
    # 测试数据
    test_user = {
        'device_id': 'SKDMSFYVNPOXEPNNIMZHW3O5VD8SBCDFUPNZOX',
        'auth_datetime': '20290109',
        'user_id': '517',
        'auth_code': 'a93b1b606875ae7bbf83c6377218cb4e1a53d07f0ba75cafac95b72aa224ee1048cfee23caec48b54a3b4af9084040a7'
    }

    # 1. 添加用户
    print("添加用户...")
    add_response = add_user(test_user)
    if add_response and add_response.status_code == 200:
        print("用户添加成功")
    else:
        print(f"用户添加失败，状态码: {add_response.status_code}, 错误信息: {add_response.text}")

    # 2. 获取用户
    print("\n获取用户信息...")
    device_id = test_user['device_id']
    get_response = get_device_id(device_id)
    if get_response and get_response.status_code == 200:
        user_info = get_response.json()
        print(f"用户信息: {user_info}")
    else:
        print(f"获取用户信息失败，状态码: {get_response.status_code}, 错误信息: {get_response.text}")

    # 3. 查询所有用户
    print("\n查询所有用户...")
    query_response = query_users()
    if query_response and query_response.status_code == 200:
        users = query_response.json()
        print(f"所有用户信息: {users}")
    else:
        print(f"查询所有用户失败，状态码: {query_response.status_code}, 错误信息: {query_response.text}")

    # 4. 更新用户
    print("\n更新用户信息...")
    update_data = {
        'id': 1,
        'device_id': 'SKDMSFYVNPOXEPNNIMZHW3O5VD8SBCDFUPN1O0',
        'auth_datetime': '20290108',
        'user_id': '517',
        'auth_code': 'a93b1b606875ae7bbf83c6377218cb4e1a53d07f0ba75cafac95b72aa224ee1048cfee23caec48b54a3b4af9084040a7'
    }
    update_response = update_user(update_data)
    if update_response and update_response.status_code == 200:
        print("用户更新成功")
    else:
        print(f"用户更新失败，状态码: {update_response.status_code}, 错误信息: {update_response.text}")

if __name__ == "__main__":
    # main()
    s = get_device_id('SKDMSFYVNPOXEPNNIMZHW3O5VD8SBCDFUPNZOX')
    print(s.json())