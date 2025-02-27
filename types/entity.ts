import type { BasicStatus, FileType, PermissionType } from "./enum";

export interface UserToken {
	accessToken?: string;
	refreshToken?: string;
}

export interface UserInfo {
	id: string;
	email: string;
	username: string;
	password?: string;
	avatar?: string;
	role?: Role;
	status?: BasicStatus;
	permissions?: Permission[];
	files?: File[];
}

export interface Organization {
	id: string;
	name: string;
	status: "enable" | "disable";
	desc?: string;
	order?: number;
	children?: Organization[];
}

export interface Permission {
	id: string;
	parentId: string;
	name: string;
	label: string;
	type: PermissionType;
	route: string;
	status?: BasicStatus;
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Permission[];
}

export interface Role {
	id: string;
	name: string;
	label: string;
	status: BasicStatus;
	order?: number;
	desc?: string;
	permission?: Permission[];
}

export interface File {
	// 文件或文件夹的唯一标识符
	id: string;
	// 所属的父文件夹 ID，如果是根文件夹则为 undefined
	parentId: string;
	// 文件或文件夹的名称
	name: string;
	label: string;
	// 文件或文件夹的类型，使用 FileType 枚举区分
	type: FileType;
	// 文件或文件夹的状态，使用 BasicStatus 枚举
	status: BasicStatus;
	// 文件或文件夹的创建时间
	createTime: Date;
	// 文件或文件夹的修改时间
	modifyTime: Date;
	// 访问该文件或文件夹所需的权限列表
	// permissions: Permission[];
	// 如果是文件夹，可能包含的子文件和子文件夹
	children?: File[];
	// 如果是文件，文件的大小（单位：字节）
	size?: number;
	// 如果是文件，文件的内容（简单用字符串表示，实际可能需根据类型处理）
	content?: string;
}
