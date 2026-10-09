import 'dotenv/config';
import { DataSource } from 'typeorm';

const port = Number(process.env.DB_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be an integer between 1 and 65535');
}

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  uuidExtension: 'pgcrypto',
  host: getRequiredEnv('DB_HOST'),
  port,
  username: getRequiredEnv('DB_USERNAME'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_DATABASE'),
  entities: [`${__dirname}/**/**/**/*.entity.{ts,js}`],
  migrations: [`${__dirname}/**/database/migrations/**/*{.ts,.js}`],
  synchronize: false,
});
