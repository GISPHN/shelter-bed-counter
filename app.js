'use strict';

const APP_VERSION = '1.0.1';
const STORAGE_KEY = 'shelterBedCounter.records.v1';
const DRAFT_KEY = 'shelterBedCounter.draft.v1';
const SETTINGS_KEY = 'shelterBedCounter.settings.v1';
const CUSTOM_VALUE = '__custom__';

const SHELTERS = [
  '代陽コミュニティセンター','八代市立代陽小学校','八代市立第一中学校','秀岳館高等学校','八代東高等学校',
  '八代市立八代小学校','八代コミュニティセンター','新開新浜町公民館',
  '八代トヨオカ地建アリーナ（総合体育館）','八代市立第二中学校','八代市立太田郷小学校','太田郷コミュニティセンター','八代白百合学園高等学校','桜十字ホールやつしろ（やつしろハーモニーホール）','八代高等職業訓練校','サンライフ八代','八代市 働く婦人の家',
  '八代市立植柳小学校','植柳コミュニティセンター','八代工業高等学校',
  '八代市立麦島小学校','麦島コミュニティセンター','八代市立第三中学校','八代実業専門学校',
  '八代市立松高小学校','八代高等学校','松高コミュニティセンター','大島公民館（大島分校跡）',
  '八代市立第四中学校','八代市立八千把小学校','八千把コミュニティセンター','八代市民球場',
  '八代市立第五中学校','八代市立高田小学校','高田コミュニティセンター','八代市保健センター','八代清流高等学校','熊本高等専門学校八代キャンパス',
  '八代市立第六中学校','八代市立金剛小学校','金剛コミュニティセンター','八代市立金剛小学校弥次分校','特別養護老人ホームま心苑',
  '八代市立郡築小学校','八代市立第七中学校','郡築コミュニティセンター',
  '八代市立第八中学校','八代市立宮地小学校','宮地コミュニティセンター','宮地東コミュニティセンター','古麓町公民館',
  '八代市立日奈久小学校','日奈久コミュニティセンター','八代市立日奈久中学校','日奈久温泉センターばんぺい湯',
  '八代市立昭和小学校','昭和コミュニティセンター',
  '二見コミュニティセンター','八代市立二見小学校','八代市立二見中学校',
  '八代市立龍峯小学校','龍峯コミュニティセンター',
  '坂本コミュニティセンター','八代市立八竜小学校','深水生活改善センター','さかもと青少年センター分館','久多良木多目的集会施設','今泉地区公民館','みんなの家（中津道）','八代市立坂本中学校','田上社会教育センター','鮎帰社会教育センター','鶴喰生活改善センター',
  '八代市立千丁中学校','千丁コミュニティセンター','八代市立千丁小学校','千丁体育館',
  '八代市立鏡小学校','鏡コミュニティセンター','八代市立鏡中学校','八代市立文政小学校','八代農業高等学校','八代市立有佐小学校','鏡体育館','鏡わかあゆ高等支援学校',
  '東陽コミュニティセンター及び東陽スポーツセンター','八代市定住センター及び東陽交流センターせせらぎ','八代市立東陽小学校','フードワークスやつしろ',
  '八代市立泉第八小学校','旧八代市立泉第一小学校','泉コミュニティセンター','泉憩いの家','五家荘デイサービスセンター福寿草','五家荘自然塾','かやばの里','久連子古代の里','板木・保口集会所',
  '希望の里たいよう','八代市立八代支援学校'
];

