import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalWeeks, dailyEvidence, uniqueItems, weekRange} from '../apps/personal-os-v1/model.mjs';
import {createCalendar, fallbackTasks, monday} from '../apps/personal-os-v1/calendar.mjs';
import {parseWorkspaceHash} from '../apps/personal-os-v1/workspaces.mjs';

const weekStart = '2026-11-16';
const weekEnd = '2026-11-22';
const evidenceDate = '2026-11-19';
const page = (id, items = [], overrides = {}) => ({
  owner_id: 'fixture-owner',
  page_id: id,
  week_start: weekStart,
  week_end: weekEnd,
  synced_at: '2026-11-19T02:00:00Z',
  coverage: 'complete',
  source_url: 'https://example.invalid/fixture-week',
  items,
  ...overrides,
});

test('P0.1: page revisions respect source edit time and conflicting weeks stay unresolved', () => {
  const old = page('planner-a', [], {
    source_edited_at: '2026-11-17T02:00:00Z',
    synced_at: '2026-11-20T02:00:00Z',
  });
  const fresh = page('planner-a', [], {source_edited_at: '2026-11-18T02:00:00Z'});
  const otherOwner = page('planner-a', [], {owner_id: 'another-fixture-owner'});
  const historical = page('older-planner', [], {week_start: '2026-11-09', week_end: '2026-11-15'});
  const historicalRefresh = {...historical, synced_at: '2026-11-21T02:00:00Z'};
  assert.deepEqual(canonicalWeeks([historical, fresh, old, historicalRefresh, otherOwner]), [
    fresh, otherOwner, historicalRefresh,
  ]);
  const conflict = page('planner-b', [], {coverage: 'conflict'});
  assert.deepEqual(canonicalWeeks([fresh, page('planner-b')]), []);
  assert.deepEqual(canonicalWeeks([fresh, conflict]), []);
  assert.deepEqual(canonicalWeeks([conflict]), []);
});

test('P0.1: source identity deduplicates same-day revisions and retains distinct dates and IDs', () => {
  const item = (sourceId, date, key, updatedAt) => ({
    source_id: sourceId, key, updated_at: updatedAt,
    kind: 'activity', text: 'Synthetic observation', status: 'reported_done', occurred_on: date,
  });
  const first = '2026-11-17';
  const second = '2026-11-18';
  const w = page('planner-a', [
    item('repeat', first, 'old-key', '2026-11-17T02:00:00Z'),
    item('repeat', first, 'new-key', '2026-11-17T03:00:00Z'),
    item('repeat', second, 'old-key', '2026-11-18T02:00:00Z'),
    item('distinct', first, 'old-key', '2026-11-17T02:00:00Z'),
  ]);
  const records = uniqueItems([w]);
  assert.deepEqual(records.map(i => [i.source_id, i.occurred_on, i.key, i.page_id]), [
    ['repeat', first, 'new-key', 'planner-a'],
    ['repeat', second, 'old-key', 'planner-a'],
    ['distinct', first, 'old-key', 'planner-a'],
  ]);
  assert.deepEqual(dailyEvidence([w], first).map(i => i.key), ['new-key', 'old-key']);
  assert.deepEqual(dailyEvidence([w], second).map(i => i.source_id), ['repeat']);
});

test('P0.1: daily evidence excludes plans, undated items and weekly context independently', () => {
  const observation = {kind: 'activity', status: 'reported_done', text: 'Synthetic observation', occurred_on: evidenceDate};
  const w = page('planner-a', [
    {...observation, key: 'weekly', scope: 'weekly'},
    {...observation, key: 'plan', status: 'plan'},
    {...observation, key: 'undated', occurred_on: undefined},
    {...observation, key: 'scheduled-only', occurred_on: undefined, planned_on: evidenceDate},
    {...observation, key: 'logged'},
    {...observation, key: 'flagged-summary', is_summary: true},
    ...['summary', 'must_win', 'risk', 'stop'].map(kind => ({...observation, key: kind, kind})),
  ]);
  assert.deepEqual(dailyEvidence([w], evidenceDate).map(i => [i.key, i.status]), [
    ['logged', 'reported_done'],
  ]);
});

