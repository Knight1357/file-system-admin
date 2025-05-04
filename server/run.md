安装依赖：

```bash
pip install fastapi uvicorn minio
```

运行服务器：

```bash
uvicorn server.main:app --reload --port 3004
```