import type { JSX } from 'react';

import { GithubOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router';

import styles from './home-page.module.css';

const HomePage = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <section className={styles.hero} aria-labelledby="welcome-title">
        <p className={styles.eyebrow}>Проект · Портфолио</p>
        <h2 className={styles.title} id="welcome-title">
          Привет, гость!
        </h2>
        <p className={styles.intro}>
          Рад видеть тебя в моём проекте-портфолио. Это fullstack-приложение интернет-магазина, в котором я собрал
          frontend, backend и работу с базой данных в одном проекте.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} to="/products">
            Смотреть каталог
          </Link>
          <a className={styles.secondaryLink} href="#about">
            О проекте
          </a>
        </div>
      </section>

      <section className={styles.details} id="about" aria-labelledby="about-title">
        <div className={styles.description}>
          <p className={styles.eyebrow}>О проекте</p>
          <h2 className={styles.sectionTitle} id="about-title">
            Магазин, чтобы показать fullstack-разработку на практике
          </h2>
          <p className={styles.body}>
            В приложении есть каталог товаров с фильтрами, категории, профиль пользователя и корзина. Гостевая
            корзина сохраняется в браузере, а после входа переносится на сервер.
          </p>
          <p className={styles.body}>
            Интерфейс построен на React и TypeScript. Backend реализован на Node.js с NestJS, а данные хранятся в
            PostgreSQL.
          </p>
        </div>

        <aside className={styles.stackCard} aria-labelledby="stack-title">
          <h2 className={styles.stackTitle} id="stack-title">
            Технологии
          </h2>
          <ul className={styles.stackList}>
            <li>React · TypeScript</li>
            <li>Redux Toolkit · RTK Query</li>
            <li>Node.js · NestJS</li>
            <li>PostgreSQL · TypeORM</li>
          </ul>
        </aside>
      </section>

      <section className={styles.contact} aria-labelledby="contact-title">
        <div>
          <p className={styles.eyebrow}>Контакты</p>
          <h2 className={styles.contactTitle} id="contact-title">
            Давай познакомимся
          </h2>
          <p className={styles.contactText}>Контактные данные пока демонстрационные — заменю их на актуальные.</p>
        </div>
        <div className={styles.contactLinks}>
          <a className={styles.contactLink} href="mailto:your.email@example.com">
            <MailOutlined aria-hidden="true" />
            your.email@example.com
          </a>
          <a
            className={styles.contactLink}
            href="https://github.com/your-username"
            target="_blank"
            rel="noreferrer"
          >
            <GithubOutlined aria-hidden="true" />
            github.com/your-username
          </a>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
