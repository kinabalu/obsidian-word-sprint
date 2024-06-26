import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';

const isProd = (process.env.BUILD === 'production');

const banner =
	`/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`;

export default {
	input: 'src/main.ts',
	output: {
		dir: '.',
		sourcemap: 'inline',
		sourcemapExcludeSources: isProd,
		format: 'cjs',
		exports: 'default',
		banner,
	},
	external: ['obsidian', 'React', 'ReactDOM'],
	plugins: [
		replace({
			'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
			preventAssignment: true, // Prevents assignment errors during transformation
		}),
		typescript(),
		nodeResolve({browser: true}),
		commonjs(),
	]
};
