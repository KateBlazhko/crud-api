import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';
import * as dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: './src/index.ts',
  devtool: 'source-map',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  target: 'node',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module',
    },
    chunkLoading: 'import',
    chunkFormat: 'module',
  },
  experiments: {
    outputModule: true,
  },
};
