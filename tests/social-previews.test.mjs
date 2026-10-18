import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('all public editions carry current social previews and real image assets',()=>{execFileSync(process.execPath,['scripts/social-previews.mjs','--check'],{stdio:'pipe'});});
