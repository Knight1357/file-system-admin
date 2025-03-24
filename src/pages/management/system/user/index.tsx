import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";

import { USER_LIST } from "@/_mock/assets";
import { IconButton, Iconify } from "@/components/icon";
import { usePathname, useRouter } from "@/router/hooks";

import { useTranslation } from "react-i18next";

import type { Role, UserInfo } from "#/entity";
import { BasicStatus } from "#/enum";

const USERS: UserInfo[] = USER_LIST as UserInfo[];

export default function RolePage() {
	const { push } = useRouter();
	const pathname = usePathname();
	const { t } = useTranslation();

	const columns: ColumnsType<UserInfo> = [
		{
			title: t("sys.menu.system.user.name"),
			dataIndex: "name",
			width: 300,
			render: (_, record) => {
				return (
					<div className="flex">
						<img alt="" src={record.avatar} className="h-10 w-10 rounded-full" />
						<div className="ml-2 flex flex-col">
							<span className="text-sm">{record.username}</span>
							<span className="text-xs text-text-secondary">{record.email}</span>
						</div>
					</div>
				);
			},
		},
		{
			title: t("sys.menu.system.user.role"),
			dataIndex: "role",
			align: "center",
			width: 120,
			render: (role: Role) => <Tag color="cyan">{role.name}</Tag>,
		},
		{
			title: t("sys.menu.system.user.status.index"),
			dataIndex: "status",
			align: "center",
			width: 120,
			render: (status) => (
				<Tag color={status === BasicStatus.DISABLE ? "error" : "success"}>
					{status === BasicStatus.DISABLE
						? t("sys.menu.system.user.status.disable")
						: t("sys.menu.system.user.status.enable")}
				</Tag>
			),
		},
		{
			title: t("sys.menu.system.user.action"),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center text-gray-500">
					<IconButton
						onClick={() => {
							push(`${pathname}/${record.id}`);
						}}
					>
						<Iconify icon="mdi:card-account-details" size={18} />
					</IconButton>
					<IconButton onClick={() => {}}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title="Delete the User" okText="Yes" cancelText="No" placement="left">
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	return (
		<Card
			title={t("sys.menu.system.user.list")}
			extra={
				<Button type="primary" onClick={() => {}}>
					{t("sys.menu.system.user.create")}
				</Button>
			}
		>
			<Table
				rowKey="id"
				size="small"
				scroll={{ x: "max-content" }}
				pagination={false}
				columns={columns}
				dataSource={USERS}
			/>
		</Card>
	);
}
