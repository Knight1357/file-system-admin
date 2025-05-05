from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from minio import Minio
from minio.error import S3Error
from minio.commonconfig import CopySource  # 添加这行导入
import io
import os

app = Flask(__name__)
# 允许所有来源的跨域请求
CORS(app)

# 配置MinIO客户端
minio_client = Minio(
    "152.32.131.180:9001",
    access_key="xfjU0Z4xhXJfRmPkSoFr",
    secret_key="OonSCnhPLfifHWbvVpTtKEuZ9sIm7M5lsrfk6gwq",
    secure=False  # 如果使用HTTPS则为True
)

# 默认存储桶名称
DEFAULT_BUCKET = "test"

from gmssl.sm4 import CryptSM4, SM4_ENCRYPT, SM4_DECRYPT
from gmssl.sm3 import sm3_hash

class EncryptionService:
    def __init__(self, key: bytes):
        self.key = key
        self.crypt_sm4 = CryptSM4()

    def encrypt(self, plaintext: bytes) -> bytes:
        """SM4 加密"""
        self.crypt_sm4.set_key(self.key, SM4_ENCRYPT)
        return self.crypt_sm4.crypt_ecb(plaintext)

    def decrypt(self, ciphertext: bytes) -> bytes:
        """SM4 解密"""
        self.crypt_sm4.set_key(self.key, SM4_DECRYPT)
        return self.crypt_sm4.crypt_ecb(ciphertext)

    @staticmethod
    def hash_data(data: bytes) -> str:
        """SM3 哈希"""
        return sm3_hash(list(data))