test('P0.1: the Calendar renders its cached task status independently of the Notion snapshot', async () => {
  const start = monday();
  const notion = page('current-planner', [
    {source_id: 'task-1', kind: 'activity', text: 'Weekly report', status: 'reported_done', occurred_on: start},
  ], {week_start: start, week_end: weekRange(start).end});
  const cache = {
    week_start: start,
    sources: ['earlier-planner'],
    tasks: [{id: 'task-1', title: 'Cached task', date: start, group: 'Personal', status: 'plan'}],
  };
  const reads = [];
  const response = new Map([
    ['personal_os_calendar_weeks', [cache]],
    ['personal_os_calendar_edits', []],
  ]);
  const db = {
    from(table) {
      return {
        select() { return this; },
        eq(column, value) { reads.push([table, column, value]); return this; },
        order() { return this; },
        async limit() { return {data: response.get(table)}; },
      };
    },
    rpc() { assert.fail('Calendar mount must not submit an edit request'); },
  };
  const container = {isConnected: true, innerHTML: '', querySelector() { return null; }};
  const calendar = createCalendar({db, getUser: () => ({id: notion.owner_id}), getWeeks: () => [notion], container});
  await calendar.mount();
  assert.deepEqual(reads, [
    ['personal_os_calendar_weeks', 'owner_id', notion.owner_id],
    ['personal_os_calendar_edits', 'owner_id', notion.owner_id],
  ]);
  assert.match(container.innerHTML, /data-cal-task="task-1"[^>]*>\s*<strong>Cached task<\/strong>\s*<span class="status status-plan">/);
  assert.doesNotMatch(container.innerHTML, /Weekly report|status-reported_done/);
  assert.deepEqual(dailyEvidence([notion], start).map(i => [i.page_id, i.source_id, i.status]), [
    ['current-planner', 'task-1', 'reported_done'],
  ]);
});

test('P0.1: Calendar fallback retains readonly IDs and selects only explicit in-week dates', () => {
  const w = page('planner-a', [
    {source_id: 'stable-id', key: 'legacy-key', kind: 'activity', text: 'Undated', status: 'plan'},
    {source_id: 'stable-id', key: 'renamed-key', kind: 'task', text: 'Duplicate', occurred_on: evidenceDate},
    {key: 'scheduled', kind: 'task', text: 'Scheduled', planned_on: weekEnd, occurred_on: evidenceDate},
    {key: 'reported', kind: 'outcome', text: 'Reported', planned_on: '2026-11-23', occurred_on: weekStart, status: 'reported_done'},
    {key: 'outside', kind: 'activity', text: 'Outside week', scheduled_on: '2026-11-15'},
    {key: 'summary', kind: 'summary', text: 'Week recap', occurred_on: evidenceDate},
  ]);
  assert.deepEqual(fallbackTasks(w).map(t => [t.id, t.date, t.readonly, t.status]), [
    ['stable-id', null, true, 'plan'],
    ['scheduled', weekEnd, true, 'unknown'],
    ['reported', weekStart, true, 'reported_done'],
    ['outside', null, true, 'unknown'],
  ]);
});

test('P0.1: legacy personal and independent workspace hashes resolve to their existing views', () => {
  for (const view of ['calendar', 'overview', 'gantt', 'progress', 'life', 'business', 'blueprint', 'review', 'notion', 'weekly', 'monthly', 'evidence', 'decision', 'settings']) {
    assert.deepEqual(parseWorkspaceHash('#personal/' + view), {module: 'personal', view});
  }
  for (const module of ['servicebio', 'ventures', 'enexia']) {
    assert.deepEqual(parseWorkspaceHash('#' + module), {module, view: null});
    assert.deepEqual(parseWorkspaceHash('#' + module + '/fixture-view'), {module, view: 'fixture-view'});
  }
  for (const hash of ['', '#home', '#unknown/calendar']) {
    assert.deepEqual(parseWorkspaceHash(hash), {module: 'home', view: null});
  }
  for (const hash of ['#personal', '#personal/unknown']) {
    assert.deepEqual(parseWorkspaceHash(hash), {module: 'personal', view: 'calendar'});
  }
});
