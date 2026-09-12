const clean = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function renderInbox({state, icon, link, button}) {
  return `<div class="li-scene" data-inbox-scene>
    <header class="li-heading"><h1>Add your commitments</h1><p>Bring in a syllabus, shifts or a note. Review the details before anything is added.</p></header>
    <section class="li-start" aria-labelledby="li-start-title">
      <div class="li-sample-label">${icon('file')}<span>Sample syllabus</span></div>
      <h2 id="li-start-title">Start with a course report.</h2>
      <p>See how a deadline becomes a plan, using a ready-made example.</p>
      <div class="li-file-preview"><span class="li-file-icon">${icon('file')}</span><div><strong>CS201 syllabus.pdf</strong><span>Course report due Friday, 18 September</span></div><span class="li-sample-chip">Sample</span></div>
      ${link('review','Try a sample syllabus','button primary li-main-action','arrow')}
      <p class="li-sample-note">Uses fictional data. No account or upload needed.</p>
    </section>
    <details class="li-disclosure" ${state.note||state.uploaded.length?'open':''}>
      <summary><span>Use my own file or note</span>${icon('chevron')}</summary>
      <div class="li-own-inputs">
        <div class="li-attach-row"><div><h3>Attach a file</h3><p>Only the filename is kept for this session. File contents are not read in this prototype.</p></div>${button('attach','Choose file','button ghost','plus')}<input id="local-file" type="file" accept=".pdf,.ics,.csv,.txt,image/*" hidden></div>
        ${state.uploaded.length?`<ul class="li-local-files" aria-label="Locally attached files">${state.uploaded.map(name=>`<li>${icon('file')}<span>${clean(name)}</span><small>Not parsed</small></li>`).join('')}</ul>`:''}
        <div class="li-note-input"><label for="life-note">Or write a note</label><textarea id="life-note" placeholder="Committee outreach by Friday. Groceries on Saturday…">${clean(state.note)}</textarea><div class="li-note-actions"><span>Your note stays in this browser session.</span>${button('review-note','Save note locally','button ghost','check')}</div></div>
      </div>
    </details>
    <details class="li-disclosure li-other-examples"><summary><span>Other examples</span>${icon('chevron')}</summary><div class="li-example-options">${button('sample-calendar','View a sample calendar','button ghost','calendar')}${button('sample-roster','View a sample shift roster','button ghost','clock')}</div></details>
    <p class="li-privacy-note">${icon('shield')}Live calendar connections and AI file reading are planned features. This prototype sends nothing to external services.</p>
  </div>`;
}

export function renderReview({icon, button}) {
  return `<div class="ir-scene" data-review-scene>
    <a class="ir-back" href="#inbox">${icon('arrow')}Back to commitments</a>
    <header class="ir-heading"><h1>Check these details</h1><p>Confirm the deadline and how much work you expect. Then add the sample to your week.</p></header>
    <section class="ir-review-card" aria-labelledby="ir-task-title">
      <div class="ir-task-heading"><div><span class="ir-sample-label">Sample syllabus</span><h2 id="ir-task-title">CS201 course report</h2></div><span class="ir-status">Needs review</span></div>
      <div class="ir-source-excerpt"><span>${icon('file')}CS201 syllabus.pdf · page 3</span><blockquote>“Course report due Friday, 18 September. Submit via the course portal.”</blockquote></div>
      <div class="ir-date"><span>Due date</span><strong>Friday, 18 September 2026</strong></div>
      <div class="ir-fields">
        <label class="ir-field" for="deadline-time"><span>Submission time</span><input id="deadline-time" type="time" value="12:00" required aria-describedby="ir-time-help"><small id="ir-time-help">The source has no time. Please confirm it.</small></label>
        <label class="ir-field" for="effort"><span>Estimated work</span><select id="effort" aria-describedby="ir-effort-help"><option value="6">6 hours</option><option value="4">4 hours</option><option value="8">8 hours</option></select><small id="ir-effort-help">A planning estimate, not a fact from the syllabus.</small></label>
      </div>
      <label class="ir-approval"><input id="review-check" type="checkbox"><span>I checked these details against the source.</span></label>
      <div class="ir-confirm">${button('confirm-import','Add to my week','button primary wide','arrow')}</div>
      <p class="ir-demo-note">The sample week uses 6 hours due Friday at 12 PM. Other choices won’t change the sample without another confirmation.</p>
    </section>
  </div>`;
}

export function mountInboxScenes() {
  const review = document.querySelector('[data-review-scene]');
  if (!review) return;
  const approval = review.querySelector('#review-check');
  const confirm = review.querySelector('[data-action="confirm-import"]');
  const updateApproval = () => {
    confirm.disabled = !approval.checked;
    review.querySelector('.ir-status').textContent = approval.checked?'Ready to add':'Needs review';
    review.classList.toggle('ir-approved', approval.checked);
  };
  updateApproval();
  approval.addEventListener('change', updateApproval);
}
