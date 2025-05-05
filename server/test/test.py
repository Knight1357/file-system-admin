import requests
import os

# Minio 服务地址
BASE_URL = "http://127.0.0.1:5000"
# 默认存储桶名称
DEFAULT_BUCKET = "test"
# 要上传的文件路径
FILE_PATH = r'test\test.txt'

def upload_file():
    try:
        with open(FILE_PATH, 'rb') as file:
            files = {'file': file}
            data = {'bucket': DEFAULT_BUCKET}
            response = requests.post(f"{BASE_URL}/upload", files=files, data=data)
            if response.status_code == 200:
                result = response.json()
                print("文件上传成功:")
                print(result)
                return result['object']
            else:
                print(f"文件上传失败，状态码: {response.status_code}")
                print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"发生错误: {e}")

def download_file(object_name):
    try:
        params = {
            'bucket': DEFAULT_BUCKET,
            'object_name': object_name
        }
        response = requests.get(f"{BASE_URL}/download", params=params)
        if response.status_code == 200:
            with open(f"downloaded_{object_name}", 'wb') as file:
                file.write(response.content)
            print(f"文件 {object_name} 下载成功，保存为 downloaded_{object_name}")
        else:
            print("文件下载失败:")
            print(response.json())
    except Exception as e:
        print(f"发生错误: {e}")

def test_list_files():
    try:
        # 发送 GET 请求到 /list 端点
        params = {'bucket': DEFAULT_BUCKET}
        response = requests.get(f"{BASE_URL}/list", params=params)

        # 检查响应状态码
        if response.status_code == 200:
            result = response.json()
            print("列出文件成功:")
            print(result)
        elif response.status_code == 404:
            result = response.json()
            print("存储桶不存在:")
            print(result)
        else:
            result = response.json()
            print("列出文件失败:")
            print(result)
    except Exception as e:
        print(f"发生错误: {e}")
        

if __name__ == "__main__":
    test_list_files()
  
    # if not os.path.exists(FILE_PATH):
    #     print(f"文件 {FILE_PATH} 不存在，请检查文件路径。")
    # else:
    #     object_name = upload_file()
    #     if object_name:
    #         download_file(object_name)
