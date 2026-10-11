import { ArrowLeftOutlined, StarFilled } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Form, Input, Rate, Spin, Typography } from 'antd';
import { useState, type JSX } from 'react';
import { Link, useLocation, useParams } from 'react-router';

import type { ProductReview } from '@/app-store/api/products-api';

import { useCreateReviewMutation, useGetProductByIdQuery } from '@/app-store/api/products-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import ReviewActions from '@/components/review-actions';
import { useAppSelector } from '@/hooks';
import { formatReviewTimestamp } from '@/utils/review-date';

import styles from './product-reviews.module.css';

type ReviewFormValues = Pick<ProductReview, 'rating' | 'comment'>;

const labels = {
  back: '\u041a \u0442\u043e\u0432\u0430\u0440\u0443',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u0442\u0437\u044b\u0432\u043e\u0432\u2026',
  error:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0442\u043e\u0432\u0430\u0440 \u0438 \u0435\u0433\u043e \u043e\u0442\u0437\u044b\u0432\u044b.',
  title: '\u041e\u0442\u0437\u044b\u0432\u044b \u043e \u0442\u043e\u0432\u0430\u0440\u0435',
  empty: '\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043e\u0442\u0437\u044b\u0432\u043e\u0432',
  addReview: '\u041e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432',
  rating: '\u041e\u0446\u0435\u043d\u043a\u0430',
  comment: '\u0412\u0430\u0448 \u043e\u0442\u0437\u044b\u0432',
  commentPlaceholder:
    '\u0420\u0430\u0441\u043a\u0430\u0436\u0438\u0442\u0435 \u043e \u0432\u0430\u0448\u0435\u043c \u043e\u043f\u044b\u0442\u0435 \u043f\u043e\u043a\u0443\u043f\u043a\u0438',
  submit: '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432',
  loginPrompt:
    '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e\u0431\u044b \u043e\u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432.',
  signIn: '\u0412\u043e\u0439\u0442\u0438',
  requiredRating:
    '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0446\u0435\u043d\u043a\u0443 \u043e\u0442 1 \u0434\u043e 5.',
  requiredComment: '\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043e\u0442\u0437\u044b\u0432.',
  submitError:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.',
  submitted:
    '\u0421\u043f\u0430\u0441\u0438\u0431\u043e! \u0412\u0430\u0448 \u043e\u0442\u0437\u044b\u0432 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d.',
  reviewCount: '\u043e\u0442\u0437\u044b\u0432\u043e\u0432',
  created: '\u0421\u043e\u0437\u0434\u0430\u043d',
  updated: '\u0418\u0437\u043c\u0435\u043d\u0451\u043d',
};

const ProductReviewsPage = (): JSX.Element => {
  const { productId } = useParams();
  const location = useLocation();
  const profile = useAppSelector(getProfile);
  const [form] = Form.useForm<ReviewFormValues>();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const { data: product, error, isLoading } = useGetProductByIdQuery(productId ?? '', { skip: !productId });
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();

  const handleSubmit = async ({ rating, comment }: ReviewFormValues): Promise<void> => {
    if (!productId) return;
    setSubmitError(false);
    setSubmitted(false);
    try {
      await createReview({ productId, rating, comment }).unwrap();
      form.resetFields();
      setSubmitted(true);
    } catch {
      setSubmitError(true);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.status} role="status">
        <Spin /> {labels.loading}
      </div>
    );
  }

  if (error || !product) {
    return (
      <main className={styles.page}>
        <Alert type="error" showIcon message={labels.error} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link to={{ pathname: `/products/${product.id}/page`, search: location.search }} className={styles.backLink}>
        <ArrowLeftOutlined /> {labels.back}
      </Link>
      <header className={styles.header}>
        <div>
          <Typography.Title level={1}>{labels.title}</Typography.Title>
          <Typography.Title level={3} className={styles.productTitle}>
            {product.title}
          </Typography.Title>
        </div>
        <div className={styles.ratingSummary} aria-label={`${product.rating.toFixed(1)} / 5`}>
          <StarFilled aria-hidden="true" />
          <strong>{product.rating.toFixed(1)}</strong>
          <span>
            / 5 · {product.reviews.length} {labels.reviewCount}
          </span>
        </div>
      </header>
      {profile ? (
        <Card className={styles.reviewForm} title={labels.addReview}>
          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              void handleSubmit(values);
            }}
          >
            <Form.Item
              name="rating"
              label={labels.rating}
              rules={[{ required: true, message: labels.requiredRating }]}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              name="comment"
              label={labels.comment}
              rules={[
                { required: true, whitespace: true, message: labels.requiredComment },
                { max: 5000, message: labels.requiredComment },
              ]}
            >
              <Input.TextArea rows={4} maxLength={5000} showCount placeholder={labels.commentPlaceholder} />
            </Form.Item>
            {submitError && (
              <Alert className={styles.formAlert} type="error" showIcon message={labels.submitError} />
            )}
            {submitted && (
              <Alert className={styles.formAlert} type="success" showIcon message={labels.submitted} />
            )}
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {labels.submit}
            </Button>
          </Form>
        </Card>
      ) : (
        <Card className={styles.reviewForm}>
          {labels.loginPrompt} <Link to="/login">{labels.signIn}</Link>
        </Card>
      )}
      {product.reviews.length ? (
        <ul className={styles.reviewList}>
          {product.reviews.map((review) => (
            <li key={review.id}>
              <Card className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <Typography.Text strong>{review.reviewerName}</Typography.Text>
                  <div className={styles.reviewActions}>
                    <Typography.Text className={styles.reviewRating}>
                      <StarFilled aria-hidden="true" /> {review.rating.toFixed(1)} / 5
                    </Typography.Text>
                    <ReviewActions
                      productId={product.id}
                      review={review}
                      canEdit={profile?.id === review.userId}
                      canDelete={
                        (profile?.id === review.userId ||
                          profile?.roles.some((role) => role === 'admin' || role === 'moderator') === true) &&
                        (!review.authorIsAdmin || profile?.roles.includes('admin') === true)
                      }
                    />
                  </div>
                </div>
                <Typography.Paragraph className={styles.comment}>{review.comment}</Typography.Paragraph>
                <Typography.Text type="secondary">
                  <time dateTime={review.updatedAt ?? review.date}>
                    {review.updatedAt ? labels.updated : labels.created}:{' '}
                    {formatReviewTimestamp(review.updatedAt ?? review.date)}
                  </time>
                </Typography.Text>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Empty description={labels.empty} />
      )}
    </main>
  );
};

export default ProductReviewsPage;
