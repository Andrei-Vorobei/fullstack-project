import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Alert, Button, Dropdown, Form, Input, Modal, Rate } from 'antd';
import { useState, type JSX } from 'react';

import type { ProductReview } from '@/app-store/api/products-api';

import { useDeleteReviewMutation, useUpdateReviewMutation } from '@/app-store/api/products-api';

import styles from './review-actions.module.css';

type ReviewActionsProps = {
  productId: string;
  review: Pick<ProductReview, 'id' | 'rating' | 'comment'>;
  canEdit: boolean;
  canDelete: boolean;
  onChanged?: () => void;
};

type ReviewFormValues = Pick<ProductReview, 'rating' | 'comment'>;

const labels = {
  actions: '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f',
  edit: '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c',
  delete: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
  editTitle:
    '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435 \u043e\u0442\u0437\u044b\u0432\u0430',
  deleteTitle: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432?',
  rating: '\u041e\u0446\u0435\u043d\u043a\u0430',
  comment: '\u041e\u0442\u0437\u044b\u0432',
  confirmDelete:
    '\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043d\u0435\u043b\u044c\u0437\u044f \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c.',
  save: '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c',
  cancel: '\u041e\u0442\u043c\u0435\u043d\u0430',
  required: '\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u043f\u043e\u043b\u0435',
  error:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.',
};

const ReviewActions = ({
  productId,
  review,
  canEdit,
  canDelete,
  onChanged,
}: ReviewActionsProps): JSX.Element | null => {
  const [mode, setMode] = useState<'edit' | 'delete' | null>(null);
  const [failed, setFailed] = useState(false);
  const [form] = Form.useForm<ReviewFormValues>();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  if (!canEdit && !canDelete) return null;

  const open = (nextMode: 'edit' | 'delete'): void => {
    setFailed(false);
    setMode(nextMode);
    if (nextMode === 'edit') form.setFieldsValue({ rating: review.rating, comment: review.comment });
  };

  const close = (): void => setMode(null);

  const handleSave = async (values: ReviewFormValues): Promise<void> => {
    try {
      await updateReview({ productId, reviewId: review.id, ...values }).unwrap();
      close();
      onChanged?.();
    } catch {
      setFailed(true);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteReview({ productId, reviewId: review.id }).unwrap();
      close();
      onChanged?.();
    } catch {
      setFailed(true);
    }
  };

  return (
    <>
      <div className={styles.actions}>
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', icon: <EditOutlined />, label: labels.edit, disabled: !canEdit },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: labels.delete,
                danger: true,
                disabled: !canDelete,
              },
            ],
            onClick: ({ key }) => open(key === 'edit' ? 'edit' : 'delete'),
          }}
        >
          <Button
            className={styles.menuButton}
            type="text"
            aria-label={labels.actions}
            icon={
              <span className={styles.verticalDots} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            }
            onClick={(event) => event.preventDefault()}
          />
        </Dropdown>
      </div>
      <Modal
        open={mode !== null}
        title={mode === 'edit' ? labels.editTitle : labels.deleteTitle}
        okText={mode === 'edit' ? labels.save : labels.delete}
        cancelText={labels.cancel}
        confirmLoading={isUpdating || isDeleting}
        okButtonProps={{ danger: mode === 'delete' }}
        onOk={() => (mode === 'edit' ? form.submit() : void handleDelete())}
        onCancel={close}
        destroyOnHidden
      >
        {mode === 'edit' ? (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ rating: review.rating, comment: review.comment }}
            onFinish={(values) => {
              void handleSave(values);
            }}
          >
            <Form.Item name="rating" label={labels.rating} rules={[{ required: true, message: labels.required }]}>
              <Rate />
            </Form.Item>
            <Form.Item
              name="comment"
              label={labels.comment}
              rules={[
                { required: true, whitespace: true, message: labels.required },
                { max: 5000, message: labels.required },
              ]}
            >
              <Input.TextArea rows={4} maxLength={5000} showCount />
            </Form.Item>
          </Form>
        ) : (
          <p>{labels.confirmDelete}</p>
        )}
        {failed && <Alert className={styles.error} type="error" showIcon message={labels.error} />}
      </Modal>
    </>
  );
};

export default ReviewActions;
