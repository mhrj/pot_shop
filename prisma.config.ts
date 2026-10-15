import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import { defineConfig } from 'prisma/config';

loadEnvConfig(process.cwd());

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
});
