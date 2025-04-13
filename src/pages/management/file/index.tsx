import { Button, Card, Popconfirm, Tag, message } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { isNil } from "ramda";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { FILE_LIST } from "@/_mock/assets";
import { IconButton, Iconify, SvgIcon } from "@/components/icon";
import { useUserFile } from "@/store/userStore";
import axios from "axios";

// 引入需要的图标
import { FaFolder } from "react-icons/fa";
import { FaFileImage } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa";
import { FaFileWord } from "react-icons/fa";
import { FaFileVideo } from "react-icons/fa";
import { FaFileAudio } from "react-icons/fa";

import FileModal, { type FileModalProps } from "./file-modal";

import { fBytes } from "@/utils/format-number";
import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";

const defaultFileValue: File = {
	id: "",
	parentId: "root",
	name: "",
	type: FileType.FOLDER,
	status: BasicStatus.ENABLE,
	createTime: new Date(),
	modifyTime: new Date(),
};

export default function FilePage() {
	const { t } = useTranslation();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<File[]>(FILE_LIST);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	const [fileModalProps, setFileModalProps] = useState<FileModalProps>({
		formValue: { ...defaultFileValue },
		title: t("sys.menu.file.new"),
		show: false,
		fileStructure: files, // 初始化时提供
		onOk: (values) => {
			if (values.id) {
				setFiles((prev) => prev.map((item) => (item.id === values.id ? { ...values, modifyTime: new Date() } : item)));
			} else {
				const newFile = {
					...values,
					id: Date.now().toString(),
					createTime: new Date(),
					modifyTime: new Date(),
				};
				setFiles((prev) => [...prev, newFile]);
			}
			setFileModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setFileModalProps((prev) => ({ ...prev, show: false }));
		},
	});

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
			// 文件名渲染
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
						icon = null;
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
			// 文件大小渲染
			title: t("sys.menu.file.size"),
			align: "center",
			dataIndex: "size",
			width: 120,
			render: (_, record) => <div>{fBytes(record.size)}</div>,
		},
		{
			// 文件类型渲染
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
			// 文件状态渲染
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
			// 文件修改时间
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
			// 文件操作渲染
			title: t("sys.menu.file.operation"),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-end text-gray">
					{record?.type === FileType.FOLDER && (
						<IconButton onClick={() => onCreate(record.id)}>
							<Iconify icon="gridicons:add-outline" size={18} />
						</IconButton>
					)}
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title={t("sys.menu.file.delete")} okText={t("sys.yes")} cancelText={t("sys.no")} placement="left">
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			// 模拟上传请求
			const formData = new FormData();
			formData.append("file", file);

			// 此处替换为实际API调用
			// const response = await axios.post("/api/upload", formData);

			// 模拟响应数据
			const newFile: File = {
				id: Date.now().toString(),
				name: file.name,
				type: FileType[file.type.split("/")[1].toUpperCase() as keyof typeof FileType] || FileType.FILE,
				size: file.size,
				parentId: "root",
				status: BasicStatus.ENABLE,
				createTime: new Date(),
				modifyTime: new Date(),
			};

			setFiles((prev) => [...prev, newFile]);
			message.success(t("sys.menu.file.uploadSuccess"));
		} catch (err) {
			message.error(t("sys.menu.file.uploadFailed"));
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const onDownload = async (file: File | null) => {
		if (!file) {
			message.warning(t("sys.menu.file.selectDownload"));
			return;
		}

		try {
			// 模拟下载请求
			// const response = await axios.get(`/api/download/${file.id}`, {
			//   responseType: "blob"
			// });

			// 创建临时链接模拟下载
			const blob = new Blob([`Mock content for ${file.name}`], { type: "text/plain" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = file.name;
			a.click();
			window.URL.revokeObjectURL(url);

			message.success(t("sys.menu.file.downloadSuccess"));
		} catch (err) {
			message.error(t("sys.menu.file.downloadFailed"));
		}
	};

	const onCreate = (parentId?: string) => {
		setFileModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.file.new"),
			formValue: {
				...defaultFileValue,
				parentId: parentId || "root",
				type: parentId ? FileType.FILE : FileType.FOLDER,
			},
		}));
	};

	const onEdit = (formValue: File) => {
		setFileModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.file.edit"),
			formValue,
		}));
	};

	const handleDelete = (fileId: string) => {
		setFiles((prev) => prev.filter((file) => file.id !== fileId));
		message.success(t("sys.menu.file.deleteSuccess"));
	};

	return (
		<Card
			title={t("sys.menu.file.fileList")}
			extra={
				<div>
					<input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
					<Button type="primary" onClick={onUpload}>
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
					<Button type="primary" style={{ marginLeft: 8 }} onClick={() => onCreate()}>
						{t("sys.menu.file.create")}
					</Button>
				</div>
			}
		>
			<Table
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				columns={columns}
				dataSource={files}
				rowSelection={{
					type: "checkbox",
					selectedRowKeys: selectedFile ? [selectedFile.id] : [],
					onChange: (_, selectedRows) => setSelectedFile(selectedRows[0] || null),
				}}
			/>

			<FileModal {...fileModalProps} />
		</Card>
	);
}
