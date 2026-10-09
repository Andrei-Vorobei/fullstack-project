import type { JSX } from 'react';

import { Link } from 'react-router';

import styles from './not-found-page.module.css';

const NotFoundPage = (): JSX.Element => {
  return (
    <section className={styles.container} aria-labelledby="not-found-title">
      <p className={styles.code}>404</p>
      <h1 className={styles.title} id="not-found-title">
        Страница не найдена
      </h1>
      <p className={styles.description}>Возможно, адрес неверен или страница была перемещена.</p>
      <Link className={styles.homeLink} to="/">
        Вернуться на главную
      </Link>
    </section>
  );
};

export default NotFoundPage;
