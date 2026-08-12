/**
 * csvParser.js
 * Parses the raw Google Sheets CSV export into normalized data structures.
 * All parsing logic lives here — projectsRepo.js calls parseCSV(text).
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/** Parse full CSV text (handles multi-line quoted cells) into rows of columns */
function parseCSVText(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      if (current.trim()) rows.push(parseCSVLine(current));
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(parseCSVLine(current));
  return rows;
}

function clean(val) {
  if (!val) return null;
  const v = val.replace(/[\u00a0\u200b]/g, ' ').trim();
  if (!v || v === 'N/A' || v.toLowerCase() === 'no data provided from implenting party'
    || v.toLowerCase().startsWith('no data provided')) return null;
  return v;
}

function parseAmount(val) {
  if (!clean(val)) return null;
  const num = val.replace(/[₱Pp,h\s]/g, '').replace(/^p/i, '').replace(/,/g, '');
  const parsed = parseFloat(num);
  return isNaN(parsed) ? null : parsed;
}

function parseProgress(cell) {
  if (!clean(cell)) return null;
  const actual = cell.match(/[Aa]ctual[:\s]*([+-]?\d+\.?\d*)/);
  const target = cell.match(/[Tt]arget[:\s]*([+-]?\d+\.?\d*)/);
  const slippage = cell.match(/[Ss]lippage[:\s]*([+-]?\d+\.?\d*)/);
  if (!actual && !target) return null;
  return {
    actual_percent: actual ? parseFloat(actual[1]) : null,
    target_percent: target ? parseFloat(target[1]) : null,
    slippage_percent: slippage ? parseFloat(slippage[1]) : null,
  };
}

function parseVO(cell, voNumber) {
  if (!clean(cell)) return null;
  const dateMatch = cell.match(/[Dd]ate\s*[Ss]ubmitted[:\s]*([^\n]+)/);
  const amountMatch = cell.match(/[Aa]mount[:\s]*([\u20b1\u20a8₱Pp\d,.\s]+)/);
  const statusMatch = cell.match(/[Ss]tatus[:\s]*([^\n]+)/);
  const detailsMatch = cell.match(/[Dd]etails[:\s]*([^\n]+)/);
  return {
    vo_number: voNumber,
    date_submitted: dateMatch ? dateMatch[1].trim() : null,
    amount: amountMatch ? parseAmount(amountMatch[1]) : null,
    details: detailsMatch ? detailsMatch[1].trim() : null,
    status: statusMatch ? statusMatch[1].trim() : clean(cell),
  };
}

function splitContractors(val) {
  if (!clean(val)) return [];
  // Split on "/" but not within known patterns like "MDC Electrical..."
  // Also handle "Winning Bidder: X\n\nSubject for..."
  const cleaned = val.replace(/Winning Bidder:\s*/gi, '').replace(/\n[\s\S]*/g, '').trim();
  return cleaned
    .split(/\s*[/]\s*(?=[A-Z])/)
    .map(c => c.replace(/\s*-\s*Joint Venture\s*$/i, '').trim())
    .filter(Boolean);
}

