import { faker } from "@faker-js/faker";
import { Avatar, Col, Progress, Row, Space, Table, Tag, Timeline, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { fakeAvatars } from "@/_mock/utils";
import Card from "@/components/card";
import { IconButton, Iconify, SvgIcon } from "@/components/icon";
import Scrollbar from "@/components/scrollbar";
import { useUserInfo } from "@/store/userStore";
import { themeVars } from "@/theme/theme.css";

interface DataType {
	key: string;
	avatar: string;
	name: string;
	date: string;
	leader: string;
	team: string[];
	status: number;
}

export default function ProfileTab() {
	const { username } = useUserInfo();
	const AboutItems = [
		{
			icon: <Iconify icon="fa-solid:user" size={18} />,
			label: "姓名",
			val: username,
		},
		{
			icon: <Iconify icon="eos-icons:role-binding" size={18} />,
			label: "角色",
			val: "Developer",
		},
		{
			icon: <Iconify icon="tabler:location-filled" size={18} />,
			label: "国家",
			val: "USA",
		},
		{
			icon: <Iconify icon="ion:language" size={18} />,
			label: "语言",
			val: "English",
		},
		{
			icon: <Iconify icon="ph:phone-fill" size={18} />,
			label: "联系方式",
			val: "(123)456-7890",
		},
		{
			icon: <Iconify icon="ic:baseline-email" size={18} />,
			label: "邮箱",
			val: username,
		},
	];

	const ConnectionsItems = [
		{
			avatar: faker.image.avatarGitHub(),
			name: faker.person.fullName(),
			connections: `${faker.number.int(100)} Connections`,
			connected: faker.datatype.boolean(),
		},

		{
			avatar: faker.image.avatarGitHub(),
			name: faker.person.fullName(),
			connections: `${faker.number.int(100)} Connections`,
			connected: faker.datatype.boolean(),
		},

		{
			avatar: faker.image.avatarGitHub(),
			name: faker.person.fullName(),
			connections: `${faker.number.int(100)} Connections`,
			connected: faker.datatype.boolean(),
		},

		{
			avatar: faker.image.avatarGitHub(),
			name: faker.person.fullName(),
			connections: `${faker.number.int(100)} Connections`,
			connected: faker.datatype.boolean(),
		},

		{
			avatar: faker.image.avatarGitHub(),
			name: faker.person.fullName(),
			connections: `${faker.number.int(100)} Connections`,
			connected: faker.datatype.boolean(),
		},
	];

	const TeamItems = [
		{
			avatar: <Iconify icon="devicon:react" size={36} />,
			name: "React Developers",
			members: `${faker.number.int(100)} Members`,
			tag: <Tag color="warning">Developer</Tag>,
		},
		{
			avatar: <Iconify icon="devicon:figma" size={36} />,
			name: "UI Designer",
			members: `${faker.number.int(100)} Members`,
			tag: <Tag color="cyan">Designer</Tag>,
		},
		{
			avatar: <Iconify icon="logos:jest" size={36} />,
			name: "Test Team",
			members: `${faker.number.int(100)} Members`,
			tag: <Tag color="success">Test</Tag>,
		},
		{
			avatar: <Iconify icon="logos:nestjs" size={36} />,
			name: "Nest.js Developers",
			members: `${faker.number.int(100)} Members`,
			tag: <Tag color="warning">Developer</Tag>,
		},

		{
			avatar: <Iconify icon="logos:twitter" size={36} />,
			name: "Digital Marketing",
			members: `${faker.number.int(100)} Members`,
			tag: <Tag>Marketing</Tag>,
		},
	];

	const fakeProjectItems = () => {
		const arr: DataType[] = [];
		for (let i = 0; i <= 25; i += 1) {
			arr.push({
				key: faker.string.uuid(),
				avatar: faker.image.urlPicsumPhotos(),
				name: faker.company.buzzPhrase(),
				date: faker.date.past().toDateString(),
				leader: faker.person.fullName(),
				team: fakeAvatars(faker.number.int({ min: 2, max: 5 })),
				status: faker.number.int({ min: 50, max: 99 }),
			});
		}
		return arr;
	};

	const ProjectColumns: ColumnsType<DataType> = [
		{
			title: "NAME",
			dataIndex: "name",
			render: (_, record) => (
				<div className="flex items-center">
					<img src={record.avatar} alt="" className="h-8 w-8 rounded-full" />
					<div className="ml-2 flex flex-col">
						<span className="font-semibold">{record.name}</span>
						<span className="text-xs opacity-50">{record.date}</span>
					</div>
				</div>
			),
		},
		{
			title: "LEADER",
			dataIndex: "leader",
			render: (val) => <span className="opacity-50">{val}</span>,
		},
		{
			title: "TEAM",
			dataIndex: "team",
			render: (val: string[]) => (
				<Avatar.Group>
					{val.map((item) => (
						<Avatar src={item} key={item} />
					))}
				</Avatar.Group>
			),
		},
		{
			title: "STATUS",
			dataIndex: "status",
			render: (val) => (
				<Progress percent={val} strokeColor={themeVars.colors.palette.primary.default} trailColor="transparent" />
			),
		},
		{
			title: "ACTIONS",
			dataIndex: "action",
			render: () => (
				<Space size="middle">
					<IconButton>
						<Iconify icon="fontisto:more-v-a" />
					</IconButton>
				</Space>
			),
		},
	];

	return (
		<>
			<Row gutter={[16, 16]}>
				<Col span={24} >
					<Card className="flex-col">
						<div className="flex w-full flex-col">
							<Typography.Title level={5}>用户信息</Typography.Title>
							<Typography.Text>{faker.lorem.paragraph()}</Typography.Text>

							<div className="mt-2 flex flex-col gap-4">
								{AboutItems.map((item) => (
									<div className="flex" key={item.label}>
										<div className="mr-2">{item.icon}</div>
										<div className="mr-2">{item.label}:</div>
										<div className="opacity-50">{item.val}</div>
									</div>
								))}
							</div>
						</div>
					</Card>
				</Col>
			</Row>
		</>
	);
}
