(function(){
 /* ============ Greeting + Clock ============ */
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  const greetingTitle = document.getElementById('greetingTitle');
  const greetingSub = document.getElementById('greetingSub');

  const PERIODS = {
    morning:   { label: 'Good morning',   sub: 'Fresh start, fresh list.' },
    afternoon: { label: 'Good afternoon', sub: 'Midday momentum.' },
    evening:   { label: 'Good evening',   sub: 'Wrapping up the day.' },
    night:     { label: 'Still up?',      sub: 'Quiet hours, quiet focus.' }
  };

  function getPeriod(hour){
    if(hour >= 5 && hour < 12) return 'morning';
    if(hour >= 12 && hour < 17) return 'afternoon';
    if(hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  function pad(n){ return String(n).padStart(2,'0'); }

  function tickClock(){
    const now = new Date();
    clockTime.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    clockDate.textContent = now.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });

    const period = getPeriod(now.getHours());
    if(document.documentElement.getAttribute('data-period') !== period){
      document.documentElement.setAttribute('data-period', period);
      greetingTitle.textContent = PERIODS[period].label;
      greetingSub.textContent = PERIODS[period].sub;
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ============ Focus Timer (25 min) ============ */
  const FOCUS_SECONDS = 25 * 60;
  let remaining = FOCUS_SECONDS;
  let timerInterval = null;
  let running = false;

  const timerDisplay = document.getElementById('timerDisplay');
  const timerState = document.getElementById('timerState');
  const timerStart = document.getElementById('timerStart');
  const timerReset = document.getElementById('timerReset');
  const baseTitle = document.title;

  function formatTime(s){
    const m = Math.floor(s/60);
    const sec = s % 60;
    return `${pad(m)}:${pad(sec)}`;
  }

  function renderTimer(){
    timerDisplay.textContent = formatTime(remaining);
    timerDisplay.classList.toggle('running', running);
    if(running){
      timerState.textContent = 'Focusing…';
      document.title = `${formatTime(remaining)} — ${baseTitle}`;
    } else if (remaining === 0){
      timerState.textContent = 'Done';
      document.title = baseTitle;
    } else if (remaining < FOCUS_SECONDS) {
      timerState.textContent = 'Paused';
      document.title = baseTitle;
    } else {
      timerState.textContent = 'Ready';
      document.title = baseTitle;
    }
  }

  function startTimer(){
    if(running || remaining === 0) return;
    running = true;
    timerStart.textContent = 'Pause';
    timerInterval = setInterval(()=>{
      remaining--;
      if(remaining <= 0){
        remaining = 0;
        stopTimer();
      }
      renderTimer();
    }, 1000);
    renderTimer();
  }

  function stopTimer(){
    running = false;
    clearInterval(timerInterval);
    timerStart.textContent = 'Start';
    renderTimer();
  }

  function resetTimer(){
    stopTimer();
    remaining = FOCUS_SECONDS;
    renderTimer();
  }

  timerStart.addEventListener('click', ()=> running ? stopTimer() : startTimer());
  timerReset.addEventListener('click', resetTimer);
  renderTimer();

  /* ============ To-Do List ============ */
  const TASKS_KEY = 'desk_tasks_v1';
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');

  function loadTasks(){
    try{
      const raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function saveTasks(tasks){
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  let tasks = loadTasks();

  function renderTasks(){
    taskList.innerHTML = '';
    if(tasks.length === 0){
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Nothing here yet — add your first task above.';
      taskList.appendChild(empty);
      return;
    }
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'task-check';
      check.checked = task.done;
      check.setAttribute('aria-label', 'Mark task done');
      check.addEventListener('change', ()=>{
        task.done = check.checked;
        saveTasks(tasks);
        renderTasks();
      });

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;
      text.title = 'Double-click to edit';
      text.addEventListener('dblclick', ()=> enterEditMode(li, task));

      const actions = document.createElement('div');
      actions.className = 'task-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn';
      editBtn.setAttribute('aria-label','Edit task');
      editBtn.innerHTML = '✎';
      editBtn.addEventListener('click', ()=> enterEditMode(li, task));

      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn danger';
      delBtn.setAttribute('aria-label','Delete task');
      delBtn.innerHTML = '✕';
      delBtn.addEventListener('click', ()=>{
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks(tasks);
        renderTasks();
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(check);
      li.appendChild(text);
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  }

  function enterEditMode(li, task){
    const existing = li.querySelector('.task-text');
    if(!existing) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = task.text;
    input.maxLength = 200;
    li.replaceChild(input, existing);
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function commit(){
      const val = input.value.trim();
      task.text = val.length ? val : task.text;
      saveTasks(tasks);
      renderTasks();
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ e.preventDefault(); input.blur(); }
      if(e.key === 'Escape'){ e.preventDefault(); renderTasks(); }
    });
  }

  taskForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const val = taskInput.value.trim();
    if(!val) return;
    tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), text: val, done: false });
    saveTasks(tasks);
    taskInput.value = '';
    renderTasks();
  });

  renderTasks();

  /* ============ Quick Links ============ */
  const LINKS_KEY = 'desk_links_v1';
  const linksRow = document.getElementById('linksRow');
  const linkForm = document.getElementById('linkForm');
  const linkNameInput = linkForm.querySelector('input[name="name"]');
  const linkUrlInput = linkForm.querySelector('input[name="url"]');
  const linkSave = document.getElementById('linkSave');
  const linkCancel = document.getElementById('linkCancel');

  function loadLinks(){
    try{
      const raw = localStorage.getItem(LINKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e){ return []; }
  }
  function saveLinks(links){
    localStorage.setItem(LINKS_KEY, JSON.stringify(links));
  }

  let links = loadLinks();

  function normalizeUrl(url){
    if(!/^https?:\/\//i.test(url)) return 'https://' + url;
    return url;
  }

  function renderLinks(){
    linksRow.querySelectorAll('.link-chip').forEach(el => el.remove());
    const addBtn = document.getElementById('addLinkBtn');

    links.forEach(link => {
      const a = document.createElement('a');
      a.className = 'link-chip';
      a.href = normalizeUrl(link.url);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const label = document.createElement('span');
      label.textContent = link.name;
      a.appendChild(label);

      const remove = document.createElement('button');
      remove.className = 'remove';
      remove.innerHTML = '✕';
      remove.setAttribute('aria-label', `Remove ${link.name}`);
      remove.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        links = links.filter(l => l.id !== link.id);
        saveLinks(links);
        renderLinks();
      });
      a.appendChild(remove);

      linksRow.insertBefore(a, addBtn);
    });
  }

  const addLinkBtn = document.createElement('button');
  addLinkBtn.id = 'addLinkBtn';
  addLinkBtn.className = 'add-link-btn';
  addLinkBtn.textContent = '+ Add link';
  addLinkBtn.addEventListener('click', ()=>{
    linkForm.classList.remove('hidden');
    linkNameInput.focus();
  });
  linksRow.appendChild(addLinkBtn);
  renderLinks();

  function closeLinkForm(){
    linkForm.classList.add('hidden');
    linkNameInput.value = '';
    linkUrlInput.value = '';
  }

  linkSave.addEventListener('click', ()=>{
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();
    if(!name || !url) return;
    links.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), name, url });
    saveLinks(links);
    renderLinks();
    closeLinkForm();
  });
  linkCancel.addEventListener('click', closeLinkForm);
  [linkNameInput, linkUrlInput].forEach(inp=>{
    inp.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){ e.preventDefault(); linkSave.click(); }
      if(e.key === 'Escape'){ e.preventDefault(); closeLinkForm(); }
    });
  });

})();