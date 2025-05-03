import { Button, Col, Row, Switch, Typography } from "antd";

import Card from "@/components/card";
import { toast } from "sonner";

export default function NotificationsTab() {
	const handleClick = () => {
		toast.success("保存成功!");
	};
	return (
		<Card className="!h-auto flex-col">
			<Row gutter={[16, 16]}>
				<Col span={24} lg={8}>
					<Typography.Title level={4}>活动</Typography.Title>
					<Typography.Text className="opacity-70 !text-text-secondary">
						Donec mi odio, faucibus at, scelerisque quis
					</Typography.Text>
				</Col>
				<Col span={24} lg={16}>
					<div className="flex w-full flex-col gap-4 rounded-lg px-6 py-8 bg-bg-neutral">
						<div className="flex w-full justify-between">
							<div>当有人回复我的表单时给我发邮件</div>
							<Switch defaultChecked />
						</div>
						<div className="flex w-full justify-between">
							<div>当有人评论我的文章时给我发邮件</div>
							<Switch />
						</div>
						<div className="flex w-full justify-between">
							<div>当有人关注我时给我发邮件</div>
							<Switch defaultChecked />
						</div>
					</div>
				</Col>

				<Col span={24} lg={8}>
					<Typography.Title level={4}>应用程序</Typography.Title>
					<Typography.Text className="opacity-70 !text-text-secondary">
						Donec mi odio, faucibus at, scelerisque quis
					</Typography.Text>
				</Col>
				<Col span={24} lg={16}>
					<div className="flex w-full flex-col gap-4 rounded-lg px-6 py-8 bg-bg-neutral">
						<div className="flex w-full justify-between">
							<div>新闻与公告</div>
							<Switch />
						</div>
						<div className="flex w-full justify-between">
							<div>每周产品更新</div>
							<Switch defaultChecked />
						</div>
						<div className="flex w-full justify-between">
							<div>每周博客摘要</div>
							<Switch />
						</div>
					</div>
				</Col>

				<div className="flex w-full justify-end">
					<Button type="primary" onClick={handleClick}>
						Save Changes
					</Button>
				</div>
			</Row>
		</Card>
	);
}
