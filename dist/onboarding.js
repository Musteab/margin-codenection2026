const key = 'margin-intro-v1';
let seen = false;
let guiding = false;
let returnTo = 'week';
try { seen = localStorage.getItem(key) === 'seen'; } catch {}

function remember() {
  seen = true;
  try { localStorage.setItem(key, 'seen'); } catch {}
}

export function welcomeRoute(route) {
  if (!seen && route !== 'home' && route !== 'start') {
    returnTo = route;
    history.replaceState(null, '', '#start');
    return 'start';
  }
  return route;
}

export function renderWelcome(c) {
  return `<section class="welcome-scene"><div class="welcome-copy"><span class="welcome-label">A LITTLE LESS TO CARRY</span><h1>Your life, together.<br><em>With room to breathe.</em></h1><p class="welcome-description">Bring your deadlines, shifts and everyday plans into one calendar. When there’s too much, Margin helps you decide what can move.</p><ol class="welcome-steps"><li><span>1</span><div><strong>Add what’s on your plate</strong><p>A syllabus, a work roster, even a messy note.</p></div></li><li><span>2</span><div><strong>See what actually fits</strong><p>Preparation time counts. So do breaks.</p></div></li><li><span>3</span><div><strong>Choose a lighter plan</strong><p>Review suggestions. Nothing changes without you.</p></div></li></ol><div class="welcome-buttons">${c.button('start-guide','Show me with a sample','button primary','arrow')}${c.button('skip-intro','Explore on my own','text-button')}</div><p class="welcome-note">About a minute. No sign-up or files needed.</p></div><aside class="welcome-example" aria-label="An example of how Margin helps"><span class="welcome-example-label">HERE’S THE IDEA</span><div class="welcome-note-card"><span>Before Friday</span><h2>Too much to fit.</h2><div class="welcome-example-hours"><strong>10h <small>of work</small></strong><span>in</span><strong>8h <small>of free time</small></strong></div></div><div class="welcome-example-arrow">${c.icon('arrow')}</div><div class="welcome-note-card lighter"><span>One small adjustment</span><h2>Groceries can wait<br>until Saturday.</h2><p>Move something flexible.<br>Keep the important stuff.</p></div><p class="welcome-example-foot">You’re trying a fictional student’s week.<br>No accounts connected. No messages sent.</p></aside></section>`;
}

export function renderGuide(c, route) {
  if (!guiding || route === 'start' || route === 'home') return '';
  const s = c.state;
  let step = 1, title = 'Start with a sample syllabus', description = 'Open the sample, then check its deadline and estimated work time.';
  if (route === 'review') { title = 'Check before adding'; description = 'Review the Friday deadline and 6h estimate. Confirm the details to continue.'; }
  else if (route === 'week' || route === 'semester') { step = 2; title = s.confirmed ? 'That’s your lighter week' : 'See what needs your attention'; description = s.confirmed ? 'Your confirmed changes are reflected below. You can come back whenever life changes.' : 'There’s more work than free time. Choose “Find me some room” to see your options.'; }
  else if (route === 'rebalance') { step = 3; title = s.confirmed ? 'You made some room' : s.requested ? 'A request isn’t an agreement yet' : 'Choose what can change'; description = s.confirmed ? (c.margin()>0?'Your plan now has '+c.margin()+'h to spare. Return to your week to see it.':'Your confirmed changes are in the plan. Return to your week to see what fits.') : s.requested ? 'The outreach task still counts. Try confirming a handover to see the difference.' : 'Try moving groceries and asking for help with outreach. You approve each change.'; }
  else if (route !== 'inbox') { title = 'You can explore this later'; description = 'The quick tour starts with a syllabus, your week, then a lighter plan.'; }
  return `<aside class="guide-strip" aria-label="Quick tour"><div class="guide-progress" aria-hidden="true">${[1,2,3].map(n=>`<i class="${n<=step?'filled':''}"></i>`).join('')}</div><div class="guide-copy"><span>QUICK TOUR · ${step} OF 3</span><strong>${title}</strong><p>${description}</p></div><button class="guide-exit" data-action="end-guide">${s.confirmed?'Finish tour':'Exit tour'}</button></aside>`;
}

export function onboardingAction(action, c) {
  if (action === 'start-guide') {
    remember(); guiding = true;
    if (location.hash === '#inbox') c.shell(); else location.hash = 'inbox';
  } else if (action === 'skip-intro') {
    remember(); guiding = false; location.hash = returnTo;
  } else if (action === 'tour') {
    guiding = false;
    if (location.hash === '#start') c.shell(); else location.hash = 'start';
  } else if (action === 'end-guide') {
    remember(); guiding = false; c.shell(); c.toast('Tour closed. Find it again in More → Quick tour.');
  } else return false;
  return true;
}
