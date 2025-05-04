from flask import Flask, request, jsonify, send_file
from minio import Minio
from minio.error import S3Error
import io
import os

app = Flask(__name__)

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
    列出存储桶中的文件
    """
    bucket_name = request.args.get('bucket', DEFAULT_BUCKET)
    
    try:
        if not minio_client.bucket_exists(bucket_name):
            return jsonify({"error": "Bucket does not exist"}), 404
        
        objects = minio_client.list_objects(bucket_name)
        file_list = [obj.object_name for obj in objects]
        
        return jsonify({
            "bucket": bucket_name,
            "files": file_list
        }), 200
        
    except S3Error as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)