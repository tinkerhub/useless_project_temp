import {mkdir, cp, copyFile, writeFile, rm, readFile} from 'node:fs/promises';
// Only publish this allowlist. Never ship data/, .env, tests, or the old shared API.
await rm('dist', {recursive:true, force:true});
await mkdir('dist/engine', {recursive:true});
await cp('web', 'dist', {recursive:true});
await copyFile('index.html', 'dist/index.html');
for (const name of ['world','town','spatial','population','institutions','ai_reasoning','fast_brain']) {
  await copyFile(`${name}.py`, `dist/engine/${name}.py`);
}
await copyFile('web/browser_bridge.py', 'dist/engine/browser_bridge.py');
await rm('dist/browser_bridge.py');
await mkdir('dist/vendor/pyodide', {recursive:true});
for (const name of ['pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']) {
  await copyFile(`node_modules/pyodide/${name}`, `dist/vendor/pyodide/${name}`);
}
await writeFile('dist/runtime-mode.js', 'export const hosted = true;\n');
console.log('Built private browser worlds in dist/');

// Build the landing scene from the actual town map.
const {loadPyodide} = await import('pyodide');
const py = await loadPyodide();
py.FS.writeFile('/town.py', await readFile('town.py', 'utf8'));
await writeFile('dist/town-preview.json', py.runPython("import sys, json; sys.path.insert(0, '/'); from town import TOWN; json.dumps(TOWN)"));
