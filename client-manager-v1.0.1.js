/* ============================================================
   client-manager-v1.0.0.js
   INBXIFY Client Manager — T-A Page Clients Tab
   
   Mounts into #client-manager-mount on the T-A template page.
   Reads customer data from .customers-wrapper hidden collection list.
   Field grouping config from window.TA_CONFIG.customerFieldGroups.
   
   Features:
     - Sortable columns (name, status, type, profile)
     - Filter pills by Client Status + Incomplete modifier toggle
     - Inline search
     - Edit modal: all CMS fields in tile groups, pencil-to-edit,
       gold dirty state, per-field cancel, Save / Save & Publish
     - Add Client modal: empty-state variant with create action
     - Console.log payloads (Make webhook wired in v1.1)
   
   v1.0.0 — initial build
   v1.0.1 — fix DOM selector: .customers-wrapper IS the item (not parent)
            map dataset keys to match actual Webflow attribute names
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── Config ──
  var CFG = {
    get mountId()    { return 'client-manager-mount'; },
    get webhookUrl() { return window.TA_CONFIG?.clientManagerWebhook || ''; },
    get titleSlug()  { return window.TA_CONFIG?.titleSlug || ''; },
    get taItemId()   { return window.TA_CONFIG?.taItemId || ''; }
  };

  var mount = document.getElementById(CFG.mountId);
  if (!mount) { console.warn('[CLIENT MGR] No #' + CFG.mountId + ' found'); return; }

  // ── Default field groups ──
  var DEFAULT_GROUPS = [
    { id: 'identity', label: 'Identity', fields: [
      { s: 'name', l: 'Customer Name', t: 'text' },
      { s: 'slug', l: 'Slug', t: 'text' },
      { s: 'customer-short-code', l: 'Short Code', t: 'text' },
      { s: 'logo-initials', l: 'Logo Initials', t: 'text' },
      { s: 'logo-image', l: 'Logo Image', t: 'image' },
      { s: 'logo-link', l: 'Logo Link', t: 'link' },
      { s: 'profile-page-image', l: 'Profile Page Image', t: 'image' }
    ]},
    { id: 'classification', label: 'Classification', fields: [
      { s: 'customer-type', l: 'Customer Type', t: 'option', opts: ['Advertiser', 'Contributor', 'Sponsor', 'Vendor'] },
      { s: 'client-status', l: 'Client Status', t: 'option', opts: ['Active', 'Paused', 'Prospect', 'Inactive'] },
      { s: 'expert-contributor', l: 'Expert Contributor', t: 'switch' },
      { s: 'hide-from-directory', l: 'Hide from Directory', t: 'switch' },
      { s: 'featured-listing', l: 'Featured Listing', t: 'switch' }
    ]},
    { id: 'relationships', label: 'Relationships', fields: [
      { s: 'publisher', l: 'Publisher', t: 'ref' },
      { s: 'titles-admin', l: 'Titles-Admin', t: 'multi-ref' },
      { s: 'directories', l: 'Directories', t: 'multi-ref' },
      { s: 'directory-tags', l: 'Directory Tags', t: 'multi-ref' },
      { s: 'major-category', l: 'Major Category', t: 'ref' },
      { s: 'business-category', l: 'Business Category', t: 'ref' },
      { s: 'filtering-categories', l: 'Filtering Categories', t: 'multi-ref' },
      { s: 'parent-category-name', l: 'Parent Category Name', t: 'text' },
      { s: 'parent-category-id', l: 'Parent Category ID', t: 'text' }
    ]},
    { id: 'location', label: 'Location & contact', fields: [
      { s: 'address', l: 'Address', t: 'text' },
      { s: 'address-2', l: 'Address 2', t: 'text' },
      { s: 'city-st-zip', l: 'City, ST Zip', t: 'text' },
      { s: 'neighborhood', l: 'Neighborhood', t: 'text' },
      { s: 'business-website', l: 'Business Website', t: 'link' },
      { s: 'business-phone', l: 'Business Phone', t: 'phone' },
      { s: 'business-email', l: 'Business Email', t: 'email' }
    ]},
    { id: 'social', label: 'Social', fields: [
      { s: 'facebook', l: 'Facebook', t: 'link' },
      { s: 'instagram', l: 'Instagram', t: 'link' },
      { s: 'tiktok', l: 'TikTok', t: 'link' },
      { s: 'youtube', l: 'YouTube', t: 'link' },
      { s: 'linkedin', l: 'LinkedIn', t: 'link' },
      { s: 'x', l: 'X', t: 'link' },
      { s: 'pinterest', l: 'Pinterest', t: 'link' },
      { s: 'houzz', l: 'Houzz', t: 'link' }
    ]},
    { id: 'content', label: 'Content & services', fields: [
      { s: 'tagline', l: 'Tagline', t: 'text' },
      { s: 'long-description', l: 'Long Description', t: 'textarea' },
      { s: 'services', l: 'Services (comma-sep)', t: 'text' },
      { s: 'txa-services-1', l: 'TXA Services 1', t: 'text' },
      { s: 'txa-services-2', l: 'TXA Services 2', t: 'text' },
      { s: 'txa-services-3', l: 'TXA Services 3', t: 'text' },
      { s: 'txa-services-4', l: 'TXA Services 4', t: 'text' },
      { s: 'txa-services-5', l: 'TXA Services 5', t: 'text' },
      { s: 'txa-services-6', l: 'TXA Services 6', t: 'text' }
    ]},
    { id: 'ads', label: 'Default ads', fields: [
      { s: 'default-art-ad-get', l: 'Default ART AD', t: 'link' },
      { s: 'default-sponsorship-ad-link-ulc', l: 'Default Sponsorship AD', t: 'link' }
    ]},
    { id: 'system', label: 'System', fields: [
      { s: 'profile-status', l: 'Profile Status', t: 'option', opts: ['Complete', 'Incomplete', 'New'] },
      { s: 'self-this-item-id', l: '(Self) This Item ID', t: 'text' }
    ]}
  ];

  var GROUPS = window.TA_CONFIG?.customerFieldGroups || DEFAULT_GROUPS;

  // Build flat field list for total count
  var ALL_FIELDS = [];
  GROUPS.forEach(function (g) { g.fields.forEach(function (f) { ALL_FIELDS.push(f); }); });
  var TOTAL_FIELDS = ALL_FIELDS.length;

  // ── Read DOM data ──
  // Each .customers-wrapper div IS a customer item with data-* attributes
  // Webflow attribute names (camelCase in dataset):
  //   id, name, phone, email, website, facebook, instagram, tiktok,
  //   youtube, linkedin, xTwitter, pinterest, houzz, paidAdUrl,
  //   categoryId, publisherId, customerType, clientStatus, profileStatus
  var ATTR_MAP = {
    'name': 'name',
    'customer-type': 'customerType',
    'client-status': 'clientStatus',
    'profile-status': 'profileStatus',
    'business-phone': 'phone',
    'business-email': 'email',
    'business-website': 'website',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
    'linkedin': 'linkedin',
    'x': 'xTwitter',
    'pinterest': 'pinterest',
    'houzz': 'houzz',
    'default-art-ad-get': 'paidAdUrl',
    'category-id': 'categoryId',
    'publisher-id': 'publisherId'
  };

  var CUSTOMERS = [];
  document.querySelectorAll('.customers-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return; // skip empty/non-item elements
    var rec = { id: d.id };
    ALL_FIELDS.forEach(function (f) {
      var key = f.s;
      // Check explicit map first, then try camelCase conversion
      var attrName = ATTR_MAP[key] || camelCase(key);
      var attr = d[attrName];
      if (f.t === 'switch') {
        rec[key] = attr === 'true' || attr === '1';
      } else {
        rec[key] = attr || '';
      }
    });
    CUSTOMERS.push(rec);
  });

  // ── State ──
  var FILTER = 'all';
  var SEARCH = '';
  var SORT_COL = 'name';
  var SORT_DIR = 1;
  var MOD_INCOMPLETE = false;
  var SELECTED = {};
  var MODAL = null;       // { mode:'edit'|'add', custId:string, orig:{}, edit:{}, editing:{} }

  // ── Utilities ──
  function camelCase(s) {
    return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function truncUrl(u) {
    var p = String(u).replace(/^https?:\/\//, '');
    return p.length > 32 ? p.substring(0, 29) + '...' : p;
  }
  function initials(name) {
    return String(name).split(/\s+/).map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }
  function filledCount(rec) {
    var n = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = rec[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) n++;
    });
    return n;
  }
  function profileStatus(rec) {
    var ps = rec['profile-status'] || rec['client-status'] || '';
    return ps.toLowerCase();
  }
  function statusOrder(s) { return s === 'active' ? 0 : s === 'paused' ? 1 : s === 'prospect' ? 2 : s === 'inactive' ? 3 : 4; }
  function typeOrder(s) { var v = String(s).toLowerCase(); return v === 'advertiser' ? 0 : v === 'sponsor' ? 1 : v === 'contributor' ? 2 : 3; }
  function profOrder(s) { return s === 'complete' ? 0 : 1; }

  var AVATAR_COLORS = ['#2d6a4f', '#6b2fa0', '#1a5276', '#8a6400', '#7a3b1e', '#1a5e8a', '#c07010', '#993556', '#5f5e5a', '#639922'];
  function avatarColor(id) {
    var n = 0; for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return AVATAR_COLORS[n % AVATAR_COLORS.length];
  }

  // ── Filtering & sorting ──
  function getVisible() {
    var list = CUSTOMERS.filter(function (c) {
      if (SEARCH && c.name.toLowerCase().indexOf(SEARCH.toLowerCase()) < 0) return false;
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      if (MOD_INCOMPLETE) {
        var ps = (c['profile-status'] || '').toLowerCase();
        if (ps !== 'incomplete' && ps !== 'new' && ps !== '') return true; // show if NOT complete
        if (ps === 'complete') return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var va, vb;
      if (SORT_COL === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
        return va < vb ? -SORT_DIR : va > vb ? SORT_DIR : 0;
      }
      if (SORT_COL === 'status') {
        va = statusOrder((a['client-status'] || '').toLowerCase());
        vb = statusOrder((b['client-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'type') {
        va = typeOrder(a['customer-type']); vb = typeOrder(b['customer-type']);
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'profile') {
        va = profOrder((a['profile-status'] || '').toLowerCase());
        vb = profOrder((b['profile-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      return 0;
    });
    return list;
  }

  function incompleteCount() {
    return CUSTOMERS.filter(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      var ps = (c['profile-status'] || '').toLowerCase();
      return ps !== 'complete';
    }).length;
  }

  function selCount() {
    var n = 0; for (var k in SELECTED) if (SELECTED[k]) n++; return n;
  }

  // ── Inject CSS ──
  var style = document.createElement('style');
  style.textContent = getCss();
  document.head.appendChild(style);

  // ── Render ──
  function render() {
    if (MODAL) { renderModal(); return; }
    var vis = getVisible();
    var counts = countByStatus();
    var ic = incompleteCount();
    var sc = selCount();

    var h = '';

    // Header
    h += '<div class="cm-hdr"><div class="cm-hdr-l">';
    h += '<div class="cm-ic">&#x1F465;</div>';
    h += '<div><div class="cm-ti">Clients</div>';
    h += '<div class="cm-su">ADVERTISERS &middot; CONTRIBUTORS &middot; SPONSORS</div></div>';
    h += '</div>';
    h += '<button class="cm-add-btn" onclick="cmAddClient()">+ Add Client</button>';
    h += '</div>';

    // Filter pills
    h += '<div class="cm-tb">';
    h += pill('all', 'All ' + CUSTOMERS.length, FILTER === 'all', 'on');
    h += pill('active', 'Active ' + counts.active, FILTER === 'active', 'gn');
    h += pill('prospect', 'Prospect ' + counts.prospect, FILTER === 'prospect', 'bl');
    h += pill('paused', 'Paused ' + counts.paused, FILTER === 'paused', 'am');
    h += pill('inactive', 'Inactive ' + counts.inactive, FILTER === 'inactive', 'rd');
    h += '<div class="cm-sp"></div>';
    h += '<input class="cm-sr" type="text" placeholder="Search\u2026" value="' + esc(SEARCH) + '" oninput="cmSearch(this.value)">';
    h += '</div>';

    // Modifier row
    h += '<div class="cm-mr"><label class="cm-mt' + (MOD_INCOMPLETE ? ' ac' : '') + '" onclick="cmToggleMod()">';
    h += '<input type="checkbox" class="cm-mc" ' + (MOD_INCOMPLETE ? 'checked' : '') + ' onclick="event.stopPropagation();cmToggleMod()">';
    h += '<span class="cm-ml">Incomplete profiles only</span>';
    h += '<span class="cm-mn">' + ic + '</span></label></div>';

    // Selection bar
    if (sc > 0) {
      h += '<div class="cm-sb"><span class="cm-sn">' + sc + ' selected</span>';
      h += '<div class="cm-ss"></div>';
      h += '<button class="cm-sd" onclick="cmClearSel()">\u2715 clear</button></div>';
    }

    // Table
    h += '<div class="cm-tw"><table class="cm-tbl"><thead><tr>';
    h += '<th class="cm-c0"><input type="checkbox" class="cm-ck" onclick="cmToggleAll()" ' + (vis.length > 0 && vis.every(function (c) { return SELECTED[c.id]; }) ? 'checked' : '') + '></th>';
    h += sortTh('name', 'Client name');
    h += sortTh('status', 'Status', '105px');
    h += sortTh('type', 'Type', '105px');
    h += sortTh('profile', 'Profile', '105px');
    h += '<th class="cm-c5"></th>';
    h += '</tr></thead><tbody>';

    if (!vis.length) {
      h += '<tr class="cm-er"><td colspan="6">No clients match</td></tr>';
    } else {
      vis.forEach(function (c) {
        var st = (c['client-status'] || '').toLowerCase();
        var tp = (c['customer-type'] || '').toLowerCase();
        var ps = (c['profile-status'] || '').toLowerCase();
        var fc = filledCount(c);
        var pct = Math.round(fc / TOTAL_FIELDS * 100);
        var sel = SELECTED[c.id];
        var stCls = st === 'active' ? 'sa' : st === 'paused' ? 'sps' : st === 'prospect' ? 'spr' : 'si';
        var tpCls = tp === 'advertiser' ? 'ta2' : tp === 'sponsor' ? 'ts2' : 'tc2';
        var pfDot = ps === 'complete' ? 'do' : 'dw';
        var pfLbl = ps === 'complete' ? 'Complete' : ps || 'Incomplete';

        h += '<tr class="' + (sel ? 'cm-sl' : '') + '" onclick="cmToggleSel(\'' + c.id + '\')">';
        h += '<td class="cm-t0"><input type="checkbox" class="cm-ck" ' + (sel ? 'checked' : '') + ' onclick="event.stopPropagation();cmToggleSel(\'' + c.id + '\')"></td>';
        h += '<td><div class="cm-cn">' + esc(c.name) + '</div>';
        h += '<div class="cm-cc">' + esc(c['business-category'] || c['major-category'] || c['customer-type'] || '') + ' &middot; ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)</div></td>';
        h += '<td><span class="cm-pill ' + stCls + '">' + esc(st || 'none') + '</span></td>';
        h += '<td><span class="cm-pill ' + tpCls + '">' + esc(tp || 'none') + '</span></td>';
        h += '<td><span class="cm-pd"><span class="cm-dt ' + pfDot + '"></span>' + esc(pfLbl) + '</span></td>';
        h += '<td><button class="cm-eb" onclick="event.stopPropagation();cmEdit(\'' + c.id + '\')">Edit</button></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div>';
    mount.innerHTML = h;
  }

  function pill(key, label, active, cls) {
    return '<button class="cm-fp' + (active ? ' ' + cls : '') + '" onclick="cmSetFilter(\'' + key + '\')">' + label + '</button>';
  }

  function sortTh(col, label, w) {
    var isSorted = SORT_COL === col;
    var arrow = isSorted ? (SORT_DIR === 1 ? '\u25B2' : '\u25BC') : '\u25B2';
    var cls = isSorted ? ' cm-so' : '';
    var style = w ? ' style="width:' + w + '"' : '';
    return '<th class="cm-th' + cls + '"' + style + ' onclick="cmSort(\'' + col + '\')">' + label + ' <span class="cm-ar">' + arrow + '</span></th>';
  }

  function countByStatus() {
    var r = { active: 0, prospect: 0, paused: 0, inactive: 0 };
    CUSTOMERS.forEach(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (r[st] !== undefined) r[st]++;
    });
    return r;
  }

  // ── Modal rendering ──
  function renderModal() {
    var M = MODAL;
    var isAdd = M.mode === 'add';
    var fc = 0;
    var dc = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = M.edit[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) fc++;
      if (M.edit[f.s] !== M.orig[f.s]) dc++;
    });
    var pct = Math.round(fc / TOTAL_FIELDS * 100);
    var ini = isAdd ? '+' : initials(M.edit.name || '??');
    var nameDisplay = isAdd ? 'New Client' : esc(M.edit.name || 'Unnamed');
    var subLine = isAdd ? 'Fill in required fields to create' : esc((M.edit['customer-type'] || '') + ' \u00B7 ' + (M.edit['client-status'] || '') + ' \u00B7 ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)');

    var h = '<div class="cm-ov"><div class="cm-mo">';

    // Modal header
    h += '<div class="cm-mh"><div class="cm-mh-l">';
    h += '<div class="cm-mh-av" style="background:' + (isAdd ? '#c4a35a' : avatarColor(M.custId)) + '">' + ini + '</div>';
    h += '<div><div class="cm-mh-n">' + nameDisplay + '</div>';
    h += '<div class="cm-mh-s">' + subLine + '</div></div>';
    h += '</div>';
    h += '<button class="cm-mx" onclick="cmCloseModal()">\u2715 close</button></div>';

    // Modal body
    h += '<div class="cm-mb">';

    GROUPS.forEach(function (g) {
      var gf = g.fields.length;
      var gfilled = g.fields.filter(function (f) {
        var v = M.edit[f.s]; return v !== '' && v !== false && v !== undefined && v !== null;
      }).length;

      h += '<div class="cm-gp"><div class="cm-gh">';
      h += '<span class="cm-gh-t">' + g.label + '</span>';
      h += '<span class="cm-gh-c">' + gfilled + '/' + gf + '</span></div>';
      h += '<div class="cm-gr">';

      g.fields.forEach(function (f) {
        var val = M.edit[f.s];
        var origVal = M.orig[f.s];
        var hasVal = val !== '' && val !== false && val !== undefined && val !== null;
        var isDirty = val !== origVal;
        var isEditing = M.editing[f.s] || false;
        var dot = hasVal ? 'cm-gi-ok' : 'cm-gi-mt';

        h += '<div class="cm-gi' + (isDirty ? ' cm-dirty' : '') + '">';
        h += '<div class="cm-gi-d ' + dot + '"></div>';
        h += '<span class="cm-gi-l">' + f.l + '</span>';

        if (isEditing) {
          h += '<div class="cm-gi-e">';
          if (f.t === 'option') {
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)">';
            h += '<option value="">-- select --</option>';
            (f.opts || []).forEach(function (o) {
              h += '<option value="' + esc(o) + '"' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>';
            });
            h += '</select>';
          } else if (f.t === 'switch') {
            h += '<div class="cm-esw"><input type="checkbox" ' + (val ? 'checked' : '') + ' onchange="cmSetVal(\'' + esc(f.s) + '\',this.checked)">';
            h += '<span>' + (val ? 'On' : 'Off') + '</span></div>';
          } else if (f.t === 'textarea') {
            h += '<textarea class="cm-ei" rows="2" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value)">' + esc(val) + '</textarea>';
          } else {
            var ph = f.t === 'link' ? 'https://...' : f.t === 'email' ? 'email@...' : f.t === 'phone' ? '(201) 555-...' : 'Enter value...';
            h += '<input class="cm-ei" type="text" value="' + esc(val) + '" placeholder="' + ph + '" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value)">';
          }
          h += '</div>';
          h += '<div class="cm-gi-act">';
          if (isDirty) h += '<button class="cm-cancel-lk" onclick="cmRevertField(\'' + esc(f.s) + '\')">cancel</button>';
          h += '<button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Close">' + penSvg('#1a3a3a') + '</button>';
          h += '</div>';
        } else {
          if (hasVal) {
            h += '<div class="cm-gi-v">';
            if (f.t === 'switch') {
              h += val ? 'On' : 'Off';
            } else if ((f.t === 'link' || f.t === 'email') && val) {
              h += '<a href="' + esc(val) + '" target="_blank" onclick="event.stopPropagation()">' + truncUrl(val) + '</a>';
            } else if (f.t === 'image' && val) {
              h += '<span class="cm-img-tag">' + esc(val) + '</span>';
            } else {
              h += esc(String(val));
            }
            h += '</div>';
          } else {
            h += '<div class="cm-gi-v cm-empty">empty</div>';
          }
          h += '<div class="cm-gi-act"><button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Edit">' + penSvg('#8a8a7a') + '</button></div>';
        }
        h += '</div>';
      });
      h += '</div></div>';
    });

    h += '</div>';

    // Modal footer
    h += '<div class="cm-mf"><div class="cm-mf-l">';
    h += '<span class="cm-mf-i">' + fc + ' of ' + TOTAL_FIELDS + ' fields populated</span>';
    if (dc > 0) {
      h += '<span class="cm-mf-dc">' + dc + ' unsaved change' + (dc > 1 ? 's' : '') + '</span>';
      h += '<button class="cm-mf-ca" onclick="cmCancelAll()">\u2715 cancel all edits</button>';
    }
    h += '</div><div class="cm-mf-r">';
    if (isAdd) {
      h += '<button class="cm-mf-sv"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoCreate()">Create Client</button>';
    } else {
      h += '<button class="cm-mf-sv"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(false)">Save</button>';
      h += '<button class="cm-mf-pub"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(true)">Save &amp; Publish</button>';
    }
    h += '</div></div>';

    h += '</div></div>';
    mount.innerHTML = h;
  }

  function penSvg(color) {
    return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z"/><path d="M9.5 3.5l3 3"/></svg>';
  }

  // ── Global actions (attached to window for onclick) ──
  window.cmSetFilter = function (f) { FILTER = f; render(); };
  window.cmSearch = function (v) { SEARCH = v; render(); };
  window.cmToggleMod = function () { MOD_INCOMPLETE = !MOD_INCOMPLETE; render(); };
  window.cmSort = function (col) {
    if (SORT_COL === col) SORT_DIR = -SORT_DIR;
    else { SORT_COL = col; SORT_DIR = 1; }
    render();
  };
  window.cmToggleSel = function (id) { SELECTED[id] = !SELECTED[id]; render(); };
  window.cmToggleAll = function () {
    var vis = getVisible();
    var allOn = vis.every(function (c) { return SELECTED[c.id]; });
    vis.forEach(function (c) { SELECTED[c.id] = !allOn; });
    render();
  };
  window.cmClearSel = function () { SELECTED = {}; render(); };

  // Edit modal
  window.cmEdit = function (id) {
    var c = CUSTOMERS.find(function (x) { return x.id === id; });
    if (!c) return;
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) { orig[f.s] = c[f.s]; edit[f.s] = c[f.s]; });
    MODAL = { mode: 'edit', custId: id, orig: orig, edit: edit, editing: {} };
    render();
  };

  // Add modal
  window.cmAddClient = function () {
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) {
      var def = f.t === 'switch' ? false : '';
      orig[f.s] = def;
      edit[f.s] = def;
    });
    MODAL = { mode: 'add', custId: 'new-' + Date.now(), orig: orig, edit: edit, editing: {} };
    render();
  };

  window.cmCloseModal = function () { MODAL = null; render(); };

  window.cmToggleEdit = function (slug) {
    MODAL.editing[slug] = !MODAL.editing[slug];
    renderModal();
  };

  window.cmSetVal = function (slug, val) {
    MODAL.edit[slug] = val;
    renderModal();
  };

  window.cmRevertField = function (slug) {
    MODAL.edit[slug] = MODAL.orig[slug];
    MODAL.editing[slug] = false;
    renderModal();
  };

  window.cmCancelAll = function () {
    ALL_FIELDS.forEach(function (f) { MODAL.edit[f.s] = MODAL.orig[f.s]; });
    MODAL.editing = {};
    renderModal();
  };

  window.cmDoSave = function (publish) {
    var changes = {};
    ALL_FIELDS.forEach(function (f) {
      if (MODAL.edit[f.s] !== MODAL.orig[f.s]) changes[f.s] = MODAL.edit[f.s];
    });
    if (Object.keys(changes).length === 0) return;

    var payload = {
      action: 'update',
      titleSlug: CFG.titleSlug,
      customerId: MODAL.custId,
      publish: !!publish,
      fields: changes
    };

    console.log('[CLIENT MGR] Save payload:', payload);

    // Update in-memory data
    var c = CUSTOMERS.find(function (x) { return x.id === MODAL.custId; });
    if (c) {
      for (var k in changes) c[k] = changes[k];
    }

    // Update orig to match
    for (var k in changes) MODAL.orig[k] = changes[k];
    MODAL.editing = {};
    renderModal();

    // TODO: Replace console.log with Make webhook call
    // var qs = new URLSearchParams(payload);
    // fetch(CFG.webhookUrl + '?' + qs.toString(), { method: 'GET', mode: 'no-cors' });
  };

  window.cmDoCreate = function () {
    var fields = {};
    ALL_FIELDS.forEach(function (f) {
      if (MODAL.edit[f.s] !== '' && MODAL.edit[f.s] !== false) {
        fields[f.s] = MODAL.edit[f.s];
      }
    });

    if (!fields.name) {
      alert('Customer Name is required');
      return;
    }

    var payload = {
      action: 'create',
      titleSlug: CFG.titleSlug,
      publish: false,
      fields: fields
    };

    console.log('[CLIENT MGR] Create payload:', payload);

    // Add to in-memory array
    var newRec = {};
    newRec.id = 'temp-' + Date.now();
    ALL_FIELDS.forEach(function (f) { newRec[f.s] = MODAL.edit[f.s]; });
    CUSTOMERS.push(newRec);

    MODAL = null;
    render();

    // TODO: Replace console.log with Make webhook call
  };

  // ── CSS ──
  function getCss() {
    return [
      '.cm-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;border-bottom:2px solid #1a3a3a;padding-bottom:12px}',
      '.cm-hdr-l{display:flex;align-items:center;gap:10px}',
      '.cm-ic{width:34px;height:34px;background:#1a3a3a;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#c4a35a}',
      '.cm-ti{font-size:18px;font-weight:700;color:#1a3a3a}',
      '.cm-su{font-size:10px;font-family:"DM Mono",monospace;color:#8a8a7a;letter-spacing:.04em;text-transform:uppercase;margin-top:1px}',
      '.cm-add-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 14px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer;transition:all .15s}',
      '.cm-add-btn:hover{background:#1a3a3a;color:#f0edd8}',

      '.cm-tb{display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap}',
      '.cm-fp{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:5px 12px;border-radius:3px;border:1.5px solid #e0ddd0;background:transparent;color:#5a6a5a;cursor:pointer;transition:all .15s}',
      '.cm-fp:hover{border-color:#c4a35a}',
      '.cm-fp.on{background:#1a3a3a;color:#fff;border-color:transparent}',
      '.cm-fp.gn{background:#1e7e4a;color:#fff;border-color:transparent}',
      '.cm-fp.bl{background:#1a5276;color:#fff;border-color:transparent}',
      '.cm-fp.am{background:#c07010;color:#fff;border-color:transparent}',
      '.cm-fp.rd{background:#c0392b;color:#fff;border-color:transparent}',
      '.cm-sp{flex:1}',
      '.cm-sr{font-family:"DM Sans",sans-serif;font-size:12px;padding:5px 10px 5px 28px;border:1.5px solid #d8d4c4;border-radius:3px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'5.5\' cy=\'5.5\' r=\'4\'/%3E%3Cline x1=\'8.5\' y1=\'8.5\' x2=\'12\' y2=\'12\'/%3E%3C/svg%3E") no-repeat 8px center;color:#1a3a3a;outline:none;width:200px}',
      '.cm-sr:focus{border-color:#1a3a3a}',

      '.cm-mr{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 2px}',
      '.cm-mt{display:inline-flex;align-items:center;gap:6px;cursor:pointer;-webkit-user-select:none;user-select:none}',
      '.cm-mc{width:14px;height:14px;accent-color:#c07010;cursor:pointer}',
      '.cm-ml{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;color:#5a6a5a}',
      '.cm-mt.ac .cm-ml{color:#c07010;font-weight:600}',
      '.cm-mn{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;background:#f0ede4;padding:1px 6px;border-radius:2px}',
      '.cm-mt.ac .cm-mn{background:#fdf6e8;color:#c07010}',

      '.cm-sb{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#1a3a3a;color:#f0edd8;border-radius:6px;margin-bottom:10px;font-size:12px}',
      '.cm-sn{font-family:"DM Mono",monospace;font-size:11px;font-weight:600}',
      '.cm-ss{flex:1}',
      '.cm-sd{border:none;opacity:.7;font-size:10px;cursor:pointer;background:none;color:#f0edd8;font-family:"DM Mono",monospace}',
      '.cm-sd:hover{opacity:1}',

      '.cm-tw{border:1.5px solid #e0ddd0;border-radius:5px;overflow:hidden;background:#fff}',
      '.cm-tbl{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.cm-tbl thead th{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;background:#f6f4ee;padding:9px 12px;text-align:left;border-bottom:1.5px solid #e0ddd0;cursor:pointer;-webkit-user-select:none;user-select:none;white-space:nowrap;transition:color .12s}',
      '.cm-tbl thead th:hover{color:#1a3a3a}',
      '.cm-th.cm-so{color:#1a3a3a;font-weight:600}',
      '.cm-ar{font-size:9px;margin-left:3px;opacity:.5}',
      '.cm-so .cm-ar{opacity:1}',
      '.cm-c0{width:36px;cursor:default!important}',
      '.cm-c5{width:70px;cursor:default!important}',
      '.cm-tbl tbody tr{border-bottom:1px solid #f0ede4;transition:background .1s}',
      '.cm-tbl tbody tr:last-child{border-bottom:none}',
      '.cm-tbl tbody tr:hover{background:#fdfcf8}',
      '.cm-tbl tbody tr.cm-sl{background:#faf5e8}',
      '.cm-tbl td{padding:9px 12px;font-size:12px;vertical-align:middle}',
      '.cm-ck{width:15px;height:15px;accent-color:#1a3a3a;cursor:pointer}',
      '.cm-cn{font-weight:600;color:#1a3a3a}',
      '.cm-cc{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090;margin-top:1px}',
      '.cm-pill{font-family:"DM Mono",monospace;font-size:9px;padding:3px 9px;border-radius:3px;letter-spacing:.03em;display:inline-block;white-space:nowrap}',
      '.cm-pill.sa{background:#e8f5e9;color:#1e7e4a;border:1px solid #c8e6c9}',
      '.cm-pill.sps{background:#fdf6e8;color:#c07010;border:1px solid #f0dbb0}',
      '.cm-pill.spr{background:#eaf2fb;color:#1a5276;border:1px solid #b8d4f0}',
      '.cm-pill.si{background:#fdf0ef;color:#c0392b;border:1px solid #f0c4c0}',
      '.cm-pill.ta2{background:#eef6f1;color:#2d6a4f;border:1px solid #c8e6c9}',
      '.cm-pill.tc2{background:#f3eefb;color:#6b2fa0;border:1px solid #d8c8f0}',
      '.cm-pill.ts2{background:#fdf8e8;color:#8a6400;border:1px solid #f0dbb0}',
      '.cm-pd{display:inline-flex;align-items:center;gap:5px;font-family:"DM Mono",monospace;font-size:10px}',
      '.cm-dt{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
      '.cm-dt.do{background:#1e7e4a}',
      '.cm-dt.dw{background:#c07010}',
      '.cm-eb{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:4px 10px;border-radius:3px;border:1.5px solid #e0ddd0;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .12s;white-space:nowrap}',
      '.cm-eb:hover{border-color:#1a3a3a;color:#1a3a3a}',
      '.cm-er td{text-align:center;padding:32px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',

      // Modal
      '.cm-ov{position:fixed;inset:0;background:rgba(26,58,58,0.45);display:flex;align-items:flex-start;justify-content:center;padding:30px 16px;z-index:99999;overflow-y:auto}',
      '.cm-mo{background:#fff;border-radius:6px;width:100%;max-width:760px;overflow:hidden;border:1.5px solid #e0ddd0}',
      '.cm-mh{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid #e0ddd0;background:#f6f4ee}',
      '.cm-mh-l{display:flex;align-items:center;gap:10px}',
      '.cm-mh-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}',
      '.cm-mh-n{font-size:15px;font-weight:700;color:#1a3a3a}',
      '.cm-mh-s{font-size:9px;font-family:"DM Mono",monospace;color:#8a8a7a;margin-top:1px}',
      '.cm-mx{font-family:"DM Mono",monospace;font-size:11px;color:#c0392b;cursor:pointer;background:none;border:none;padding:4px 8px}',
      '.cm-mx:hover{opacity:.7}',
      '.cm-mb{padding:18px;max-height:calc(100vh - 200px);overflow-y:auto}',
      '.cm-gp{margin-bottom:16px}',
      '.cm-gh{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f0ede4}',
      '.cm-gh-t{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;font-weight:600}',
      '.cm-gh-c{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;margin-left:auto}',
      '.cm-gr{display:flex;flex-direction:column;gap:1px}',
      '.cm-gi{display:flex;align-items:center;gap:0;padding:4px 8px;border-radius:3px;min-height:30px;border:1.5px solid transparent;transition:all .12s}',
      '.cm-gi:hover{background:#faf9f5}',
      '.cm-gi.cm-dirty{border-color:#c4a35a;background:#faf5e8}',
      '.cm-gi-d{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-right:8px}',
      '.cm-gi-ok{background:#1e7e4a}',
      '.cm-gi-mt{background:#d0cdc0}',
      '.cm-gi-l{font-size:11px;color:#8a8a7a;width:145px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-gi-v{font-size:11px;color:#1a3a3a;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 6px}',
      '.cm-gi-v.cm-empty{color:#a0a090;font-style:italic}',
      '.cm-gi-v a{color:#1a3a3a;text-decoration:none;font-size:11px}',
      '.cm-gi-v a:hover{text-decoration:underline}',
      '.cm-img-tag{font-family:"DM Mono",monospace;font-size:9px;color:#1a5276;background:#eaf2fb;padding:1px 6px;border-radius:2px}',
      '.cm-gi-e{flex:1;min-width:0;padding:0 4px}',
      '.cm-gi-act{display:flex;align-items:center;gap:4px;flex-shrink:0}',
      '.cm-pen{width:22px;height:22px;border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:3px;transition:background .1s}',
      '.cm-pen:hover{background:#f0ede4}',
      '.cm-cancel-lk{font-family:"DM Mono",monospace;font-size:9px;color:#c0392b;cursor:pointer;background:none;border:none;padding:2px 4px}',
      '.cm-cancel-lk:hover{opacity:.7}',
      '.cm-ei{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%}',
      '.cm-ei:focus{border-color:#1a3a3a}',
      '.cm-esel{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;padding-right:20px}',
      '.cm-esw{display:flex;align-items:center;gap:6px}',
      '.cm-esw input{accent-color:#1a3a3a}',
      '.cm-esw span{font-size:11px;color:#1a3a3a}',

      '.cm-mf{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1.5px solid #e0ddd0;background:#f6f4ee;flex-wrap:wrap;gap:8px}',
      '.cm-mf-l{display:flex;align-items:center;gap:12px}',
      '.cm-mf-i{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
      '.cm-mf-dc{font-family:"DM Mono",monospace;font-size:9px;color:#c4a35a;font-weight:600}',
      '.cm-mf-ca{font-family:"DM Mono",monospace;font-size:10px;color:#c0392b;cursor:pointer;background:none;border:none}',
      '.cm-mf-ca:hover{opacity:.7}',
      '.cm-mf-r{display:flex;align-items:center;gap:8px}',
      '.cm-mf-sv{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;font-weight:600;transition:opacity .12s}',
      '.cm-mf-sv:hover{opacity:.85}',
      '.cm-mf-sv:disabled{opacity:.4;cursor:not-allowed}',
      '.cm-mf-pub{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#1a3a3a;color:#f0edd8;cursor:pointer;transition:opacity .12s}',
      '.cm-mf-pub:hover{background:#244a4a}',
      '.cm-mf-pub:disabled{opacity:.4;cursor:not-allowed}'
    ].join('\n');
  }

  // ── Init ──
  render();
  console.log('\u{1F465} Client Manager v1.0.1 mounted — ' + CUSTOMERS.length + ' customers loaded');
});