const COUNTERS = [
  { key: 'floorCount', label: '床', unit: '床', description: '床面に設けられた1人分の寝床スペース' },
  { key: 'cardboardBedCount', label: '段ボールベッド', unit: '台', description: '組み立て済みの段ボールベッド' },
  { key: 'tentCount', label: 'テント', unit: '張', description: '避難者の生活・就寝用テント' }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const els = {};
let activeSurvey = null;
let actionHistory = [];
let deferredInstallPrompt = null;
let toastTimer = null;
let wakeLock = null;
let editingInfo = false;
let lastExportedSurveyIds = [];

function init() {
  cacheElements();
  populateShelters();
  renderCounterCards();
  bindEvents();
  setDefaultDateTime();
  updateNetworkStatus();
  updateRecordCount();
  updateDraftAvailability();
  renderRecords();
  $('#appVersionText').textContent = APP_VERSION;
  registerServiceWorker();
}

function cacheElements() {
  Object.assign(els, {
    surveyForm: $('#surveyForm'), shelterSelect: $('#shelterSelect'), customShelterField: $('#customShelterField'),
    customShelterName: $('#customShelterName'), observationDate: $('#observationDate'), startTime: $('#startTime'),
    weather: $('#weather'), observationCoverage: $('#observationCoverage'), temperature: $('#temperature'),
    humidity: $('#humidity'), wbgt: $('#wbgt'), observerId: $('#observerId'), notes: $('#notes'),
    formError: $('#formError'), setupPanel: $('#setupPanel'), counterPanel: $('#counterPanel'),
    activeShelterName: $('#activeShelterName'), activeSurveyMeta: $('#activeSurveyMeta'), counterGrid: $('#counterGrid'),
    undoButton: $('#undoButton'), saveDraftButton: $('#saveDraftButton'), completeSurveyButton: $('#completeSurveyButton'),
    editInfoButton: $('#editInfoButton'), resumeDraftButton: $('#resumeDraftButton'), saveStatus: $('#saveStatus'),
    recordCountBadge: $('#recordCountBadge'), recordsEmpty: $('#recordsEmpty'), recordsList: $('#recordsList'),
    exportAllButton: $('#exportAllButton'), deleteAllButton: $('#deleteAllButton'), networkStatus: $('#networkStatus'),
    summaryDialog: $('#summaryDialog'), summaryContent: $('#summaryContent'), confirmCompleteButton: $('#confirmCompleteButton'),
    postExportDialog: $('#postExportDialog'), keepAfterExportButton: $('#keepAfterExportButton'),
    deleteAfterExportButton: $('#deleteAfterExportButton'), installButton: $('#installButton'), toast: $('#toast')
  });
}

function populateShelters() {
  const fragment = document.createDocumentFragment();
  for (const name of SHELTERS) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    fragment.append(option);
  }
  const customOption = document.createElement('option');
  customOption.value = CUSTOM_VALUE;
  customOption.textContent = '自由入力';
  fragment.append(customOption);
  els.shelterSelect.append(fragment);
}

function renderCounterCards() {
  els.counterGrid.innerHTML = COUNTERS.map(c => `
    <article class="counter-card" data-counter="${c.key}">
      <h3>${c.label}</h3>
      <p class="counter-description">${c.description}</p>
      <div class="counter-value-wrap">
        <input class="counter-value" data-role="value" type="number" min="0" max="99999" step="1" inputmode="numeric" value="0" aria-label="${c.label}の現在値">
        <span class="unit">${c.unit}</span>
      </div>
      <button class="increment-main" data-delta="1" type="button" aria-label="${c.label}を1増やす">＋1</button>
      <div class="quick-buttons">
        <button class="quick-button" data-delta="-1" type="button">－1</button>
        <button class="quick-button" data-delta="5" type="button">＋5</button>
        <button class="quick-button" data-delta="10" type="button">＋10</button>
      </div>
    </article>
  `).join('');
}

function bindEvents() {
  $$('.tab-button').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  els.shelterSelect.addEventListener('change', toggleCustomShelter);
  els.surveyForm.addEventListener('submit', handleSurveyFormSubmit);
  els.counterGrid.addEventListener('click', handleCounterClick);
  els.counterGrid.addEventListener('change', handleDirectCounterEdit);
  els.undoButton.addEventListener('click', undoLastAction);
  els.saveDraftButton.addEventListener('click', () => saveDraft(true));
  els.completeSurveyButton.addEventListener('click', showCompletionSummary);
  els.confirmCompleteButton.addEventListener('click', confirmCompletion);
  els.editInfoButton.addEventListener('click', returnToSetup);
  els.resumeDraftButton.addEventListener('click', resumeDraft);
  els.exportAllButton.addEventListener('click', exportAllCompleted);
  els.deleteAllButton.addEventListener('click', deleteAllRecords);
  els.recordsList.addEventListener('click', handleRecordAction);
  els.deleteAfterExportButton.addEventListener('click', deleteCompletedAfterExport);
  els.installButton.addEventListener('click', installApp);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installButton.classList.remove('hidden');
  });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', () => { if (activeSurvey) saveDraft(false); });
}

