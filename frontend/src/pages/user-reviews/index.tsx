import type { JSX } from 'react';

import { ArrowLeftOutlined, StarFilled } from '@ant-design/icons';
import { Alert, Avatar, Card, Empty, Spin, Typography } from 'antd';
import { Link, useLocation, useParams } from 'react-router';

import { useGetUserReviewsQuery } from '@/app-store/api/users-api';
import { getProfile } from '@/app-store/reducers/user-slice';
import ReviewActions from '@/components/review-actions';
import { useAppSelector } from '@/hooks';
import { formatReviewTimestamp } from '@/utils/review-date';

import styles from './user-reviews.module.css';

const labels = {
  back: '\u041a \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f\u043c',
  signIn:
    '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0432 \u0441\u0438\u0441\u0442\u0435\u043c\u0443, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u043e\u0442\u0437\u044b\u0432\u044b.',
  loading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u043e\u0442\u0437\u044b\u0432\u043e\u0432\u2026',
  error:
    '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u043e\u0442\u0437\u044b\u0432\u044b \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f.',
  title:
    '\u041e\u0442\u0437\u044b\u0432\u044b \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f',
  empty:
    '\u042d\u0442\u043e\u0442 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c \u043f\u043e\u043a\u0430 \u043d\u0435 \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u043b \u043e\u0442\u0437\u044b\u0432\u043e\u0432',
  product: '\u041a \u0442\u043e\u0432\u0430\u0440\u0443',
  created: '\u0421\u043e\u0437\u0434\u0430\u043d',
  updated: '\u0418\u0437\u043c\u0435\u043d\u0451\u043d',
};

const UserReviewsPage = (): JSX.Element => {
  const { userId } = useParams();
  const location = useLocation();
  const accessToken = useAppSelector((state) => state.user.accessToken);
  const profile = useAppSelector(getProfile);
  const { data, error, isLoading, refetch } = useGetUserReviewsQuery(userId ?? '', {
    skip: !userId || !accessToken,
  });

  if (!accessToken) {
    return (
      <main className={styles.page}>
        <Alert type="info" showIcon message={labels.signIn} />
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.status} role="status">
        <Spin /> {labels.loading}
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className={styles.page}>
        <Alert type="error" showIcon message={labels.error} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <Link to="/users" className={styles.backLink}>
        <ArrowLeftOutlined /> {labels.back}
      </Link>
      <header className={styles.header}>
        <Avatar src={data.user.avatar ?? undefined} size={72}>
          {data.user.username.slice(0, 1).toUpperCase()}
        </Avatar>
        <div>
          <Typography.Title level={1}>{labels.title}</Typography.Title>
          <Typography.Title level={3} className={styles.username}>
            {data.user.username}
          </Typography.Title>
        </div>
      </header>
      {data.reviews.length ? (
        <ul className={styles.reviewList}>
          {data.reviews.map(({ productId, productTitle, productThumbnail, review }, index) => (
            <li key={`${productId}-${review.date}-${index}`}>
              <Card className={styles.reviewCard}>
                <div className={styles.productHeader}>
                  <img src={productThumbnail} alt="" loading="lazy" />
                  <div className={styles.productInfo}>
                    <Link to={{ pathname: `/products/${productId}/page`, search: location.search }}>
                      {productTitle}
                    </Link>
                    <Typography.Text type="secondary">
                      <time dateTime={review.updatedAt ?? review.date}>
                        {review.updatedAt ? labels.updated : labels.created}:{' '}
                        {formatReviewTimestamp(review.updatedAt ?? review.date)}
                      </time>
                    </Typography.Text>
                  </div>
                  <span className={styles.rating}>
                    <StarFilled aria-hidden="true" /> {review.rating.toFixed(1)} / 5
                  </span>
                  <ReviewActions
                    productId={productId}
                    review={review}
                    canEdit={profile?.id === data.user.id}
                    canDelete={
                      (profile?.id === data.user.id ||
                        profile?.roles.some((role) => role === 'admin' || role === 'moderator') === true) &&
                      (!data.user.roles.includes('admin') || profile?.roles.includes('admin') === true)
                    }
                    onChanged={() => {
                      void refetch();
                    }}
                  />
                </div>
                <Typography.Paragraph className={styles.comment}>{review.comment}</Typography.Paragraph>
                <Link
                  className={styles.productLink}
                  to={{ pathname: `/products/${productId}/page`, search: location.search }}
                >
                  {labels.product}
                </Link>
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

export default UserReviewsPage;
