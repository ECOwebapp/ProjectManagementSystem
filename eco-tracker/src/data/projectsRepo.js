/**
 * projectsRepo.js  ← THE ONLY data-access module UI components import from.
 *
 * Implementation: Supabase (PostgreSQL).
 * All UI components call the same exported function signatures as before.
 */

import { supabase } from './supabaseClient.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Shapes a raw Supabase project row into the shape the UI expects */
function shapeProject(row) {
  return {
    ...row,
    // contractors TEXT[] → array of { contractor_name } objects (UI compat)
    contractors: (row.contractors || []).map(name => ({ contractor_name: name })),
  };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

/** Get all projects, optionally filtered by category */
export async function getProjects(category = null) {
  let query = supabase.from('project').select('*').order('project_no');
  if (category && category !== 'All') query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(shapeProject);
}

/** Get a single project by project_no with all related data */
export async function getProjectById(projectNo) {
  const { data: project, error: pErr } = await supabase
    .from('project')
    .select('*')
    .eq('project_no', projectNo)
    .single();

  if (pErr) throw new Error(pErr.message);
  if (!project) return null;

  const [vosRes, progressRes, issuesRes] = await Promise.all([
    supabase.from('variation_order').select('*').eq('project_no', projectNo).order('vo_number'),
    supabase.from('progress_update').select('*').eq('project_no', projectNo).order('created_at', { ascending: false }),
    supabase.from('issue_concern').select('*').eq('project_no', projectNo).order('created_at'),
  ]);

  return {
    ...shapeProject(project),
    variationOrders: vosRes.data || [],
    progressUpdates: progressRes.data || [],
    issues: issuesRes.data || [],
  };
}

/** Update project header fields */
export async function updateProjectHeader(projectNo, patch) {
  // contractor_names → contractors TEXT[]
  const update = { ...patch };
  if (patch.contractor_names) {
    update.contractors = patch.contractor_names;
    delete update.contractor_names;
  }

  const { error } = await supabase
    .from('project')
    .update(update)
    .eq('project_no', projectNo);

  if (error) throw new Error(error.message);
}

/** Add a new project */
export async function addProject(data) {
  const contractors = (data.contractor_names || []);
  const { data: inserted, error } = await supabase
    .from('project')
    .insert({
      project_id_code:          data.project_id_code,
      category:                 data.category,
      project_name:             data.project_name,
      contractors,
      original_contract_amount: data.original_contract_amount || null,
      revised_contract_amount:  data.revised_contract_amount || null,
      original_completion_date: data.original_completion_date || null,
      new_completion_date:      data.new_completion_date || null,
      general_remarks:          data.general_remarks || null,
      source:                   'local',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}

// ─── Progress Updates ─────────────────────────────────────────────────────────

export async function updateProgress(projectNo, data) {
  const { error } = await supabase.from('progress_update').insert({
    project_no:       projectNo,
    as_of_date:       data.as_of_date || null,
    actual_percent:   data.actual_percent ?? null,
    target_percent:   data.target_percent ?? null,
    slippage_percent: data.slippage_percent ?? null,
  });
  if (error) throw new Error(error.message);
}

// ─── Variation Orders ─────────────────────────────────────────────────────────

export async function addVariationOrder(projectNo, data) {
  const { error } = await supabase.from('variation_order').insert({
    project_no:    projectNo,
    vo_number:     data.vo_number,
    date_submitted: data.date_submitted || null,
    amount:        data.amount ?? null,
    details:       data.details || null,
    status:        data.status || null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteVariationOrder(projectNo, voId) {
  const { error } = await supabase.from('variation_order').delete().eq('vo_id', voId);
  if (error) throw new Error(error.message);
}

export async function updateVariationOrder(projectNo, voId, patch) {
  const { error } = await supabase.from('variation_order').update(patch).eq('vo_id', voId);
  if (error) throw new Error(error.message);
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export async function addIssue(projectNo, description, status = 'Open') {
  const { error } = await supabase.from('issue_concern').insert({
    project_no: projectNo,
    description,
    status,
  });
  if (error) throw new Error(error.message);
}

export async function updateIssue(projectNo, issueId, patch) {
  const { error } = await supabase.from('issue_concern').update(patch).eq('issue_id', issueId);
  if (error) throw new Error(error.message);
}

export async function deleteIssue(projectNo, issueId) {
  const { error } = await supabase.from('issue_concern').delete().eq('issue_id', issueId);
  if (error) throw new Error(error.message);
}

// ─── Comments ────────────────────────────────────────────────────────────────

/** Get all comments for a project (flat list) */
export async function getComments(projectNo) {
  const { data, error } = await supabase
    .from('comment')
    .select('*')
    .eq('project_no', projectNo)
    .order('commented_at');
  if (error) throw new Error(error.message);
  return data || [];
}

/** Add a top-level comment */
export async function addComment({ projectNo, personnelId, commenterName, text, targetField = null }) {
  const { error } = await supabase.from('comment').insert({
    project_no:        projectNo,
    personnel_id:      personnelId || null,
    commenter_name:    commenterName,
    comment_text:      text,
    target_field:      targetField,
    parent_comment_id: null,
    is_resolved:       false,
  });
  if (error) throw new Error(error.message);
}

/** Add a reply to an existing comment */
export async function addReply({ projectNo, personnelId, commenterName, text, parentCommentId }) {
  const { error } = await supabase.from('comment').insert({
    project_no:        projectNo,
    personnel_id:      personnelId || null,
    commenter_name:    commenterName,
    comment_text:      text,
    parent_comment_id: parentCommentId,
    is_resolved:       false,
  });
  if (error) throw new Error(error.message);
}

/** Toggle resolved state on a comment */
export async function resolveComment(projectNo, commentId) {
  // Read current state then toggle
  const { data, error: rErr } = await supabase
    .from('comment')
    .select('is_resolved')
    .eq('comment_id', commentId)
    .single();
  if (rErr) throw new Error(rErr.message);

  const { error } = await supabase
    .from('comment')
    .update({ is_resolved: !data.is_resolved })
    .eq('comment_id', commentId);
  if (error) throw new Error(error.message);
}

// ─── Personnel ────────────────────────────────────────────────────────────────

/** Get all personnel */
export async function getPersonnel() {
  const { data, error } = await supabase.from('personnel').select('*').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

/** Add a new person */
export async function addPersonnel({ name, title }) {
  const { data, error } = await supabase
    .from('personnel')
    .insert({ name, title })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Delete a project and all its related records */
export async function deleteProject(projectNo) {
  // 1. Get all issue_ids for this project
  const { data: issues } = await supabase
    .from('issue_concern')
    .select('issue_id')
    .eq('project_no', projectNo);

  const issueIds = (issues || []).map(i => i.issue_id);

  if (issueIds.length > 0) {
    // Delete any issue assignments first
    try {
      await supabase
        .from('issue_assignment')
        .delete()
        .in('issue_id', issueIds);
    } catch (e) {
      console.warn('issue_assignment delete failed:', e);
    }
  }

  // 2. Delete related records in parallel
  await Promise.all([
    supabase.from('comment').delete().eq('project_no', projectNo),
    supabase.from('progress_update').delete().eq('project_no', projectNo),
    supabase.from('variation_order').delete().eq('project_no', projectNo),
    supabase.from('issue_concern').delete().eq('project_no', projectNo),
  ]);

  // 3. Delete the project header itself
  const { error } = await supabase
    .from('project')
    .delete()
    .eq('project_no', projectNo);

  if (error) throw new Error(error.message);
}