function toggleCustomShelter() {
  const isCustom = els.shelterSelect.value === CUSTOM_VALUE;
  els.customShelterField.classList.toggle('hidden', !isCustom);
  els.customShelterName.required = isCustom;
  if (isCustom) setTimeout(() => els.customShelterName.focus(), 0);
}

function setDefaultDateTime() {
  const now = new Date();
  if (!els.observationDate.value) els.observationDate.value = formatLocalDate(now);
  if (!els.startTime.value) els.startTime.value = formatLocalTime(now);
  const settings = readJson(SETTINGS_KEY, {});
  if (settings.observerId) els.observerId.value = settings.observerId;
}

function handleSurveyFormSubmit(event) {
  if (editingInfo) return updateSurveyInfo(event);
  return startSurvey(event);
}

function startSurvey(event) {
  event.preventDefault();
  clearFormError();
  const data = collectFormData();
  if (!data.shelterName) return showFormError('施設名を選択または入力してください。');
  if (!data.observationDate || !data.startTime || !data.weather) return showFormError('必須項目を入力してください。');

  const duplicate = getRecords().find(r => r.status === 'completed' && r.shelterName === data.shelterName && r.observationDate === data.observationDate);
  if (duplicate && !window.confirm('同じ施設・同じ調査日の完了データがあります。再調査として続行しますか。')) return;

  activeSurvey = {
    surveyId: createSurveyId(),
    shelterId: data.selectedShelter === CUSTOM_VALUE ? '' : `YAT-${String(SHELTERS.indexOf(data.selectedShelter) + 1).padStart(3, '0')}`,
    ...data,
    floorCount: 0,
    cardboardBedCount: 0,
    tentCount: 0,
    endTime: '',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
  actionHistory = [];
  persistObserverId();
  showCounterPanel();
  saveDraft(false);
  requestWakeLock();
}

function collectFormData() {
  const selectedShelter = els.shelterSelect.value;
  const shelterName = selectedShelter === CUSTOM_VALUE ? els.customShelterName.value.trim() : selectedShelter;
  return {
    selectedShelter,
    shelterName,
    observationDate: els.observationDate.value,
    startTime: els.startTime.value,
    weather: els.weather.value,
    observationCoverage: els.observationCoverage.value,
    temperatureC: normalizeOptionalNumber(els.temperature.value),
    humidityPercent: normalizeOptionalNumber(els.humidity.value),
    wbgtC: normalizeOptionalNumber(els.wbgt.value),
    observerId: els.observerId.value.trim(),
    notes: els.notes.value.trim()
  };
}

function showCounterPanel() {
  if (!activeSurvey) return;
  els.setupPanel.classList.add('hidden');
  els.counterPanel.classList.remove('hidden');
  els.activeShelterName.textContent = activeSurvey.shelterName;
  els.activeSurveyMeta.textContent = `${activeSurvey.observationDate} ${activeSurvey.startTime}開始・${activeSurvey.weather}`;
  updateCounterDisplay();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function returnToSetup() {
  if (!activeSurvey) return;
  editingInfo = true;
  fillFormFromSurvey(activeSurvey);
  els.counterPanel.classList.add('hidden');
  els.setupPanel.classList.remove('hidden');
}

function updateSurveyInfo(event) {
  event.preventDefault();
  clearFormError();
  const updated = collectFormData();
  if (!updated.shelterName || !updated.observationDate || !updated.startTime || !updated.weather) {
    return showFormError('必須項目を入力してください。');
  }
  Object.assign(activeSurvey, updated, { updatedAt: new Date().toISOString() });
  editingInfo = false;
  persistObserverId();
  showCounterPanel();
  saveDraft(false);
}

function handleCounterClick(event) {
  const button = event.target.closest('[data-delta]');
  if (!button || !activeSurvey) return;
  const card = button.closest('[data-counter]');
  const key = card.dataset.counter;
  applyCounterDelta(key, Number(button.dataset.delta));
}

function handleDirectCounterEdit(event) {
  const input = event.target.closest('[data-role="value"]');
  if (!input || !activeSurvey) return;
  const key = input.closest('[data-counter]').dataset.counter;
  const previous = activeSurvey[key];
  const next = clampCount(input.value);
  if (previous === next) return updateCounterDisplay();
  actionHistory.push({ key, previous, next });
  activeSurvey[key] = next;
  updateAfterCounterAction();
}

function applyCounterDelta(key, delta) {
  const previous = Number(activeSurvey[key] || 0);
  const next = Math.max(0, previous + delta);
  if (next === previous) return;
  actionHistory.push({ key, previous, next });
  activeSurvey[key] = next;
  updateAfterCounterAction();
  if (navigator.vibrate) navigator.vibrate(delta > 0 ? 16 : 10);
}

function updateAfterCounterAction() {
  activeSurvey.updatedAt = new Date().toISOString();
  updateCounterDisplay();
  els.undoButton.disabled = actionHistory.length === 0;
  markSaving();
  saveDraft(false);
}

function updateCounterDisplay() {
  if (!activeSurvey) return;
  COUNTERS.forEach(c => {
    const input = $(`[data-counter="${c.key}"] [data-role="value"]`);
    input.value = activeSurvey[c.key] ?? 0;
  });
  els.undoButton.disabled = actionHistory.length === 0;
}

function undoLastAction() {
  if (!activeSurvey || !actionHistory.length) return;
  const action = actionHistory.pop();
  activeSurvey[action.key] = action.previous;
  activeSurvey.updatedAt = new Date().toISOString();
  updateCounterDisplay();
  saveDraft(false);
  showToast('直前の操作を戻しました。');
}

function saveDraft(showMessage) {
  if (!activeSurvey) return;
  activeSurvey.status = 'draft';
  activeSurvey.updatedAt = new Date().toISOString();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(activeSurvey));
  updateDraftAvailability();
  markSaved();
  if (showMessage) showToast('途中データを保存しました。');
}

function resumeDraft() {
  const draft = readJson(DRAFT_KEY, null);
  if (!draft) return;
  activeSurvey = migrateSurvey(draft);
  actionHistory = [];
  showCounterPanel();
  requestWakeLock();
}

function updateDraftAvailability() {
  els.resumeDraftButton.classList.toggle('hidden', !localStorage.getItem(DRAFT_KEY));
}

function showCompletionSummary() {
  if (!activeSurvey) return;
  activeSurvey.endTime = formatLocalTime(new Date());
  const coverage = coverageLabel(activeSurvey.observationCoverage);
  els.summaryContent.innerHTML = `
    <table class="summary-table">
      <tr><th>施設名</th><td>${escapeHtml(activeSurvey.shelterName)}</td></tr>
      <tr><th>調査日時</th><td>${activeSurvey.observationDate} ${activeSurvey.startTime}–${activeSurvey.endTime}</td></tr>
      <tr><th>床</th><td>${activeSurvey.floorCount} 床</td></tr>
      <tr><th>段ボールベッド</th><td>${activeSurvey.cardboardBedCount} 台</td></tr>
      <tr><th>テント</th><td>${activeSurvey.tentCount} 張</td></tr>
      <tr><th>観察範囲</th><td>${coverage}</td></tr>
    </table>`;
  els.summaryDialog.showModal();
}

function confirmCompletion(event) {
  event.preventDefault();
  if (!activeSurvey) return;
  activeSurvey.status = 'completed';
  activeSurvey.endTime ||= formatLocalTime(new Date());
  activeSurvey.updatedAt = new Date().toISOString();
  const records = getRecords();
  const index = records.findIndex(r => r.surveyId === activeSurvey.surveyId);
  if (index >= 0) records[index] = activeSurvey; else records.push(activeSurvey);
  setRecords(records);
  localStorage.removeItem(DRAFT_KEY);
  els.summaryDialog.close();
  releaseWakeLock();
  showToast('調査結果を保存しました。');
  resetSurveyUI();
  updateRecordCount();
  renderRecords();
  switchView('records');
}

function resetSurveyUI() {
  activeSurvey = null;
  actionHistory = [];
  editingInfo = false;
  els.counterPanel.classList.add('hidden');
  els.setupPanel.classList.remove('hidden');
  els.surveyForm.reset();
  els.customShelterField.classList.add('hidden');
  setDefaultDateTime();
  updateDraftAvailability();
}

function renderRecords() {
  const records = getRecords().sort((a,b) => `${b.observationDate}T${b.startTime}`.localeCompare(`${a.observationDate}T${a.startTime}`));
  els.recordsEmpty.classList.toggle('hidden', records.length > 0);
  els.recordsList.innerHTML = records.map(r => `
    <article class="record-card" data-id="${r.surveyId}">
      <div>
        <h3>${escapeHtml(r.shelterName)}</h3>
        <div class="record-meta">
          <span>${r.observationDate} ${r.startTime}${r.endTime ? `–${r.endTime}` : ''}</span>
          <span>${escapeHtml(r.weather || '')}</span>
          <span>${coverageLabel(r.observationCoverage)}</span>
        </div>
        <div class="record-counts">
          <span class="count-chip">床 ${r.floorCount ?? 0}</span>
          <span class="count-chip">段ボールベッド ${r.cardboardBedCount ?? 0}</span>
          <span class="count-chip">テント ${r.tentCount ?? 0}</span>
          <span class="count-chip">${r.status === 'completed' ? '完了' : '入力中'}</span>
        </div>
      </div>
      <div class="record-actions">
        <button class="button button-secondary" data-action="export" type="button">CSV</button>
        <button class="button button-secondary" data-action="edit" type="button">編集</button>
        <button class="button button-danger-outline" data-action="delete" type="button">削除</button>
      </div>
    </article>`).join('');
  els.exportAllButton.disabled = !records.some(r => r.status === 'completed');
  els.deleteAllButton.disabled = records.length === 0;
}

function handleRecordAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const id = button.closest('[data-id]').dataset.id;
  const records = getRecords();
  const record = records.find(r => r.surveyId === id);
  if (!record) return;
  if (button.dataset.action === 'export') {
    downloadCsv([record]);
  } else if (button.dataset.action === 'edit') {
    activeSurvey = migrateSurvey({ ...record, status: 'draft', updatedAt: new Date().toISOString() });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(activeSurvey));
    actionHistory = [];
    editingInfo = false;
    updateRecordCount();
    renderRecords();
    switchView('new');
    showCounterPanel();
  } else if (button.dataset.action === 'delete') {
    if (!window.confirm(`「${record.shelterName}」の調査データを削除しますか。`)) return;
    setRecords(records.filter(r => r.surveyId !== id));
    updateRecordCount();
    renderRecords();
    showToast('データを削除しました。');
  }
}

