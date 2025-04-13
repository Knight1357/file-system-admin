import { Button, Card, Popconfirm, Tag } from "antd";
import Table, { type ColumnsType } from "antd/es/table";
import { useState } from "react";

import { USER_LIST } from "@/_mock/assets";
import { ROLE_LIST } from "@/_mock/assets";
import { IconButton, Iconify } from "@/components/icon";
import { usePathname, useRouter } from "@/router/hooks";

import { UserModal, type UserModalProps } from "./user-modal";

import type { Role, UserInfo } from "#/entity";
import { BasicStatus } from "#/enum";

import { useTranslation } from "react-i18next";
import { faker } from "@faker-js/faker";
// import { v4 as uuidv4 } from 'uuid';

const USERS: UserInfo[] = USER_LIST as UserInfo[];

const DEFAULT_USER_VALUE: UserInfo = {
	id: "",
	username: "",
	email: "",
	avatar: faker.image.avatarGitHub(),
	password: "",
	role: ROLE_LIST[0],
	permissions: ROLE_LIST[0].permission,
};

export default function UserPage() {
	const { t } = useTranslation();
	const { push } = useRouter();
	const pathname = usePathname();
	const [users, setUsers] = useState<UserInfo[]>(USERS);

	const [userModalProps, setUserModalProps] = useState<UserModalProps>({
		formValue: { ...DEFAULT_USER_VALUE },
		title: t("sys.menu.system.user.create"),
		show: false,
		onOk: (values) => {
			if (values.id) {
				// 编辑用户
				setUsers((prev) => prev.map((u) => (u.id === values.id ? values : u)));
			} else {
				// 创建用户（生成模拟ID）
				setUsers((prev) => [...prev, { ...values, id: Date.now().toString() }]);
			}
			setUserModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setUserModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const columns: ColumnsType<UserInfo> = [
		{
			title: t("sys.menu.system.user.name"),
			dataIndex: "name",
			width: 300,
			render: (_, record) => (
				<div className="flex">
					<img alt="" src={record.avatar} className="h-10 w-10 rounded-full" />
					<div className="ml-2 flex flex-col">
						<span className="text-sm">{record.username}</span>
						<span className="text-xs text-text-secondary">{record.email}</span>
					</div>
				</div>
			),
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
					<IconButton onClick={() => push(`${pathname}/${record.id}`)}>
						<Iconify icon="mdi:card-account-details" size={18} />
					</IconButton>
					<IconButton onClick={() => onEdit(record)}>
						<Iconify icon="solar:pen-bold-duotone" size={18} />
					</IconButton>
					<Popconfirm title={t("sys.menu.system.user.deleteConfirm")} onConfirm={() => handleDelete(record.id)}>
						<IconButton>
							<Iconify icon="mingcute:delete-2-fill" size={18} className="text-error" />
						</IconButton>
					</Popconfirm>
				</div>
			),
		},
	];

	const onCreate = () => {
		setUserModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.system.user.create"),
			formValue: { ...DEFAULT_USER_VALUE },
		}));
	};

	const onEdit = (formValue: UserInfo) => {
		setUserModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.menu.system.user.edit"),
			formValue: { ...formValue },
		}));
	};

	const handleDelete = (userId: string) => {
		setUsers((prev) => prev.filter((user) => user.id !== userId));
	};

	return (
		<Card
			title={t("sys.menu.system.user.list")}
			extra={
				<Button type="primary" onClick={onCreate}>
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
				dataSource={users}
			/>

			<UserModal {...userModalProps} />
		</Card>
	);
}
