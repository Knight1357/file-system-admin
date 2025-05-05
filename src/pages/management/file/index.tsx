// index.tsx
import { Button, Card, Popconfirm, Tag, message } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { ReloadOutlined } from '@ant-design/icons';
import { isNil, values } from "ramda";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { IconButton, Iconify, SvgIcon } from "@/components/icon";
import { FaFolder, FaFileImage, FaFilePdf, FaFileWord, FaFileVideo, FaFileAudio, FaFile } from "react-icons/fa";

import FileModal, { type FileModalProps } from "./file-modal";
import FolderModal, { type FolderModalProps } from "./folder-modal";

import { fBytes } from "@/utils/format-number";
import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";

// MinIO 服务配置
const MINIO_API_URL = "http://127.0.0.1:5000";
const DEFAULT_BUCKET = "test";

// 定义默认值
const defaultFileValue: File = {
  id: "",
  parentId: "",
  name: "",
  type: FileType.FILE,
  status: BasicStatus.ENABLE,
  createTime: new Date(),
  modifyTime: new Date(),
  size: 0,
};

const defaultFolderValue: File = {
  id: "",
  parentId: "",
  name: "",
  type: FileType.FOLDER,
  status: BasicStatus.ENABLE,
  createTime: new Date(),
  modifyTime: new Date(),
  size: 0,
};

// 获取文件类型
const getFileType = (fileName: string): FileType => {
  if (fileName.endsWith('/')) return FileType.FOLDER;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg': case 'jpeg': case 'png': case 'gif':
      return FileType.JPEG;
    case 'pdf': return FileType.PDF;
    case 'doc': case 'docx': return FileType.DOCX;
    case 'mp4': case 'mov': case 'avi': return FileType.MP4;
    case 'mp3': case 'wav': return FileType.MP3;
    default: return FileType.FILE;
  }
};

