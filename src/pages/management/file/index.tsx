import { Button, Card, Popconfirm, Tag, message } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { isNil } from "ramda";
import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { FILE_LIST } from "@/_mock/assets";
import { IconButton, Iconify, SvgIcon } from "@/components/icon";

// 引入需要的图标
import { FaFolder,FaFileImage,FaFilePdf,FaFileWord,FaFileVideo,FaFileAudio,FaFile } from "react-icons/fa";

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
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return FileType.JPEG;
    case 'pdf':
      return FileType.PDF;
    case 'doc':
    case 'docx':
      return FileType.DOCX;
    case 'mp4':
    case 'mov':
    case 'avi':
      return FileType.MP4;
    case 'mp3':
    case 'wav':
      return FileType.MP3;
    default:
      return FileType.FILE;
  }
};

export default function FilePage() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string>(""); // 当前所在文件夹
  const [selectedFileId, setSelectedFileId] = useState<string>(); // 当前选中文件
  const [folderStack, setFolderStack] = useState<string[]>([]); // 文件夹导航栈
  const [loading, setLoading] = useState(false);

  // 从 MinIO 获取文件列表
// 修改 fetchFiles 函数
const fetchFiles = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${MINIO_API_URL}/list?bucket=${DEFAULT_BUCKET}`, {
      mode: 'cors', // 确保启用 CORS
      headers: {
        'Accept': 'application/json',
      }
    });

    // 添加响应状态检查
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch files');
    }

    const data = await response.json();
    console.log('Received data from server:', data); // 调试日志

    if (!data.files) {
      throw new Error('Invalid response format: missing files array');
    }

    // 转换 MinIO 文件列表为我们的 File 类型
    const fileList: File[] = data.files.map((file: any) => ({
      id: `${MINIO_API_URL}/download?bucket=${DEFAULT_BUCKET}&object_name=${encodeURIComponent(file.name)}`,
      parentId: currentFolderId,
      name: file.name,
      type: file.name.endsWith('/') ? FileType.FOLDER : getFileType(file.name),
      status: BasicStatus.ENABLE,
      createTime: new Date(file.last_modified || Date.now()),
      modifyTime: new Date(file.last_modified || Date.now()),
      size: file.size || 0,
    }));

    console.log('Processed file list:', fileList); // 调试日志
    setFiles(fileList);
  } catch (error) {
    console.error('Error details:', error); // 详细错误日志
    message.error(t("sys.menu.file.fetchFailed"));
  } finally {
    setLoading(false);
  }
};

// 确保 useEffect 正确调用
useEffect(() => {
  fetchFiles();
}, [currentFolderId, t]); // 添加 t 到依赖数组

  // 文件模态框状态
  const [fileModalProps, setFileModalProps] = useState<FileModalProps>({
    formValue: { ...defaultFileValue },
    title: t("sys.menu.file.uploadFile"),
    show: false,
    fileStructure: files,
    onOk: (values) => handleFileOperation(values),
    onCancel: () => setFileModalProps(prev => ({ ...prev, show: false })),
  });

  // 文件夹模态框状态
  const [folderModalProps, setFolderModalProps] = useState<FolderModalProps>({
    formValue: { ...defaultFolderValue },
    title: t("sys.menu.file.newFolder"),
    show: false,
    fileStructure: files,
    onOk: (values) => handleFolderOperation(values),
    onCancel: () => setFolderModalProps(prev => ({ ...prev, show: false })),
  });

  // 处理文件上传
  const handleFileOperation = async (values: File) => {
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', DEFAULT_BUCKET);
      formData.append('object_name', values.name);

      try {
        const response = await fetch(`${MINIO_API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        message.success(t("sys.menu.file.uploadSuccess"));
        fetchFiles(); // 刷新文件列表
      } catch (error) {
        message.error(t("sys.menu.file.uploadFailed"));
        console.error('Upload error:', error);
      }
    }

    setFileModalProps(prev => ({ ...prev, show: false }));
  };

  // 处理文件夹操作
  const handleFolderOperation = (values: File) => {
    // MinIO 不支持创建空文件夹，这里保持原有逻辑但不实际创建
    message.warning(t("sys.menu.file.folderNotSupported"));
    setFolderModalProps(prev => ({ ...prev, show: false }));
  };

  const columns: ColumnsType<File> = [
    {
      title: t("sys.menu.file.icon"),
      dataIndex: "icon",
      width: 60,
      render: (icon: string) => {
        if (isNil(icon)) return "";
        if (icon.startsWith("ic")) {
          return <SvgIcon icon={icon} size={18} className="ant-menu-item-icon" />;
        }
        return <Iconify icon={icon} size={18} className="ant-menu-item-icon" />;
      },
    },
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
      const parentId = newStack.pop();
      setCurrentFolderId(parentId || "");
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
      // 直接使用 MinIO 提供的下载链接
      window.open(file.id, '_blank');
      message.success(t("sys.menu.file.downloadSuccess"));
    } catch (err) {
      message.error(t("sys.menu.file.downloadFailed"));
    }
  };

  const onCreateFolder = () => {
    message.warning(t("sys.menu.file.folderNotSupported"));
  };

  const onEdit = (formValue: File) => {
    if (formValue.type === FileType.FOLDER) {
      message.warning(t("sys.menu.file.folderNotSupported"));
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
      const objectName = encodeURIComponent(formValue.name);
      const response = await fetch(
        `${MINIO_API_URL}/delete?bucket=${DEFAULT_BUCKET}&object_name=${objectName}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      message.success(t("sys.menu.file.deleteSuccess"));
      fetchFiles(); // 刷新文件列表
    } catch (error) {
      message.error(t("sys.menu.file.deleteFailed"));
      console.error('Delete error:', error);
    }
  };

  const handleRowClick = (record: File) => {
    setSelectedFileId(record.id);
    setSelectedFile(record);
  };

  const handleRowDoubleClick = (record: File) => {
    if (record.type === FileType.FOLDER) {
      setFolderStack(prev => [...prev, currentFolderId]);
      setCurrentFolderId(record.id);
    } else {
      onDownload(record);
    }
  };

  const extraButtons = (
    <div>
      <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
      <Button 
        type="primary" 
        style={{ marginLeft: 8 }}
        onClick={handleBack}
        disabled={!folderStack.length}
      >
        {t("sys.menu.file.back")}
      </Button>
      <Button type="primary" style={{ marginLeft: 8 }} onClick={onUpload}>
        {t("sys.menu.file.upload")}
      </Button>
      <Button
        type="primary"
        style={{ marginLeft: 8 }}
        onClick={() => onDownload(selectedFile)}
        disabled={!selectedFile}
      >
        {t("sys.menu.file.download")}
      </Button>
      <Button 
        type="primary" 
        style={{ marginLeft: 8 }} 
        onClick={onCreateFolder}
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