'use strict';
if(typeof global.gc!=='function')throw Error('Use npm run test:game or node --expose-gc --max-old-space-size=512 scripts/test-game.cjs');
process.env.LS_TEST_GC='1';
require('../tests/game.test.cjs');
