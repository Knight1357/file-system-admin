// folder-modal.tsx
import { Form, Input, Modal, Radio } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { File } from "#/entity";
import { BasicStatus, FileType } from "#/enum";

export type FolderModalProps = {
  formValue: File;
  title: string;
  show: boolean;
  fileStructure: File[];
  onOk: (values: File) => void;
  onCancel: VoidFunction;
};

export default function FolderModal({ 
  title, 
  show, 
  formValue, 
  fileStructure, 
  onOk, 
  onCancel 
}: FolderModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      ...formValue,
      // 固定类型为文件夹
      type: FileType.FOLDER,
      // 新建时设置默认状态
      ...(formValue.id ? {} : { status: BasicStatus.ENABLE })
    });
  }, [formValue, show, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const folderData: File = {
        ...formValue,
        ...values,
        type: FileType.FOLDER, // 强制类型为文件夹
        size: 0, // 文件夹大小固定为0
        modifyTime: new Date(),
        createTime: formValue.id ? formValue.createTime : new Date(),
      };
      
      onOk(folderData);
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
      forceRender
    >
      <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item<File>
          label={t("sys.menu.file.name")}
          name="name"
          rules={[{ required: true, message: t("sys.menu.file.nameRequired") }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<File> 
          label={t("sys.menu.file.status.index")}
          name="status"
          rules={[{ required: true }]}
        >
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio value={BasicStatus.ENABLE}>{t("sys.menu.file.status.enable")}</Radio>
            <Radio value={BasicStatus.DISABLE}>{t("sys.menu.file.status.disable")}</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}