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

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    上传文件到MinIO
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # 可选参数
    bucket_name = request.form.get('bucket', DEFAULT_BUCKET)
    object_name = request.form.get('object_name', file.filename)
    
    try:
        # 确保存储桶存在
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
        
        # 上传文件
        file_data = file.read()
        file_stream = io.BytesIO(file_data)
        minio_client.put_object(
            bucket_name,
            object_name,
            file_stream,
            length=len(file_data),
            content_type=file.content_type
        )
        
        return jsonify({
            "message": "File uploaded successfully",
            "bucket": bucket_name,
            "object": object_name
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download', methods=['GET'])
def download_file():
    """
    从MinIO下载文件
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    object_name = request.args.get('object_name')
    
    if not object_name:
        return jsonify({"error": "object_name parameter is required"}), 400
    
    try:
        # 获取文件数据
        response = minio_client.get_object(bucket_name, object_name)
        file_data = response.read()
        
        # 创建文件流
        file_stream = io.BytesIO(file_data)
        file_stream.seek(0)
        
        # 发送文件
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
    列出存储桶中指定路径下的文件，包含文件名、大小和修改时间
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    prefix = request.args.get('prefix', '')  # 新增prefix参数，默认为空
    
    try:
        if not minio_client.bucket_exists(bucket_name):
            return jsonify({"error": "Bucket does not exist"}), 404
        
        # 添加prefix参数来过滤指定路径下的文件
        objects = minio_client.list_objects(bucket_name, prefix=prefix, recursive=False)

        file_list = []
        for obj in objects:
            # 如果是目录则跳过（MinIO中目录以/结尾）
            if obj.object_name.endswith('/'):
                continue
                
            file_info = {
                "name": obj.object_name,
                "size": obj.size,
                "last_modified": obj.last_modified.isoformat() if obj.last_modified else None
            }
            file_list.append(file_info)
        
        return jsonify({
            "bucket": bucket_name,
            "prefix": prefix,
            "files": file_list
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
        
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)