import { AutoComplete, Form, Input, InputNumber, Modal, Radio, TreeSelect } from "antd";
import { useCallback, useEffect, useState } from "react";

import { useUserPermission } from "@/store/userStore";

import type { Permission } from "#/entity";
import { BasicStatus, PermissionType } from "#/enum";

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

export type PermissionModalProps = {
	formValue: Permission;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export default function PermissionModal({ title, show, formValue, onOk, onCancel }: PermissionModalProps) {
	const [form] = Form.useForm();
	const permissions = useUserPermission();
	const [compOptions, setCompOptions] = useState(PAGE_SELECT_OPTIONS);

	const getParentNameById = useCallback(
		(parentId: string, data: Permission[] | undefined = permissions) => {
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
		[permissions],
	);

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
				<Form.Item<Permission> label="类型" name="type" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={PermissionType.CATALOGUE}>目录</Radio>
						<Radio value={PermissionType.MENU}>菜单</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<Permission> label="权限名" name="name" required>
					<Input />
				</Form.Item>

				<Form.Item<Permission> label="标签" name="label" required tooltip="internationalization config">
					<Input />
				</Form.Item>

				<Form.Item<Permission> label="父亲组件" name="parentId" required>
					<TreeSelect
						fieldNames={{
							label: "name",
							value: "id",
							children: "children",
						}}
						allowClear
						treeData={permissions}
						onChange={(_value, labelList) => {
							updateCompOptions(labelList[0] as string);
						}}
					/>
				</Form.Item>

				<Form.Item<Permission> label="路由" name="route" required>
					<Input />
				</Form.Item>

				<Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
					{({ getFieldValue }) => {
						if (getFieldValue("type") === PermissionType.MENU) {
							return (
								<Form.Item<Permission>
									label="Component"
									name="component"
									required={getFieldValue("type") === PermissionType.MENU}
								>
									<AutoComplete
										options={compOptions}
										filterOption={(input, option) =>
											((option?.label || "") as string).toLowerCase().includes(input.toLowerCase())
										}
									/>
								</Form.Item>
							);
						}
						return null;
					}}
				</Form.Item>

				<Form.Item<Permission> label="图标" name="icon" tooltip="local icon should start with ic">
					<Input />
				</Form.Item>

				<Form.Item<Permission> label="隐藏" name="hide" tooltip="hide in menu">
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={false}>显示</Radio>
						<Radio value>隐藏</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<Permission> label="次序" name="order">
					<InputNumber style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item<Permission> label="状态" name="status" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={BasicStatus.ENABLE}> 启用 </Radio>
						<Radio value={BasicStatus.DISABLE}> 禁用 </Radio>
					</Radio.Group>
				</Form.Item>
			</Form>
		</Modal>
	);
}