# 初始化加密服务，使用一个固定的密钥（实际应用中应该安全地管理密钥）
encryption_service = EncryptionService(key=b"0123456789abcdef")

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    bucket_name = request.form.get('bucket', DEFAULT_BUCKET)
    object_name = request.form.get('object_name', file.filename)  # 确保字段名一致
    
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
        
        # 读取文件内容并加密
        file_data = file.read()
        encrypted_data = encryption_service.encrypt(file_data)
        
        # 上传加密后的文件
        minio_client.put_object(
            bucket_name,
            object_name,
            io.BytesIO(encrypted_data),
            length=len(encrypted_data),
            content_type=file.content_type
        )
        
        return jsonify({
            "message": "File uploaded and encrypted successfully",
            "object": object_name
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['GET'])
def download_file():
    """
    从MinIO下载文件并解密
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    object_name = request.args.get('object_name')
    
    if not object_name:
        return jsonify({"error": "object_name parameter is required"}), 400
    
    try:
        # 获取加密的文件数据
        response = minio_client.get_object(bucket_name, object_name)
        encrypted_data = response.read()
        
        # 解密文件数据
        decrypted_data = encryption_service.decrypt(encrypted_data)
        
        # 创建文件流
        file_stream = io.BytesIO(decrypted_data)
        file_stream.seek(0)
        
        # 发送解密后的文件
        return send_file(
            file_stream,
            as_attachment=True,
            download_name=object_name,
            mimetype=response.headers.get('content-type')
        )
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/list', methods=['GET'])
def list_files():
    """
    列出存储桶中指定路径下的文件和文件夹
    返回结构：
    {
        "bucket": "bucket-name",
        "prefix": "current-path/",
        "files": [
            {"name": "file.txt", "size": 123, "last_modified": "2023-01-01T00:00:00", "type": "file"},
            {"name": "subfolder/", "size": 0, "last_modified": null, "type": "folder"}
        ]
    }
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    prefix = request.args.get('prefix', '')
    
    try:
        if not minio_client.bucket_exists(bucket_name):
            return jsonify({"error": "Bucket does not exist"}), 404
        
        # 获取对象列表（非递归）
        objects = minio_client.list_objects(bucket_name, prefix=prefix, recursive=False)

        items = []
        seen_folders = set()  # 用于去重文件夹
        
        for obj in objects:
            # 处理文件夹（以/结尾的对象）
            if obj.object_name.endswith('/'):
                folder_name = obj.object_name
                # 跳过与当前 prefix 完全匹配的文件夹（不显示正在列出的目录本身）
                if folder_name == prefix:
                    continue
                if folder_name not in seen_folders:
                    items.append({
                        "name": folder_name,
                        "size": 0,
                        "last_modified": None,
                        "type": "folder"
                    })
                    seen_folders.add(folder_name)
                continue
                
            # 处理普通文件
            # 如果是嵌套在子目录中的文件，提取其直接父目录
            if '/' in obj.object_name[len(prefix):]:
                dir_path = prefix + obj.object_name[len(prefix):].split('/')[0] + '/'
                if dir_path not in seen_folders:
                    items.append({
                        "name": dir_path,
                        "size": 0,
                        "last_modified": None,
                        "type": "folder"
                    })
                    seen_folders.add(dir_path)
                continue
            
            # 普通文件
            items.append({
                "name": obj.object_name,
                "size": obj.size,
                "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                "type": "file"
            })
        
        # 按类型排序：文件夹在前，文件在后
        items.sort(key=lambda x: (x["type"] != "folder", x["name"]))
        
        return jsonify({
            "bucket": bucket_name,
            "prefix": prefix,
            "files": items
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete', methods=['DELETE'])
def delete_file():
    """
    删除MinIO中的文件
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    object_name = request.args.get('object_name')
    
    if not object_name:
        return jsonify({"error": "object_name parameter is required"}), 400
    
    try:
        # 检查文件是否存在
        try:
            minio_client.stat_object(bucket_name, object_name)
        except S3Error as e:
            if e.code == "NoSuchKey":
                return jsonify({"error": f"File {object_name} does not exist"}), 404
            raise
        
        # 删除文件
        minio_client.remove_object(bucket_name, object_name)
        
        return jsonify({
            "message": "File deleted successfully",
            "bucket": bucket_name,
            "object": object_name
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rename', methods=['POST'])
def rename_file():
    """
    重命名MinIO中的文件（通过复制+删除实现）
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    source_name = request.args.get('source_name')
    target_name = request.args.get('target_name')
    
    if not all([source_name, target_name]):
        return jsonify({"error": "source_name and target_name parameters are required"}), 400
    
    if source_name == target_name:
        return jsonify({"error": "source and target names are the same"}), 400
    
    try:
        # 检查源文件是否存在
        try:
            minio_client.stat_object(bucket_name, source_name)
        except S3Error as e:
            if e.code == "NoSuchKey":
                return jsonify({"error": f"Source file {source_name} does not exist"}), 404
            raise
        
        # 检查目标文件是否已存在
        try:
            minio_client.stat_object(bucket_name, target_name)
            return jsonify({"error": f"Target file {target_name} already exists"}), 409
        except S3Error as e:
            if e.code != "NoSuchKey":
                raise
        
        # 复制文件到新名称
        minio_client.copy_object(
            bucket_name,
            target_name,
            CopySource(bucket_name, source_name)  # 使用CopySource类
        )
        
        # 删除原文件
        minio_client.remove_object(bucket_name, source_name)
        
        return jsonify({
            "message": "File renamed successfully",
            "bucket": bucket_name,
            "original_name": source_name,
            "new_name": target_name
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/create-folder', methods=['POST'])
def create_folder():
    """
    在MinIO中创建文件夹（实际上是创建空对象）
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    folder_name = request.args.get('folder_name')
    
    if not folder_name:
        return jsonify({"error": "folder_name parameter is required"}), 400
    
    try:
        # 确保存储桶存在
        if not minio_client.bucket_exists(bucket_name):
            return jsonify({"error": "Bucket does not exist"}), 404
        
        # 规范化文件夹名称（确保以/结尾）
        normalized_name = folder_name.rstrip('/') + '/'
        
        # 检查文件夹是否已存在（考虑MinIO的两种表示方式）
        objects = minio_client.list_objects(bucket_name, prefix=normalized_name, recursive=False)
        if any(obj.object_name == normalized_name for obj in objects):
            return jsonify({"error": f"Folder '{folder_name}' already exists"}), 409
        
        # 创建文件夹（上传一个0字节的对象）
        minio_client.put_object(
            bucket_name,
            normalized_name,
            io.BytesIO(b''),
            0,
            content_type='application/x-directory'  # 明确标记为目录
        )
        
        return jsonify({
            "message": "Folder created successfully",
            "bucket": bucket_name,
            "folder": normalized_name
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)