function exportAllCompleted() {
  const completed = getRecords().filter(r => r.status === 'completed');
  if (!completed.length) return showToast('完了データがありません。');
  downloadCsv(completed);
}

function deleteCompletedAfterExport(event) {
  event.preventDefault();
  if (!lastExportedSurveyIds.length) return els.postExportDialog.close();
  if (!window.confirm('CSVに出力したデータを端末内から削除しますか。CSVが保存されたことを確認してください。')) return;
  const ids = new Set(lastExportedSurveyIds);
  setRecords(getRecords().filter(r => !ids.has(r.surveyId)));
  lastExportedSurveyIds = [];
  els.postExportDialog.close();
  updateRecordCount();
  renderRecords();
  showToast('出力したデータを削除しました。');
}

function deleteAllRecords() {
  if (!window.confirm('端末内のすべての保存データを削除しますか。この操作は取り消せません。')) return;
  localStorage.removeItem(STORAGE_KEY);
  updateRecordCount();
  renderRecords();
  showToast('保存データをすべて削除しました。');
}

function downloadCsv(records) {
  lastExportedSurveyIds = records.map(r => r.surveyId);
  const headers = [
    'survey_id','shelter_id','shelter_name','observation_date','start_time','end_time','weather',
    'temperature_c','humidity_percent','wbgt_c','observer_id','floor_count','cardboard_bed_count',
    'tent_count','observation_coverage','notes','status','created_at','updated_at','app_version'
  ];
  const rows = records.map(r => [
    r.surveyId, r.shelterId || '', r.shelterName, r.observationDate, r.startTime, r.endTime || '', r.weather,
    valueOrBlank(r.temperatureC), valueOrBlank(r.humidityPercent), valueOrBlank(r.wbgtC), r.observerId || '',
    r.floorCount ?? 0, r.cardboardBedCount ?? 0, r.tentCount ?? 0, r.observationCoverage || '', r.notes || '',
    r.status, r.createdAt, r.updatedAt, r.appVersion || APP_VERSION
  ]);
  const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `shelter_bed_counter_${fileTimestamp(new Date())}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast(`${records.length}件をCSV出力しました。`);
  setTimeout(() => els.postExportDialog.showModal(), 150);
}

function switchView(name) {
  $$('.tab-button').forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === name));
  $$('.view').forEach(view => view.classList.toggle('is-active', view.id === `view-${name}`));
  if (name === 'records') renderRecords();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function fillFormFromSurvey(s) {
  if (SHELTERS.includes(s.shelterName)) {
    els.shelterSelect.value = s.shelterName;
    els.customShelterField.classList.add('hidden');
    els.customShelterName.required = false;
    els.customShelterName.value = '';
  } else {
    els.shelterSelect.value = CUSTOM_VALUE;
    els.customShelterField.classList.remove('hidden');
    els.customShelterName.required = true;
    els.customShelterName.value = s.shelterName;
  }
  els.observationDate.value = s.observationDate || '';
  els.startTime.value = s.startTime || '';
  els.weather.value = s.weather || '';
  els.observationCoverage.value = s.observationCoverage || 'complete';
  els.temperature.value = valueOrBlank(s.temperatureC);
  els.humidity.value = valueOrBlank(s.humidityPercent);
  els.wbgt.value = valueOrBlank(s.wbgtC);
  els.observerId.value = s.observerId || '';
  els.notes.value = s.notes || '';
}

function getRecords() { return readJson(STORAGE_KEY, []).map(migrateSurvey); }
function setRecords(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function updateRecordCount() { els.recordCountBadge.textContent = String(getRecords().length); }
function migrateSurvey(s) {
  return {
    floorCount: 0, cardboardBedCount: 0, tentCount: 0, observationCoverage: 'complete', status: 'completed',
    appVersion: APP_VERSION, ...s
  };
}

function persistObserverId() {
  const settings = readJson(SETTINGS_KEY, {});
  settings.observerId = els.observerId.value.trim();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  els.networkStatus.textContent = online ? 'オンライン' : 'オフライン';
  els.networkStatus.classList.toggle('offline', !online);
}

function markSaving() { els.saveStatus.textContent = '保存中…'; }
function markSaved() { requestAnimationFrame(() => { els.saveStatus.textContent = '自動保存済み'; }); }

async function requestWakeLock() {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { wakeLock = null; }
}
async function releaseWakeLock() {
  try { await wakeLock?.release(); } catch (_) {}
  wakeLock = null;
}
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && activeSurvey) requestWakeLock();
}

async function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  els.installButton.classList.add('hidden');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

function createSurveyId() {
  const now = new Date();
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0,5);
  return `SBC-${fileTimestamp(now)}-${random}`;
}
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}
function formatLocalTime(date) { return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
function fileTimestamp(date) {
  return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}_${String(date.getHours()).padStart(2,'0')}${String(date.getMinutes()).padStart(2,'0')}${String(date.getSeconds()).padStart(2,'0')}`;
}
function normalizeOptionalNumber(value) { return value === '' ? '' : Number(value); }
function valueOrBlank(value) { return value === '' || value === null || value === undefined ? '' : value; }
function clampCount(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(99999, Math.max(0, parsed));
}
function coverageLabel(value) { return ({ complete: '施設全体', partial: '一部のみ', unknown: '不明' })[value] || '不明'; }
function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function readJson(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch (_) { return fallback; }
}
function showFormError(message) { els.formError.textContent = message; els.formError.classList.remove('hidden'); els.formError.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function clearFormError() { els.formError.textContent = ''; els.formError.classList.add('hidden'); }
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
}

document.addEventListener('DOMContentLoaded', init);