export default function FilePage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<string>();
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // 从 MinIO 获取文件列表
  const fetchFiles = async (prefix = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        bucket: DEFAULT_BUCKET,
        prefix: prefix
      });
      
      const response = await fetch(`${MINIO_API_URL}/list?${params}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }
  
      const fileList: File[] = data.files.map((file: any) => ({
        id: file.name,  // 使用文件名作为ID
        name: file.name.split('/').pop() || file.name, // 提取文件名部分
        type: file.name.endsWith('/') ? FileType.FOLDER : getFileType(file.name),
        size: file.size || 0,
        modifyTime: new Date(file.last_modified || Date.now()),
        createTime: new Date(file.last_modified || Date.now()),
        status: BasicStatus.ENABLE,
        parentId: prefix
      }));
  
      setFiles(fileList);
    } catch (error) {
      console.error('Error fetching files:', error);
      message.error(t("sys.menu.file.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId, t]);

    
  // 重命名文件或文件夹
  const onRename = async (formValue: File, newName: string) => {
    if (!formValue) {
      message.warning(t("sys.menu.file.selectRename"));
      return;
    }
  
    try {
      // 构建完整的对象路径
      const sourcePath = currentFolderId ? `${currentFolderId}${formValue.name}` : formValue.name;
      const targetPath = currentFolderId ? `${currentFolderId}${newName}` : newName;
  
      const response = await fetch(`${MINIO_API_URL}/rename?${new URLSearchParams({
        bucket: DEFAULT_BUCKET,
        source_name: sourcePath,
        target_name: targetPath
      })}`, {
        method: 'POST'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Rename failed");
      }
  
      message.success(t("sys.menu.file.renameSuccess"));
      fetchFiles(currentFolderId); // 刷新当前目录
    } catch (error) {
      console.error('Rename error:', error);
      message.error(t("sys.menu.file.renameFailed"));
    }
  };

  // 创建文件夹
  const onCreateFolder = async (folderName: string) => {
    try {
      const normalizedFolderName = folderName.replace(/^\//, '').replace(/\/$/, '') + '/';
      const fullFolderName = currentFolderId ? 
        `${currentFolderId}${normalizedFolderName}` : 
        normalizedFolderName;
  
      // 修改这里：使用URL查询参数
      const params = new URLSearchParams();
      params.append('bucket', DEFAULT_BUCKET);
      params.append('folder_name', fullFolderName);
  
      const response = await fetch(`${MINIO_API_URL}/create-folder?${params}`, {
        method: 'POST'  // 保持POST方法但参数放在URL
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Create folder failed");
      }
  
      message.success(t("sys.menu.file.createFolderSuccess"));
      fetchFiles(currentFolderId);
    } catch (error) {
      console.error('Error:', error);
      message.error(t("sys.menu.file.createFolderFailed"));
    }
  };

  // 文件模态框状态
  const [fileModalProps, setFileModalProps] = useState<FileModalProps>({
    formValue: { ...defaultFileValue },
    title: t("sys.menu.file.uploadFile"),
    show: false,
    fileStructure: files,
    onOk: (values) => handleFileOperation(values),
    onCancel: () => setFileModalProps(prev => ({ ...prev, show: false })),
    onRename: onRename,
  });
  

  // 文件夹模态框状态
  const [folderModalProps, setFolderModalProps] = useState<FolderModalProps>({
    formValue: { ...defaultFolderValue },
    title: t("sys.menu.file.newFolder"),
    show: false,
    fileStructure: files,
    onOk: (values) => handleFolderOperation(values),
    onCancel: () => setFolderModalProps(prev => ({ ...prev, show: false })),
    onRename: onRename,
    onCreateFolder: onCreateFolder,
  });
  // 处理文件上传
  const handleFileOperation = async (values: File) => {
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', DEFAULT_BUCKET);
      
      // 构建完整的对象路径
      const objectPath = currentFolderId ? `${currentFolderId}${values.name}` : values.name;
      formData.append('object_name', objectPath);
  
      try {
        const response = await fetch(`${MINIO_API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Upload failed');
        }
  
        message.success(t("sys.menu.file.uploadSuccess"));
        fetchFiles(currentFolderId); // 刷新当前目录
      } catch (error) {
        message.error(t("sys.menu.file.uploadFailed"));
        console.error('Upload error:', error);
      }
    }
  
    setFileModalProps(prev => ({ ...prev, show: false }));
  };

  // 处理文件夹操作
  const handleFolderOperation = async (values: File) => {
    try {
      if (values.id) {
        // 重命名文件夹
        await onRename(values, values.name);
      } else {
        // 创建新文件夹
        await onCreateFolder(values.name);
      }
      fetchFiles(currentFolderId); // 刷新当前目录
    } catch (error) {
      console.error('Folder operation failed:', error);
    }
  };

  const columns: ColumnsType<File> = [
    {
      title: t("sys.menu.file.name"),
      dataIndex: "name",
      width: 300,
      render: (_, record) => {
        let icon: JSX.Element | null;
        switch (record.type) {
          case FileType.FOLDER:
            icon = <FaFolder size={24} />;
            break;
          case FileType.JPEG:
          case FileType.PNG:
            icon = <FaFileImage size={24} />;
            break;
          case FileType.PDF:
            icon = <FaFilePdf size={24} />;
            break;
          case FileType.DOCX:
            icon = <FaFileWord size={24} />;
            break;
          case FileType.MP4:
            icon = <FaFileVideo size={24} />;
            break;
          case FileType.MP3:
            icon = <FaFileAudio size={24} />;
            break;
          default:
            icon = <FaFile size={24} />;
        }
        return (
          <div className="flex items-center">
            {icon}
            <div style={{ marginLeft: 8 }}>{record.name}</div>
          </div>
        );
      },
    },
    {
      title: t("sys.menu.file.size"),
      align: "center",
      dataIndex: "size",
      width: 120,
      render: (_, record) => <div>{fBytes(record.size)}</div>,
    },
    {
      title: t("sys.menu.file.type"),
      align: "center",
      dataIndex: "type",
      width: 60,
      render: (_, record) => <Tag color="processing">{FileType[record.type]}</Tag>,
    },
    {
      title: "",
      dataIndex: "",
    },
    {
      title: t("sys.menu.file.status.index"),
      dataIndex: "status",
      align: "center",
      width: 120,
      render: (status) => (
        <Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
          {status === BasicStatus.DISABLE ? t("sys.menu.file.status.disable") : t("sys.menu.file.status.enable")}
        </Tag>
      ),
    },
    {
      title: t("sys.menu.file.modifyTime"),
      dataIndex: "modifyTime",
      align: "center",
      width: 120,
      render: (_, record) => {
        const modifyTime = record.modifyTime;
        if (!modifyTime) return null;
        const date = new Date(modifyTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(modifyTime.getHours()).padStart(2, "0");
        const minutes = String(modifyTime.getMinutes()).padStart(2, "0");
        const seconds = String(modifyTime.getSeconds()).padStart(2, "0");
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        return (
          <div>
            <p>{formattedDateTime}</p>
          </div>
        );
      },
    },
    {
      title: t("sys.menu.file.operation"),
      key: "operation",
      align: "center",
      width: 100,
      render: (_, record) => (
        <div className="flex w-full justify-end text-gray">
          <IconButton onClick={() => onEdit(record)}>
            <Iconify icon="solar:pen-bold-duotone" size={18} />
          </IconButton>
          <Popconfirm 
            title={t("sys.menu.file.delete")} 
            okText={t("sys.yes")} 
            cancelText={t("sys.no")} 
            placement="left" 
            onConfirm={() => onDelete(record)}
          >
            <IconButton>
              <Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
            </IconButton>
          </Popconfirm>
        </div>
      ),
    },
  ];

  
  
  const handleBack = () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      const parentPrefix = newStack.pop() || "";
      setCurrentFolderId(parentPrefix);
      setFolderStack(newStack);
    }
  };

  const onUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setFileModalProps(prev => ({
      ...prev,
      show: true,
      formValue: {
        ...defaultFileValue,
        name: file.name,
        parentId: currentFolderId,
        size: file.size,
        type: getFileType(file.name),
      },
    }));
  
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDownload = async (file: File | null) => {
    if (!file) {
      message.warning(t("sys.menu.file.selectDownload"));
      return;
    }
  
    try {
      // 构建完整的对象路径
      const objectPath = currentFolderId ? `${currentFolderId}${file.name}` : file.name;
      const params = new URLSearchParams({
        bucket: DEFAULT_BUCKET,
        object_name: objectPath
      });
      
      window.open(`${MINIO_API_URL}/download?${params}`, '_blank');
      message.success(t("sys.menu.file.downloadSuccess"));
    } catch (err) {
      message.error(t("sys.menu.file.downloadFailed"));
    }
  };


  const onEdit = (formValue: File) => {
    if (formValue.type === FileType.FOLDER) {
      setFolderModalProps(prev => ({
        ...prev,
        show: true,
        title: t("sys.menu.file.renameFolder"),
        formValue: {
          ...formValue,
          name: formValue.name.endsWith('/') ? 
            formValue.name.slice(0, -1) : formValue.name
        },
      }));
    } else {
      setFileModalProps(prev => ({
        ...prev,
        show: true,
        title: t("sys.menu.file.editFile"),
        formValue,
      }));
    }
  };

  const onDelete = async (formValue: File) => {
    try {
      // 构建完整的对象路径
      const objectPath = currentFolderId ? `${currentFolderId}${formValue.name}` : formValue.name;
      
      const params = new URLSearchParams({
        bucket: DEFAULT_BUCKET,
        object_name: objectPath
      });
      
      const response = await fetch(`${MINIO_API_URL}/delete?${params}`, {
        method: 'DELETE'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }
  
      message.success(t("sys.menu.file.deleteSuccess"));
      fetchFiles(currentFolderId); // 刷新当前目录
    } catch (error) {
      console.error('Delete error:', error);
      message.error(t("sys.menu.file.deleteFailed"));
    }
  };

  const handleRowClick = (record: File) => {
    setSelectedFileId(record.id);
    setSelectedFile(record);
  };

  const handleCreateFolder = (e?: React.MouseEvent) => {
    e?.preventDefault(); // 可选：阻止默认行为
    
    setFolderModalProps(prev => ({
      ...prev,
      show: true,
      title: t("sys.menu.file.newFolder"),
      formValue: {
        ...defaultFolderValue,
        parentId: currentFolderId
      },
    }));
  };

  const handleRowDoubleClick = (record: File) => {
    if (record.type === FileType.FOLDER) {
      const newPrefix = record.name.endsWith('/') ? record.name : `${record.name}/`;
      setFolderStack(prev => [...prev, currentFolderId]);
      setCurrentFolderId(newPrefix);
    } else {
      onDownload(record);
    }
  };

  const extraButtons = (
    <div>
      <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
      {/* 添加刷新按钮 */}
        <Button 
        type="primary" 
        style={{ marginLeft: 8 }}
        onClick={() => fetchFiles(currentFolderId)}
        icon={<Iconify icon="ant-design:reload-outlined" />}
      >
        {t("sys.menu.file.refresh")}
      </Button>
      <Button 
        type="primary" 
        style={{ marginLeft: 8 }}
        onClick={handleBack}
        disabled={!folderStack.length}
        icon={<Iconify icon="ant-design:arrow-left-outlined" />}
      >
        {t("sys.menu.file.back")}
      </Button>
      <Button 
        type="primary" 
        style={{ marginLeft: 8 }} 
        onClick={onUpload}
        icon={<Iconify icon="ant-design:upload-outlined" />}
      >
        {t("sys.menu.file.upload")}
      </Button>
      <Button
        type="primary"
        style={{ marginLeft: 8 }}
        onClick={() => onDownload(selectedFile)}
        disabled={!selectedFile}
        icon={<Iconify icon="ant-design:download-outlined" />}
      >
        {t("sys.menu.file.download")}
      </Button>
      <Button 
        type="primary" 
        style={{ marginLeft: 8 }} 
        onClick={handleCreateFolder}
        icon={<Iconify icon="ant-design:folder-add-outlined" />}
      >
        {t("sys.menu.file.newFolder")}
      </Button>
    </div>
  );

  return (
    <Card
      title={t("sys.menu.file.fileList")}
      extra={extraButtons}
    >
      <Table
        rowKey="id"
        size="small"
        scroll={{ x: "max-content" }}
        pagination={false}
        columns={columns}
        dataSource={files}
        loading={loading}
        rowSelection={{
          type: "checkbox",
          selectedRowKeys: selectedFile ? [selectedFile.id] : [],
          onChange: (_, selectedRows) => setSelectedFile(selectedRows[0] || null),
        }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          onDoubleClick: () => handleRowDoubleClick(record),
          style: {
            cursor: 'pointer',
            background: selectedFileId === record.id ? '#e6f7ff' : 'inherit',
          }
        })}
      />

      <FileModal {...fileModalProps} />
      <FolderModal {...folderModalProps} />
    </Card>
  );
}