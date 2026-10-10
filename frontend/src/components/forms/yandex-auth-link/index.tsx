import type { JSX } from 'react';

import styles from './yandex-auth-link.module.css';

const YandexAuthLink = (): JSX.Element => {
  const authApiUrl = (import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

  return (
    <div className={styles.container}>
      <span className={styles.separator}>или</span>
      <a className={styles.link} href={`${authApiUrl}/oauth/yandex`}>
        Продолжить с Яндексом
      </a>
    </div>
  );
};

export default YandexAuthLink;
