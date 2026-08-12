/**
 * localStore.js
 * localStorage helpers for comments, local projects, and personnel.
 * When migrating to Supabase, only projectsRepo.js changes — not these helpers.
 */

const KEYS = {
  comments:        (projectNo) => `eco_comments_${projectNo}`,
  issues:          (projectNo) => `eco_issues_${projectNo}`,
  variationOrders: (projectNo) => `eco_vo_${projectNo}`,
  progress:        (projectNo) => `eco_progress_${projectNo}`,
  localProjects:   'eco_projects_local',
  personnel:       'eco_personnel',
};

// ─── Generic helpers ──────────────────────────────────────────────────────────

function readJSON(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export function getCommentsFromStore(projectNo) {
  return readJSON(KEYS.comments(projectNo), []);
}

export function saveCommentToStore(projectNo, commentData) {
  const comments = getCommentsFromStore(projectNo);
  const newComment = {
    comment_id: generateId(),
    project_no: projectNo,
    target_field: commentData.target_field || null,
    personnel_id: commentData.personnel_id,
    commenter_name: commentData.commenter_name,
    commented_at: new Date().toISOString(),
    comment_text: commentData.comment_text,
    parent_comment_id: commentData.parent_comment_id || null,
    is_resolved: false,
  };
  comments.push(newComment);
  writeJSON(KEYS.comments(projectNo), comments);
  return newComment;
}

export function resolveCommentInStore(projectNo, commentId) {
  const comments = getCommentsFromStore(projectNo);
  const updated = comments.map(c =>
    c.comment_id === commentId ? { ...c, is_resolved: !c.is_resolved } : c
  );
  writeJSON(KEYS.comments(projectNo), updated);
}

// ─── Local Projects ──────────────────────────────────────────────────────────

export function getLocalProjects() {
  return readJSON(KEYS.localProjects, []);
}

export function saveLocalProject(data) {
  const projects = getLocalProjects();
  const newProject = {
    project_no: `local-${generateId()}`,
    project_id_code: data.project_id_code || null,
    category: data.category || 'On-going',
    project_name: data.project_name,
    original_contract_amount: data.original_contract_amount || null,
    revised_contract_amount: data.revised_contract_amount || null,
    original_completion_date: data.original_completion_date || null,
    new_completion_date: data.new_completion_date || null,
    general_remarks: data.general_remarks || null,
    contractor_names: data.contractor_names || [],
    source: 'local',
  };
  projects.push(newProject);
  writeJSON(KEYS.localProjects, projects);
  return newProject;
}

// ─── Project Overrides ──────────────────────────────────────────────────────

export function getProjectOverrideFromStore(projectNo) {
  return readJSON(`eco_project_override_${projectNo}`, null);
}

export function saveProjectOverrideToStore(projectNo, patch) {
  const key = `eco_project_override_${projectNo}`;
  const existing = readJSON(key, {}) || {};
  const updated = { ...existing, ...patch };
  writeJSON(key, updated);
  return updated;
}

// ─── Issues (local overrides) ────────────────────────────────────────────────

export function getIssuesFromStore(projectNo) {
  return readJSON(KEYS.issues(projectNo), null); // null = no local overrides yet
}

export function saveIssueToStore(projectNo, issueData) {
  const existing = readJSON(KEYS.issues(projectNo), []);
  const newIssue = {
    issue_id:    `${projectNo}-li-${generateId()}`,
    project_no:  projectNo,
    description: issueData.description || '',
    status:      issueData.status || 'On-going',
    source:      'local',
  };
  existing.push(newIssue);
  writeJSON(KEYS.issues(projectNo), existing);
  return newIssue;
}

export function updateIssueInStore(projectNo, issueId, patch) {
  const list = readJSON(KEYS.issues(projectNo), []);
  const updated = list.map(iss =>
    iss.issue_id === issueId ? { ...iss, ...patch } : iss
  );
  writeJSON(KEYS.issues(projectNo), updated);
}

export function deleteIssueFromStore(projectNo, issueId) {
  const list = readJSON(KEYS.issues(projectNo), []);
  writeJSON(KEYS.issues(projectNo), list.filter(iss => iss.issue_id !== issueId));
}

/**
 * Seed the local store with CSV-sourced issues for a project (once).
 * After this, the store is the source of truth for that project's issues.
 */
export function seedIssuesIfEmpty(projectNo, csvIssues) {
  const existing = readJSON(KEYS.issues(projectNo), null);
  if (existing !== null) return; // already seeded
  writeJSON(KEYS.issues(projectNo), csvIssues.map(iss => ({ ...iss, source: iss.source || 'csv' })));
}

// ─── Variation Orders (local overrides) ──────────────────────────────────────

export function getVariationOrdersFromStore(projectNo) {
  return readJSON(KEYS.variationOrders(projectNo), null); // null = no local store yet
}

export function saveVariationOrderToStore(projectNo, voData) {
  const existing = readJSON(KEYS.variationOrders(projectNo), []);
  const nextVoNumber = existing.length + 1;
  const newVo = {
    vo_id:          `${projectNo}-vo-${generateId()}`,
    project_no:     projectNo,
    vo_number:      nextVoNumber,
    date_submitted: voData.date_submitted || null,
    amount:         voData.amount ? parseFloat(voData.amount) : 0,
    revised_amount: voData.revised_amount ? parseFloat(voData.revised_amount) : null,
    details:        voData.details || null,
    status:         voData.status || 'Subject for BOR Approval',
    source:         'local',
  };
  existing.push(newVo);
  writeJSON(KEYS.variationOrders(projectNo), existing);
  return newVo;
}

export function deleteVariationOrderFromStore(projectNo, voId) {
  const list = readJSON(KEYS.variationOrders(projectNo), []);
  writeJSON(KEYS.variationOrders(projectNo), list.filter(vo => vo.vo_id !== voId));
}

export function updateVariationOrderInStore(projectNo, voId, patch) {
  const list = readJSON(KEYS.variationOrders(projectNo), []);
  const updated = list.map(vo => vo.vo_id === voId ? { ...vo, ...patch } : vo);
  writeJSON(KEYS.variationOrders(projectNo), updated);
  return updated.find(vo => vo.vo_id === voId);
}

export function seedVariationOrdersIfEmpty(projectNo, csvVOs) {
  const existing = readJSON(KEYS.variationOrders(projectNo), null);
  if (existing !== null) return; // already seeded
  writeJSON(KEYS.variationOrders(projectNo), csvVOs.map(vo => ({ ...vo, source: vo.source || 'csv' })));
}

// ─── Progress Updates (local overrides) ──────────────────────────────────────

export function getProgressFromStore(projectNo) {
  return readJSON(KEYS.progress(projectNo), null); // null = no local store yet
}

export function saveProgressToStore(projectNo, progressData) {
  const existing = readJSON(KEYS.progress(projectNo), []);
  const actual = parseFloat(progressData.actual_percent ?? 0);
  const target = parseFloat(progressData.target_percent ?? 0);
  const slippage = actual - target;

  const newProgress = {
    progress_id:      `${projectNo}-pu-${generateId()}`,
    project_no:       projectNo,
    actual_percent:   actual,
    target_percent:   target,
    slippage_percent: slippage,
    as_of_date:       progressData.as_of_date || null,
    updated_at:       new Date().toISOString(),
    source:           'local',
  };

  // We append to progress updates list
  existing.push(newProgress);
  writeJSON(KEYS.progress(projectNo), existing);
  return newProgress;
}

export function seedProgressIfEmpty(projectNo, csvProgress) {
  const existing = readJSON(KEYS.progress(projectNo), null);
  if (existing !== null) return; // already seeded
  writeJSON(KEYS.progress(projectNo), csvProgress.map(pu => ({ ...pu, source: pu.source || 'csv' })));
}

// ─── Personnel ───────────────────────────────────────────────────────────────

export function getPersonnelFromStore() {
  return readJSON(KEYS.personnel, null);
}

export function savePersonnelToStore(list) {
  writeJSON(KEYS.personnel, list);
}

export function addPersonnelToStore(data) {
  const list = getPersonnelFromStore() || [];
  const newPerson = {
    personnel_id: generateId(),
    name: data.name,
    title: data.title || '',
  };
  list.push(newPerson);
  writeJSON(KEYS.personnel, list);
  return newPerson;
}
