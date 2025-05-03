import { faker } from "@faker-js/faker";
import { Button, Col, Form, Input, Row, Space, Switch } from "antd";

import Card from "@/components/card";
import { UploadAvatar } from "@/components/upload";
import { useUserInfo } from "@/store/userStore";
import { toast } from "sonner";

type FieldType = {
	name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	code?: string;
	about: string;
};
export default function GeneralTab() {
	const { avatar, username, email } = useUserInfo();
	const initFormValues = {
		name: username,
		email,
		phone: faker.phone.number(),
		address: faker.location.county(),
		city: faker.location.city(),
		code: faker.location.zipCode(),
		about: faker.lorem.paragraphs(),
	};
	const handleClick = () => {
		toast.success("更新成功!");
	};
	return (
		<Row gutter={[16, 16]}>
			<Col span={24} lg={8}>
				<Card className="flex-col !px-6 !pb-10 !pt-20">
					<UploadAvatar defaultAvatar={avatar} />

					<Space className="py-6">
						<div>公开信息</div>
						<Switch size="small" />
					</Space>

					<Button type="primary" danger>
						删除用户
					</Button>
				</Card>
			</Col>
			<Col span={24} lg={16}>
				<Card>
					<Form
						layout="vertical"
						initialValues={initFormValues}
						labelCol={{ span: 8 }}
						className="w-full"
					>
						<Row gutter={16}>
							<Col span={12}>
								<Form.Item<FieldType> label="用户名" name="name">
									<Input />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item<FieldType> label="邮箱" name="email">
									<Input />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={12}>
								<Form.Item<FieldType> label="电话号码" name="phone">
									<Input />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item<FieldType> label="地址" name="address">
									<Input />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={12}>
								<Form.Item<FieldType> label="城市" name="city">
									<Input />
								</Form.Item>
							</Col>
							<Col span={12}>
								<Form.Item<FieldType> label="邮编" name="code">
									<Input />
								</Form.Item>
							</Col>
						</Row>

						<Form.Item<FieldType> label="个人简介" name="about">
							<Input.TextArea />
						</Form.Item>

						<div className="flex w-full justify-end">
							<Button type="primary" onClick={handleClick}>
								保存变更
							</Button>
						</div>
					</Form>
				</Card>
			</Col>
		</Row>
	);
}
