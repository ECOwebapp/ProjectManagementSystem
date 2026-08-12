/**
 * projectsRepo.js  ← THE ONLY data-access module UI components import from.
 *
 * Current implementation: reads Google Sheets CSV, stores new data in localStorage.
 * To migrate to Supabase: replace every function body below with Supabase calls.
 * UI components don't need to change at all.
 *
 * CONFIG: point CSV_URL at a local file (dev) or a Google Sheets export URL.
 * Google Sheets export URL format:
 *   https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&id={SHEET_ID}
 */

import { parseCSV, SEEDED_PERSONNEL } from './csvParser.js';
import {
  getCommentsFromStore,
  saveCommentToStore,
  resolveCommentInStore,
  getLocalProjects,
  saveLocalProject,
  getPersonnelFromStore,
  savePersonnelToStore,
  addPersonnelToStore,
  getIssuesFromStore,
  saveIssueToStore,
  updateIssueInStore,
  deleteIssueFromStore,
  seedIssuesIfEmpty,
  getVariationOrdersFromStore,
  saveVariationOrderToStore,
  deleteVariationOrderFromStore,
  updateVariationOrderInStore,
  seedVariationOrdersIfEmpty,
  getProgressFromStore,
  saveProgressToStore,
  seedProgressIfEmpty,
  getProjectOverrideFromStore,
  saveProjectOverrideToStore,
} from './localStore.js';

// ─── Config (swap this one URL for Supabase later) ───────────────────────────

const CSV_URL = '/data/projects.csv';
// To use Google Sheets: replace with your export URL, e.g.:
// const CSV_URL = 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv';

// ─── Module-level cache ───────────────────────────────────────────────────────

let _cache = null; // { projects, contractors, projectContractors, variationOrders, progressUpdates, issues }

async function fetchAndParse() {
  if (_cache) return _cache;
  const resp = await fetch(CSV_URL);
  if (!resp.ok) throw new Error(`Failed to load project data: ${resp.status}`);
  const text = await resp.text();
  _cache = parseCSV(text);
  return _cache;
}

/** Merge sheet projects with locally-stored ones */
async function getAllProjects() {
  const { projects, contractors, projectContractors } = await fetchAndParse();
  const local = getLocalProjects();

  // Enrich sheet projects with their contractors & overrides
  const enriched = projects.map(p => {
    const pcs = projectContractors.filter(pc => pc.project_no === p.project_no);
    const contractorObjs = pcs.map(pc => contractors.find(c => c.contractor_id === pc.contractor_id)).filter(Boolean);
    const override = getProjectOverrideFromStore(p.project_no) || {};
    const base = { ...p, contractors: contractorObjs, projectContractors: pcs, ...override };
    if (override.contractor_names) {
      base.contractors = override.contractor_names.map(name => ({ contractor_name: name }));
    }
    return base;
  });

  // Enrich local projects similarly
  const enrichedLocal = local.map(p => {
    const override = getProjectOverrideFromStore(p.project_no) || {};
    const base = {
      ...p,
      contractors: (p.contractor_names || []).map(name => ({ contractor_name: name })),
      projectContractors: [],
      ...override,
    };
    if (override.contractor_names) {
      base.contractors = override.contractor_names.map(name => ({ contractor_name: name }));
    }
    return base;
  });

  return [...enriched, ...enrichedLocal];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get all projects (sheet + local), optionally filtered by category */
export async function getProjects(category = null) {
  const all = await getAllProjects();
  if (!category || category === 'All') return all;
  return all.filter(p => p.category === category);
}

/** Get a single project by project_no */
export async function getProjectById(projectNo) {
  const { variationOrders: csvVOs, progressUpdates, issues: csvIssues } = await fetchAndParse();
  const all = await getAllProjects();
  const project = all.find(p => String(p.project_no) === String(projectNo));
  if (!project) return null;

  // Seed local store with CSV issues & VOs on first visit
  const filteredIssues = csvIssues.filter(iss => String(iss.project_no) === String(projectNo));
  seedIssuesIfEmpty(projectNo, filteredIssues);
  const issues = getIssuesFromStore(projectNo) || filteredIssues;

  const filteredVOs = csvVOs.filter(vo => String(vo.project_no) === String(projectNo));
  seedVariationOrdersIfEmpty(projectNo, filteredVOs);
  const variationOrders = getVariationOrdersFromStore(projectNo) || filteredVOs;

  const filteredProgress = progressUpdates.filter(pu => String(pu.project_no) === String(projectNo));
  seedProgressIfEmpty(projectNo, filteredProgress);
  const puList = getProgressFromStore(projectNo) || filteredProgress;

  return {
    ...project,
    variationOrders,
    progressUpdates: puList,
    issues,
  };
}

/** Update project header fields */
export function updateProjectHeader(projectNo, patch) {
  _cache = null; // reset cache
  return saveProjectOverrideToStore(projectNo, patch);
}

/** Add a new project (stored locally until Supabase) */
export async function addProject(data) {
  _cache = null; // clear cache so getAllProjects re-reads
  return saveLocalProject(data);
}

// ─── Progress Updates ────────────────────────────────────────────────────────

/** Add/Update progress for a project */
export function updateProgress(projectNo, data) {
  return saveProgressToStore(projectNo, data);
}

// ─── Variation Orders ────────────────────────────────────────────────────────

/** Add a new variation order for a project */
export function addVariationOrder(projectNo, data) {
  return saveVariationOrderToStore(projectNo, data);
}

/** Delete a variation order */
export function deleteVariationOrder(projectNo, voId) {
  deleteVariationOrderFromStore(projectNo, voId);
}

/** Update a variation order's fields (e.g. status) */
export function updateVariationOrder(projectNo, voId, patch) {
  return updateVariationOrderInStore(projectNo, voId, patch);
}

// ─── Issues ─────────────────────────────────────────────────────────────────────────

/** Add a new issue for a project */
export function addIssue(projectNo, description, status = 'On-going') {
  return saveIssueToStore(projectNo, { description, status });
}

/** Update issue description and/or status */
export function updateIssue(projectNo, issueId, patch) {
  updateIssueInStore(projectNo, issueId, patch);
}

/** Delete an issue */
export function deleteIssue(projectNo, issueId) {
  deleteIssueFromStore(projectNo, issueId);
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Get all comments for a project (flat list, build tree in the component) */
export function getComments(projectNo) {
  return getCommentsFromStore(projectNo);
}

/** Add a top-level comment */
export function addComment({ projectNo, personnelId, commenterName, text, targetField = null }) {
  return saveCommentToStore(projectNo, {
    personnel_id: personnelId,
    commenter_name: commenterName,
    comment_text: text,
    target_field: targetField,
    parent_comment_id: null,
  });
}

/** Add a reply to an existing comment */
export function addReply({ projectNo, personnelId, commenterName, text, parentCommentId }) {
  return saveCommentToStore(projectNo, {
    personnel_id: personnelId,
    commenter_name: commenterName,
    comment_text: text,
    parent_comment_id: parentCommentId,
  });
}

/** Toggle resolved state on a comment */
export function resolveComment(projectNo, commentId) {
  resolveCommentInStore(projectNo, commentId);
}

// ─── Personnel ───────────────────────────────────────────────────────────────

/** Get all personnel (seeded + user-added) */
export function getPersonnel() {
  const stored = getPersonnelFromStore();
  if (stored !== null) return stored;
  // First run: seed from CSV legend
  savePersonnelToStore(SEEDED_PERSONNEL);
  return SEEDED_PERSONNEL;
}

/** Add a new person */
export function addPersonnel({ name, title }) {
  return addPersonnelToStore({ name, title });
}
