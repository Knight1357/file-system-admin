import { Form, Input, Modal, Radio, Select } from "antd";
import { useEffect } from "react";

import { ROLE_LIST } from "@/_mock/assets";
import { useTranslation } from "react-i18next";

import type { Role, UserInfo } from "#/entity";
import { BasicStatus } from "#/enum";

export type UserModalProps = {
	formValue: UserInfo;
	title: string;
	show: boolean;
	onOk: (values: UserInfo) => void;
	onCancel: VoidFunction;
};

const ROLES: Role[] = ROLE_LIST as Role[];

export function UserModal({ title, show, formValue, onOk, onCancel }: UserModalProps) {
	const [form] = Form.useForm();
	const { t } = useTranslation();

	useEffect(() => {
		form.setFieldsValue({ ...formValue });
	}, [formValue, form]);

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			onOk({ ...formValue, ...values });
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
		>
			<Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} initialValues={{ status: BasicStatus.ENABLE }}>
				<Form.Item<UserInfo>
					label={t("sys.menu.system.user.username")}
					name="username"
					rules={[{ required: true, message: t("sys.menu.system.user.usernameRequired") }]}
				>
					<Input />
				</Form.Item>

				<Form.Item<UserInfo>
					label={t("sys.menu.system.user.email")}
					name="email"
					rules={[
						{ required: true, message: t("sys.menu.system.user.emailRequired") },
						{ type: "email", message: t("sys.menu.system.user.emailInvalid") },
					]}
				>
					<Input />
				</Form.Item>

				{!formValue?.id && (
					<Form.Item<UserInfo>
						label={t("sys.menu.system.user.password")}
						name="password"
						rules={[
							{ required: true, message: t("sys.menu.system.user.passwordRequired") },
							{ min: 6, message: t("sys.menu.system.user.passwordMinLength") },
						]}
					>
						<Input.Password />
					</Form.Item>
				)}

				<Form.Item<UserInfo>
					label={t("sys.menu.system.user.role")}
					name="role"
					rules={[{ required: true, message: t("sys.menu.system.user.roleRequired") }]}
				>
					<Select
						options={ROLES.map((role) => ({
							label: role.name,
							value: role.id,
						}))}
					/>
				</Form.Item>

				<Form.Item<UserInfo> label={t("sys.menu.system.user.status.index")} name="status" rules={[{ required: true }]}>
					<Radio.Group optionType="button" buttonStyle="solid">
						<Radio value={BasicStatus.ENABLE}>{t("sys.menu.system.user.status.enable")}</Radio>
						<Radio value={BasicStatus.DISABLE}>{t("sys.menu.system.user.status.disable")}</Radio>
					</Radio.Group>
				</Form.Item>

				<Form.Item<UserInfo> label={t("sys.menu.system.user.avatar")} name="avatar">
					<Input placeholder="URL地址" />
				</Form.Item>
			</Form>
		</Modal>
	);
}
