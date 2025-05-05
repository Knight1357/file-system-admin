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
  onRename: (formValue: File, newName: string) => Promise<void>;
  onCreateFolder: (folderName: string) => Promise<void>;
};

export default function FolderModal({ 
  title, 
  show, 
  formValue, 
  fileStructure, 
  onOk, 
  onCancel,
  onRename,
  onCreateFolder
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
      
      if (formValue.id) {
        // 重命名文件夹
        await onRename(formValue, values.name);
      } else {
        // 创建新文件夹
        await onCreateFolder(values.name);
      }
      
      form.resetFields();
      onCancel();
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