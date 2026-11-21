import test from 'node:test';
import assert from 'node:assert/strict';
import {MODULES, parseWorkspaceHash, renderWorkspaceHome} from '../apps/personal-os-v1/workspaces.mjs';

test('B2C Commerce is a consolidated venture, not a fifth top-level workspace',()=>{
  assert.deepEqual(Object.keys(MODULES),['personal','servicebio','ventures','enexia']);
  assert.match(MODULES.ventures.sections,/B2C Commerce/);
  assert.match(MODULES.ventures.description,/Better Living và Wellness Foods/);
  assert.equal(parseWorkspaceHash('#ventures').module,'ventures');
  const html=renderWorkspaceHome({escape:String});
  assert.equal((html.match(/class="ui-card platform-space platform-space--/g)||[]).length,4);
  assert.match(html,/B2C Commerce/);
  assert.doesNotMatch(html,/data-workspace="wellness"/);
});
