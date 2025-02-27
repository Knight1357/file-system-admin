// 从 antd 库中导入所需的组件，包括按钮、卡片、确认弹窗和标签
import { Button, Card, Popconfirm, Tag } from "antd";
// 从 antd 的表格模块中导入 Table 组件和 ColumnsType 类型
import Table, { type ColumnsType } from "antd/es/table";
// 从 ramda 库中导入 isNil 函数，用于检查值是否为 null 或 undefined
import { isNil } from "ramda";
// 从 react 库中导入 useState 钩子，用于管理组件的状态
import { useState } from "react";
// 从 react-i18next 库中导入 useTranslation 钩子，用于实现国际化
import { useTranslation } from "react-i18next";

// 从自定义组件库中导入图标相关的组件
import { IconButton, Iconify, SvgIcon } from "@/components/icon";
// 从用户状态管理库中导入 useUserPermission 钩子，用于获取用户权限数据
import { useUserPermission } from "@/store/userStore";

// 导入权限模态框组件及其属性类型
import PermissionModal, { type PermissionModalProps } from "./permission-modal";

// 导入 Permission 类型和相关枚举
import type { Permission } from "#/entity";
import { BasicStatus, PermissionType } from "#/enum";

// 定义默认的权限值对象，用于初始化表单数据
const defaultPermissionValue: Permission = {
	id: "",
	parentId: "",
	name: "",
	label: "",
	route: "",
	component: "",
	icon: "",
	hide: false,
	status: BasicStatus.ENABLE,
	type: PermissionType.CATALOGUE,
};
export default function PermissionPage() {
	const permissions = useUserPermission();
	const { t } = useTranslation();

	const [permissionModalProps, setPermissionModalProps] = useState<PermissionModalProps>({
		formValue: { ...defaultPermissionValue },
		title: "New",
		show: false,
		onOk: () => {
			setPermissionModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setPermissionModalProps((prev) => ({ ...prev, show: false }));
		},
	});
	const columns: ColumnsType<Permission> = [
		{
			title: "Name",
			dataIndex: "name",
			width: 300,
			render: (_, record) => <div>{t(record.label)}</div>,
		},
		{
			title: "Type",
			dataIndex: "type",
			width: 60,
			render: (_, record) => <Tag color="processing">{PermissionType[record.type]}</Tag>,
		},
		{
			title: "Icon",
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
			title: "Component",
			dataIndex: "component",
		},
		{
			title: "Status",
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status) => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
					{status === BasicStatus.DISABLE ? "Disable" : "Enable"}
				</Tag>
			),
		},
		{ title: "Order", dataIndex: "order", width: 60 },
		{
			title: "Action",
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-end text-gray">
					{record?.type === PermissionType.CATALOGUE && (
						<IconButton onClick={() => onCreate(record.id)}>
							<Iconify icon="gridicons:add-outline" size={18} />
						</IconButton>
					)}
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title="Delete the Permission" okText="Yes" cancelText="No" placement="left">
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onCreate = (parentId?: string) => {
		setPermissionModalProps((prev) => ({
			...prev,
			show: true,
			...defaultPermissionValue,
			title: "New",
			formValue: { ...defaultPermissionValue, parentId: parentId ?? "" },
		}));
	};

	const onEdit = (formValue: Permission) => {
		setPermissionModalProps((prev) => ({
			...prev,
			show: true,
			title: "Edit",
			formValue,
		}));
	};
	return (
		<Card
			title="Permission List"
			extra={
				<Button type="primary" onClick={() => onCreate()}>
					New
				</Button>
			}
		>
			<Table
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				columns={columns}
				dataSource={permissions}
			/>

			<PermissionModal {...permissionModalProps} />
		</Card>
	);
}