function parseIssues(cell) {
  if (!clean(cell)) return [];
  // Split numbered items like (1) (2) etc.
  const parts = cell.split(/\n?\s*\(\d+\)\s+/).filter(p => p.trim());
  if (parts.length <= 1) return [cell.trim()];
  return parts.map(p => p.trim()).filter(Boolean);
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export function parseCSV(text) {
  const rows = parseCSVText(text);

  const projects = [];
  const contractors = [];   // unique
  const projectContractors = [];
  const variationOrders = [];
  const progressUpdates = [];
  const issues = [];

  let category = null;
  let projectCounter = 0;
  let contractorIdCounter = 1;
  const contractorMap = {}; // name → contractor_id

  function getOrCreateContractor(name) {
    const key = name.toLowerCase().trim();
    if (!contractorMap[key]) {
      contractorMap[key] = contractorIdCounter++;
      contractors.push({
        contractor_id: contractorMap[key],
        contractor_name: name,
        contractor_status: 'Active',
      });
    }
    return contractorMap[key];
  }

  for (const row of rows) {
    const col0 = clean(row[0]);
    const col1 = clean(row[1]);

    // Detect section headers
    if (row[0] && row[0].includes('MATRIX OF ON-GOING PROJECTS')) { category = 'On-going'; continue; }
    if (row[0] && row[0].includes('MATRIX OF PROPOSED PROJECTS')) { category = 'Proposed'; continue; }
    // Skip header row and note rows
    if (!category) continue;
    if (row[0] === 'No.' || row[0] === '' && row[3] === 'Project Name') continue;
    if (!col0 || isNaN(parseInt(col0))) continue;
    // Skip color/note rows at the end
    if (row[4] && row[4].includes('Note:')) continue;

    projectCounter++;
    const project_no = projectCounter;

    // Columns: [0]No [1]ProjectID [2]Contractor [3]ProjectName [4]OrigAmount
    // [5]VO1 [6]RevisedAmt [7]VO2 [8]Progress [9]Issues [10]OrigDate [11]NewDate [12]Remarks
    const project = {
      project_no,
      project_id_code: clean(row[1]),
      category,
      project_name: clean(row[3]) || `Project ${project_no}`,
      original_contract_amount: parseAmount(row[4]),
      revised_contract_amount: parseAmount(row[6]),
      original_completion_date: clean(row[10]),
      new_completion_date: clean(row[11]),
      general_remarks: clean(row[12]),
      source: 'sheet',
    };
    projects.push(project);

    // Contractors
    const contractorNames = splitContractors(row[2] || '');
    contractorNames.forEach((name, i) => {
      const cid = getOrCreateContractor(name);
      projectContractors.push({
        project_contractor_id: `${project_no}-${cid}`,
        project_no,
        contractor_id: cid,
        role: contractorNames.length > 1 ? 'Joint Venture Partner' : 'Prime Contractor',
      });
    });
    if (contractorNames.length === 0 && clean(row[2])) {
      // Use raw value as-is (e.g. "By Administration")
      const name = clean(row[2]);
      const cid = getOrCreateContractor(name);
      projectContractors.push({
        project_contractor_id: `${project_no}-${cid}`,
        project_no,
        contractor_id: cid,
        role: 'Prime Contractor',
      });
    }

    // Variation Orders
    const vo1 = parseVO(row[5], 1);
    if (vo1) variationOrders.push({ vo_id: `${project_no}-vo1`, project_no, ...vo1 });
    const vo2 = parseVO(row[7], 2);
    if (vo2) variationOrders.push({ vo_id: `${project_no}-vo2`, project_no, ...vo2 });

    // Progress
    const progress = parseProgress(row[8]);
    if (progress) {
      progressUpdates.push({
        progress_id: `${project_no}-p1`,
        project_no,
        as_of_date: null, // extracted from text if present
        ...progress,
      });
      // Try to extract "as of" date
      const asOf = (row[8] || '').match(/[Aa]s\s+of\s+([^\n:]+)/);
      if (asOf) progressUpdates[progressUpdates.length - 1].as_of_date = asOf[1].trim();
    }

    // Issues
    const issueList = parseIssues(row[9]);
    issueList.forEach((desc, i) => {
      issues.push({
        issue_id: `${project_no}-i${i + 1}`,
        project_no,
        description: desc,
        date_noted: null,
        status: 'Open',
      });
    });
  }

  return { projects, contractors, projectContractors, variationOrders, progressUpdates, issues };
}

/** Pre-seeded personnel from the CSV color legend */
export const SEEDED_PERSONNEL = [
  { personnel_id: 'p1', name: 'Ar. Alchor Tapayan', title: 'Architect' },
  { personnel_id: 'p2', name: 'Ar. Darwin Gumban', title: 'Architect' },
  { personnel_id: 'p3', name: 'Ar. Kresia Sales', title: 'Architect' },
  { personnel_id: 'p4', name: 'Ar. Timothy Palero', title: 'Architect' },
  { personnel_id: 'p5', name: 'Engr. Neil', title: 'Engineer' },
  { personnel_id: 'p6', name: 'Engr. Hermosa', title: 'Engineer' },
  { personnel_id: 'p7', name: 'Engr. Celo', title: 'Engineer' },
];
