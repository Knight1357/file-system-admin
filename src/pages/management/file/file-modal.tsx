import { AutoComplete, Form, Input, InputNumber, Modal, Radio, TreeSelect } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useUserFile } from "@/store/userStore";

import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";

// Constants
const ENTRY_PATH = "/src/pages";
const PAGES = import.meta.glob("/src/pages/**/*.tsx");
const PAGE_SELECT_OPTIONS = Object.entries(PAGES).map(([path]) => {
	const pagePath = path.replace(ENTRY_PATH, "");
	return {
		label: pagePath,
		value: pagePath,
	};
});

export type FileModalProps = {
	formValue: File;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export default function FileModal({ title, show, formValue, onOk, onCancel }: FileModalProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm();
	const files = useUserFile();
	const [compOptions, setCompOptions] = useState(PAGE_SELECT_OPTIONS);

	// 使用 useCallback 定义一个递归函数，用于根据父文件 ID 获取父文件名称
	const getParentNameById = useCallback(
		(parentId: string, data: File[] | undefined = files) => {
			let name = "";
			if (!data || !parentId) return name;
			for (let i = 0; i < data.length; i += 1) {
				if (data[i].id === parentId) {
					name = data[i].name;
				} else if (data[i].children) {
					name = getParentNameById(parentId, data[i].children);
				}
				if (name) {
					break;
				}
			}
			return name;
		},
		[files],
	);

	// 根据输入的名称过滤 PAGE_SELECT_OPTIONS，更新 compOptions 状态
	const updateCompOptions = (name: string) => {
		if (!name) return;
		setCompOptions(
			PAGE_SELECT_OPTIONS.filter((path) => {
				return path.value.includes(name.toLowerCase());
			}),
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		form.setFieldsValue({ ...formValue });
		if (formValue.parentId) {
			const parentName = getParentNameById(formValue.parentId);
			updateCompOptions(parentName);
		}
	}, [formValue, form, getParentNameById]);

	return (
		<Modal forceRender title={title} open={show} onOk={onOk} onCancel={onCancel}>
			<Form initialValues={formValue} form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} layout="horizontal">
				<Form.Item<File> label={t("sys.menu.file.name")} name="name" required>
					<Input />
				</Form.Item>

				<Form.Item<File> label={t("sys.menu.file.parent.name")} name="parentId" required>
					<TreeSelect
						fieldNames={{
							label: "name",
							value: "id",
							children: "children",
						}}
						allowClear
						treeData={files}
						onChange={(_value, labelList) => {
							updateCompOptions(labelList[0] as string);
						}}
					/>
				</Form.Item>

				<Form.Item<File> label={t("sys.menu.file.status.index")} name="status" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={BasicStatus.ENABLE}> {t("sys.menu.file.status.enable")} </Radio>
						<Radio value={BasicStatus.DISABLE}> {t("sys.menu.file.status.disable")} </Radio>
					</Radio.Group>
				</Form.Item>
			</Form>
		</Modal>
	);
}
