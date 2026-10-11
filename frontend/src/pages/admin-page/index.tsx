import type { JSX } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Form, Input, Spin, Table, Typography } from 'antd';
import { useState } from 'react';

import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
  type CreateCategoryRequest,
  type ProductCategory,
} from '@/app-store/api/products-api';

import styles from './admin-page.module.css';

type CategoryFormValues = CreateCategoryRequest;

const copy = {
  title: 'Админка',
  intro: 'Управление категориями товаров',
  sectionTitle: 'Категории',
  sectionDescription: 'Добавляйте категории, чтобы их можно было выбрать при создании товара.',
  nameLabel: 'Отображаемое имя (на русском)',
  namePlaceholder: 'Например, Аксессуары для дома',
  nameRequired: 'Введите название категории',
  nameRussian: 'Введите название на русском языке',
  slugLabel: 'Slug (латиницей)',
  slugPlaceholder: 'Например, aksessuary-dlya-doma',
  slugRequired: 'Введите slug категории',
  slugFormat: 'Используйте строчные латинские буквы, цифры и дефисы',
  maxLength: 'Максимум 100 символов',
  add: 'Добавить категорию',
  adding: 'Добавляем...',
  empty: 'Пока категорий нет',
  loadingError: 'Не удалось загрузить категории. Попробуйте обновить страницу.',
  createError: 'Не удалось добавить категорию. Попробуйте ещё раз.',
  success: 'Категория добавлена',
};

const getApiErrorMessage = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('data' in error)) return null;

  const data = error.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return null;
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.message) && data.message.every((item) => typeof item === 'string')) {
    return data.message.join(' ');
  }

  return null;
};

const AdminPage = (): JSX.Element => {
  const [form] = Form.useForm<CategoryFormValues>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { data: categories = [], error: categoriesError, isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();

  const handleSubmit = async (values: CategoryFormValues): Promise<void> => {
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await createCategory({ slug: values.slug.trim(), name: values.name.trim() }).unwrap();
      form.resetFields();
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error) ?? copy.createError);
    }
  };

  const columns = [
    { title: copy.nameLabel, dataIndex: 'name', key: 'name' },
    { title: copy.slugLabel, dataIndex: 'slug', key: 'slug' },
  ];

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <Typography.Title level={2} className={styles.pageTitle}>
          {copy.title}
        </Typography.Title>
        <Typography.Paragraph className={styles.pageIntro}>{copy.intro}</Typography.Paragraph>
      </header>

      <section aria-labelledby="categories-heading" className={styles.section}>
        <Card className={styles.card}>
          <div className={styles.sectionHeader}>
            <div>
              <Typography.Title level={3} id="categories-heading" className={styles.sectionTitle}>
                {copy.sectionTitle}
              </Typography.Title>
              <Typography.Paragraph className={styles.sectionDescription}>
                {copy.sectionDescription}
              </Typography.Paragraph>
            </div>
          </div>

          <Form<CategoryFormValues>
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSubmit(values)}
            className={styles.form}
          >
            <Form.Item
              label={copy.nameLabel}
              name="name"
              rules={[
                { required: true, whitespace: true, message: copy.nameRequired },
                {
                  pattern:
                    /^(?=.*[\u0410-\u042f\u0451])[\u0410-\u042f\u0430-\u044f\u0401\u04510-9][\u0410-\u042f\u0430-\u044f\u0401\u04510-9 .,&()-]*$/u,
                  message: copy.nameRussian,
                },
                { max: 100, message: copy.maxLength },
              ]}
            >
              <Input maxLength={100} placeholder={copy.namePlaceholder} autoComplete="off" />
            </Form.Item>
            <Form.Item
              label={copy.slugLabel}
              name="slug"
              rules={[
                { required: true, whitespace: true, message: copy.slugRequired },
                { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: copy.slugFormat },
                { max: 100, message: copy.maxLength },
              ]}
            >
              <Input maxLength={100} placeholder={copy.slugPlaceholder} autoComplete="off" />
            </Form.Item>
            {submitError || submitSuccess ? (
              <div className={styles.feedback}>
                {submitError ? <Alert type="error" showIcon message={submitError} /> : null}
                {submitSuccess ? <Alert type="success" showIcon message={copy.success} /> : null}
              </div>
            ) : null}
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              loading={isCreating}
              disabled={isCreating}
            >
              {isCreating ? copy.adding : copy.add}
            </Button>
          </Form>
        </Card>
      </section>

      <section aria-label={copy.sectionTitle} className={styles.section}>
        <Card className={styles.card}>
          {categoriesError ? (
            <Alert type="error" showIcon message={copy.loadingError} />
          ) : isLoading ? (
            <div className={styles.loader} role="status">
              <Spin />
            </div>
          ) : categories.length === 0 ? (
            <Empty description={copy.empty} />
          ) : (
            <Table<ProductCategory>
              rowKey="slug"
              columns={columns}
              dataSource={categories}
              pagination={{ pageSize: 10, hideOnSinglePage: true }}
              scroll={{ x: true }}
            />
          )}
        </Card>
      </section>
    </main>
  );
};

export default AdminPage;
