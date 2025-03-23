import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { isNil } from "ramda";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FILE_LIST } from "@/_mock/assets";
import { IconButton, Iconify, SvgIcon } from "@/components/icon";
import { useUserFile } from "@/store/userStore";

import FileModal, { type FileModalProps } from "./file-modal";

import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";
import { fBytes } from "@/utils/format-number";

const defaultFileValue: File = {
	id: "",
	parentId: "root",
	name: "",
	label: "",
	// 文件或文件夹的类型，使用 FileType 枚举区分
	type: FileType.FOLDER,
	// 文件或文件夹的状态，使用 BasicStatus 枚举
	status: BasicStatus.ENABLE,
	// 文件或文件夹的创建时间
	createTime: new Date(),
	// 文件或文件夹的修改时间
	modifyTime: new Date(),
};

const FILE: File[] = FILE_LIST as File[];

export default function FilePage() {
	const { t } = useTranslation();

	const [fileModalProps, setFileModalProps] = useState<FileModalProps>({
		formValue: { ...defaultFileValue },
		title: "New",
		show: false,
		onOk: () => {
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
			title: t("sys.menu.file.name"),
			dataIndex: "name",
			width: 300,
			render: (_, record) => <div>{t(record.label)}</div>,
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
			title: t("sys.menu.file.status"),
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status) => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
					{status === BasicStatus.DISABLE ? t("sys.menu.file.statuses.disable") : t("sys.menu.file.statuses.enable")}
				</Tag>
			),
		},
		{
			title: t("sys.menu.file.modifyTime"),
			dataIndex: "modifyTime",
			align: "center",
			width: 120,
			render: (status) => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
					{status === BasicStatus.DISABLE ? "Disable" : "Enable"}
				</Tag>
			),
		},
		{
			title: t("sys.menu.file.action"),
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
					<Popconfirm title="Delete the File" okText="Yes" cancelText="No" placement="left">
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onUpload = () => {
		// 处理新按钮点击的逻辑
		console.log("上传文件");
	};

	const onDownload = () => {
		// 处理新按钮点击的逻辑
		console.log("下载文件");
	};

	const onCreate = (parentId?: string) => {
		setFileModalProps((prev) => ({
			...prev,
			show: true,
			...defaultFileValue,
			title: "New",
			formValue: { ...defaultFileValue, parentId: parentId ?? "" },
		}));
	};

	const onEdit = (formValue: File) => {
		setFileModalProps((prev) => ({
			...prev,
			show: true,
			title: "Edit",
			formValue,
		}));
	};
	return (
		<Card
			title={t("sys.menu.file.fileList")}
			extra={
				<div>
					<Button type="primary" style={{ marginLeft: 8 }} onClick={() => onUpload()}>
						{t("sys.menu.file.upload")}
					</Button>
					<Button type="primary" style={{ marginLeft: 8 }} onClick={() => onDownload()}>
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
				dataSource={FILE}
			/>

			<FileModal {...fileModalProps} />
		</Card>
	);
}
