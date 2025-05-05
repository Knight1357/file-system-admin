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
    test_cases = [
        {"description": "列出根目录文件", "params": {"bucket": DEFAULT_BUCKET}},
        {"description": "列出指定路径文件", "params": {"bucket": DEFAULT_BUCKET, "prefix": "3213/"}},
        {"description": "列出不存在的路径", "params": {"bucket": DEFAULT_BUCKET, "prefix": "nonexistent/"}},
        {"description": "列出不存在的存储桶", "params": {"bucket": "nonexistent-bucket"}},
    ]

    for case in test_cases:
        print(f"\n测试用例: {case['description']}")
        print(f"请求参数: {case['params']}")
        
        try:
            response = requests.get(f"{BASE_URL}/list", params=case['params'])
            
            if response.status_code == 200:
                result = response.json()
                print("列出文件成功:")
                print(result)
            else:
                result = response.json()
                print(f"请求失败，状态码: {response.status_code}")
                print(f"错误信息: {result['error']}")
                
        except Exception as e:
            print(f"发生错误: {e}")

def test_delete_file():
    # 先上传一个测试文件
    test_file = "test_delete_file.txt"
    with open(test_file, 'w') as f:
        f.write("This is a test file for deletion")
    
    # 上传文件
    upload_params = {'bucket': DEFAULT_BUCKET, 'object_name': test_file}
    with open(test_file, 'rb') as f:
        files = {'file': f}
        upload_response = requests.post(f"{BASE_URL}/upload", files=files, data=upload_params)
    
    if upload_response.status_code != 200:
        print("上传测试文件失败，无法继续测试删除")
        return
    
    print("\n测试删除文件功能")
    
    test_cases = [
        {
            "description": "正常删除存在的文件",
            "params": {"bucket": DEFAULT_BUCKET, "object_name": "3213/1231312.txt"},
            "expected_status": 200
        },
        # {
        #     "description": "删除不存在的文件",
        #     "params": {"bucket": DEFAULT_BUCKET, "object_name": "nonexistent_file.txt"},
        #     "expected_status": 404
        # },
        # {
        #     "description": "缺少object_name参数",
        #     "params": {"bucket": DEFAULT_BUCKET},
        #     "expected_status": 400
        # },
        # {
        #     "description": "不存在的存储桶",
        #     "params": {"bucket": "nonexistent-bucket", "object_name": test_file},
        #     "expected_status": 404
        # }
    ]
    
    for case in test_cases:
        print(f"\n测试用例: {case['description']}")
        print(f"请求参数: {case['params']}")
        
        try:
            response = requests.delete(f"{BASE_URL}/delete", params=case['params'])
            
            if response.status_code == case['expected_status']:
                status = "成功" if response.status_code == 200 else "符合预期失败"
                print(f"{status}, 状态码: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"删除结果: {result['message']}")
                    print(f"存储桶: {result['bucket']}")
                    print(f"文件: {result['object']}")
                elif response.status_code >= 400:
                    result = response.json()
                    print(f"错误信息: {result['error']}")
            else:
                print(f"测试失败，预期状态码: {case['expected_status']}, 实际状态码: {response.status_code}")
                if response.status_code >= 400:
                    result = response.json()
                    print(f"错误信息: {result['error']}")
                    
        except Exception as e:
            print(f"发生错误: {e}")
    
    # 清理测试文件
    if os.path.exists(test_file):
        os.remove(test_file)


def test_rename_file():
    # 先上传一个测试文件
    original_file = "test_rename_original.txt"
    new_file = "test_rename_new.txt"
    
    with open(original_file, 'w') as f:
        f.write("This is a test file for renaming")
    
    # 上传文件
    upload_params = {'bucket': DEFAULT_BUCKET, 'object_name': original_file}
    with open(original_file, 'rb') as f:
        files = {'file': f}
        upload_response = requests.post(f"{BASE_URL}/upload", files=files, data=upload_params)
    
    if upload_response.status_code != 200:
        print("上传测试文件失败，无法继续测试重命名")
        return
    
    print("\n测试文件重命名功能")
    
    test_cases = [
        {
            "description": "正常重命名文件",
            "params": {
                "bucket": DEFAULT_BUCKET,
                "source_name": "test.txt",
                "target_name": "王德法.txt"
            },
            "expected_status": 200
        },
        # {
        #     "description": "源文件不存在",
        #     "params": {
        #         "bucket": DEFAULT_BUCKET,
        #         "source_name": "nonexistent_file.txt",
        #         "target_name": new_file
        #     },
        #     "expected_status": 404
        # },
        # {
        #     "description": "目标文件已存在",
        #     "params": {
        #         "bucket": DEFAULT_BUCKET,
        #         "source_name": new_file,  # 使用上一个测试中重命名的文件
        #         "target_name": new_file   # 同名
        #     },
        #     "expected_status": 409
        # },
        # {
        #     "description": "缺少必要参数",
        #     "params": {
        #         "bucket": DEFAULT_BUCKET,
        #         "source_name": original_file
        #         # 缺少target_name
        #     },
        #     "expected_status": 400
        # },
        # {
        #     "description": "源和目标名称相同",
        #     "params": {
        #         "bucket": DEFAULT_BUCKET,
        #         "source_name": original_file,
        #         "target_name": original_file
        #     },
        #     "expected_status": 400
        # }
    ]
    
    for case in test_cases:
        print(f"\n测试用例: {case['description']}")
        print(f"请求参数: {case['params']}")
        
        try:
            response = requests.post(f"{BASE_URL}/rename", params=case['params'])
            
            if response.status_code == case['expected_status']:
                status = "成功" if response.status_code == 200 else "符合预期失败"
                print(f"{status}, 状态码: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"重命名结果: {result['message']}")
                    print(f"存储桶: {result['bucket']}")
                    print(f"原文件名: {result['original_name']}")
                    print(f"新文件名: {result['new_name']}")
                elif response.status_code >= 400:
                    result = response.json()
                    print(f"错误信息: {result['error']}")
            else:
                print(f"测试失败，预期状态码: {case['expected_status']}, 实际状态码: {response.status_code}")
                if response.status_code >= 400:
                    result = response.json()
                    print(f"错误信息: {result['error']}")
                    
        except Exception as e:
            print(f"发生错误: {e}")
    
    # 清理测试文件
    for f in [original_file, new_file]:
        if os.path.exists(f):
            os.remove(f)
            


if __name__ == "__main__":
    # test_list_files()
    test_rename_file()
    # test_delete_file()
    
    # if not os.path.exists(FILE_PATH):
    #     print(f"文件 {FILE_PATH} 不存在，请检查文件路径。")
    # else:
    #     object_name = upload_file()
    #     if object_name:
    #         download_file(object_name)
