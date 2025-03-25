import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { useState } from "react";

import { ROLE_LIST } from "@/_mock/assets";
import { IconButton, Iconify } from "@/components/icon";

import { RoleModal, type RoleModalProps } from "./role-modal";

import type { Role } from "#/entity";
import { BasicStatus } from "#/enum";

import { useTranslation } from "react-i18next";

const ROLES: Role[] = ROLE_LIST as Role[];

const DEFAULE_ROLE_VALUE: Role = {
	id: "",
	name: "",
	label: "",
	status: BasicStatus.ENABLE,
	permission: [],
};
export default function RolePage() {
	const { t } = useTranslation();

	const [roleModalPros, setRoleModalProps] = useState<RoleModalProps>({
		formValue: { ...DEFAULE_ROLE_VALUE },
		title: t("sys.menu.system.role.create"),
		show: false,
		onOk: () => {
			setRoleModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setRoleModalProps((prev) => ({ ...prev, show: false }));
		},
	});
	const columns: ColumnsType<Role> = [
		{
			title: t("sys.menu.system.role.name"),
			dataIndex: "name",
			width: 300,
		},
		{
			title: t("sys.menu.system.role.lable"),
			dataIndex: "label",
		},
		{ title: t("sys.menu.system.role.order"), dataIndex: "order", width: 60 },
		{
			title: t("sys.menu.system.role.status.index"),
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status) => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
					{status === BasicStatus.DISABLE
						? t("sys.menu.system.role.status.disable")
						: t("sys.menu.system.role.status.enable")}
				</Tag>
			),
		},
		{ title: t("sys.menu.system.role.desc"), dataIndex: "desc" },
		{
			title: t("sys.menu.system.role.action"),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center text-gray">
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title="Delete the Role" okText="Yes" cancelText="No" placement="left">
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onCreate = () => {
		setRoleModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.system.role.create"),
			formValue: {
				...prev.formValue,
				...DEFAULE_ROLE_VALUE,
			},
		}));
	};

	const onEdit = (formValue: Role) => {
		setRoleModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.system.role.edit"),
			formValue,
		}));
	};

	return (
		<Card
			title={t("sys.menu.system.role.list")}
			extra={
				<Button type="primary" onClick={onCreate}>
					{t("sys.menu.system.role.create")}
				</Button>
			}
		>
			<Table
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				columns={columns}
				dataSource={ROLES}
			/>

			<RoleModal {...roleModalPros} />
		</Card>
	);
}
