import { Form, Input, Modal, Radio, TreeSelect, Upload, UploadFile, UploadProps } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { InboxOutlined } from "@ant-design/icons";

import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";

const { Dragger } = Upload;

export type FileModalProps = {
	formValue: File;
	title: string;
	show: boolean;
	fileStructure: File[];
	onOk: (values: File) => void;
	onCancel: VoidFunction;
};

export default function FileModal({ title, show, formValue, fileStructure, onOk, onCancel }: FileModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm();
	const [fileList, setFileList] = useState<UploadFile[]>([]);

	// 生成文件夹树形数据
	const generateFolderTree = (files: File[]): File[] => {
		return files
			.filter((file) => file.type === FileType.FOLDER)
			.map((folder) => ({
				...folder,
				children: generateFolderTree(files.filter((f) => f.parentId === folder.id)),
			}));
	};

	// 文件上传配置
	const uploadProps: UploadProps = {
		name: "file",
		multiple: false,
		beforeUpload: () => false, // 阻止自动上传
		onChange(info) {
			const file = info.fileList.slice(-1)[0]; // 只保留最后一个文件
			setFileList([file]);
			form.setFieldValue("size", file.size);
		},
	};

	useEffect(() => {
		form.setFieldsValue({
			...formValue,
			// 当新建文件时自动设置默认值
			...(formValue.id ? {} : { status: BasicStatus.ENABLE }),
		});
		// 重置上传状态
		if (!show) setFileList([]);
	}, [formValue, show, form]);

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const formData = new FormData();

			// 处理文件上传
			if (values.type === FileType.FILE && fileList.length > 0) {
				if (fileList[0]?.originFileObj) {
					formData.append("file", fileList[0].originFileObj as Blob);
				}
			}

			// 合并表单数据
			const fileData: File = {
				...formValue,
				...values,
				modifyTime: new Date(),
				createTime: formValue.id ? formValue.createTime : new Date(),
				size: values.type === FileType.FOLDER ? 0 : values.size,
			};

			onOk(fileData);
			form.resetFields();
		} catch (err) {
			console.error("Form validation failed:", err);
		}
	};

	return (
		<Modal
			title={title}
			open={show}
			onOk={handleSubmit}
			onCancel={() => {
				form.resetFields();
				onCancel();
			}}
			destroyOnClose
			forceRender
		>
			<Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} initialValues={{ type: FileType.FILE }}>
				<Form.Item<File> label={t("sys.menu.file.type")} name="type" rules={[{ required: true }]}>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={FileType.FILE}>{t("sys.menu.file.typeFile")}</Radio>
						<Radio value={FileType.FOLDER}>{t("sys.menu.file.typeFolder")}</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<File>
					label={t("sys.menu.file.name")}
					name="name"
					rules={[{ required: true, message: t("sys.menu.file.nameRequired") }]}
				>
					<Input />
				</Form.Item>

				<Form.Item<File> label={t("sys.menu.file.parent.name")} name="parentId" initialValue="root">
					<TreeSelect
						treeData={generateFolderTree(fileStructure)}
						fieldNames={{
							label: "name",
							value: "id",
							children: "children",
						}}
						dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
					/>
				</Form.Item>

				<Form.Item noStyle shouldUpdate>
					{({ getFieldValue }) =>
						getFieldValue("type") === FileType.FILE ? (
							<>
								<Form.Item<File>
									label={t("sys.menu.file.upload")}
									name="content"
									valuePropName="fileList"
									getValueFromEvent={(e) => e.fileList}
								>
									<Dragger {...uploadProps} fileList={fileList}>
										<p className="ant-upload-drag-icon">
											<InboxOutlined />
										</p>
										<p>{t("sys.menu.file.uploadTip")}</p>
									</Dragger>
								</Form.Item>

								<Form.Item<File> label={t("sys.menu.file.size")} name="size" hidden>
									<Input disabled />
								</Form.Item>
							</>
						) : null
					}
				</Form.Item>

				<Form.Item<File> label={t("sys.menu.file.status.index")} name="status" rules={[{ required: true }]}>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={BasicStatus.ENABLE}>{t("sys.menu.file.status.enable")}</Radio>
						<Radio value={BasicStatus.DISABLE}>{t("sys.menu.file.status.disable")}</Radio>
					</Radio.Group>
				</Form.Item>
			</Form>
		</Modal>
	);
}
