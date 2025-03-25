import { Form, Input, InputNumber, Modal, Radio, Tree } from "antd";
import { useEffect } from "react";

import { PERMISSION_LIST } from "@/_mock/assets";
import { flattenTrees } from "@/utils/tree";

import type { Permission, Role } from "#/entity";
import { BasicStatus } from "#/enum";

import { useTranslation } from "react-i18next";

export type RoleModalProps = {
	formValue: Role;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};
const PERMISSIONS: Permission[] = PERMISSION_LIST as Permission[];
export function RoleModal({ title, show, formValue, onOk, onCancel }: RoleModalProps) {
	const [form] = Form.useForm();

	const { t } = useTranslation();

	const flattenedPermissions = flattenTrees(formValue.permission);
	const checkedKeys = flattenedPermissions.map((item) => item.id);
	useEffect(() => {
		form.setFieldsValue({ ...formValue });
	}, [formValue, form]);

	return (
		<Modal title={title} open={show} onOk={onOk} onCancel={onCancel}>
			<Form initialValues={formValue} form={form} labelCol={{ span: 4 }} wrapperCol={{ span: 18 }} layout="horizontal">
				<Form.Item<Role> label={t("sys.menu.system.user.name")} name="name" required>
					<Input />
				</Form.Item>

				<Form.Item<Role> label={t("sys.menu.system.role.lable")} name="label" required>
					<Input />
				</Form.Item>

				<Form.Item<Role> label={t("sys.menu.system.role.order")} name="order">
					<InputNumber style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item<Role> label={t("sys.menu.system.role.status.index")} name="status" required>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={BasicStatus.ENABLE}> {t("sys.menu.system.role.status.enable")} </Radio>
						<Radio value={BasicStatus.DISABLE}> {t("sys.menu.system.role.status.disable")} </Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<Role> label={t("sys.menu.system.role.desc")} name="desc">
					<Input.TextArea />
				</Form.Item>

				<Form.Item<Role> label={t("sys.menu.system.role.permission")} name="permission">
					<Tree
						checkable
						checkedKeys={checkedKeys}
						treeData={PERMISSIONS}
						fieldNames={{
							key: "id",
							children: "children",
							title: "name",
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
