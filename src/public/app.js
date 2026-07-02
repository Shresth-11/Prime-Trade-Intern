// SPA Application State
const state = {
  token: localStorage.getItem('token') || null,
  user: null,
  tasks: [],
  users: [],
  currentFilter: 'all',
  editingTaskId: null,
  layoutMode: localStorage.getItem('layoutMode') || 'grid',
  themeMode: localStorage.getItem('themeMode') || 'light'
};

// ==========================================================================
// TOAST NOTIFICATIONS (Premium glass toasts)
// ==========================================================================
const showToast = (title, message, type = 'info') => {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Close button binding
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  
  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 350);
  }, 4000);
};

// ==========================================================================
// DEV TERMINAL LOG MONITOR
// ==========================================================================
const logApiCall = (method, path, reqBody, status, resBody) => {
  const consoleLogs = document.getElementById('console-logs');
  
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  
  const time = new Date().toLocaleTimeString();
  const isError = status >= 400;
  const statusClass = status < 300 ? 'status-2xx' : isError ? 'status-4xx' : 'status-5xx';
  
  let reqJsonBlock = '';
  if (reqBody && Object.keys(reqBody).length > 0) {
    reqJsonBlock = `
      <div class="log-details-block">
        <div class="log-detail-title">Request Payload:</div>
        <pre class="log-json">${JSON.stringify(reqBody, null, 2)}</pre>
      </div>
    `;
  }
  
  let resJsonBlock = '';
  if (resBody) {
    resJsonBlock = `
      <div class="log-details-block">
        <div class="log-detail-title">Response Payload:</div>
        <pre class="log-json">${JSON.stringify(resBody, null, 2)}</pre>
      </div>
    `;
  }
  
  entry.innerHTML = `
    <div class="log-meta-row">
      <span class="log-time">${time}</span>
      <span class="log-method method-${method.toLowerCase()}">${method.toUpperCase()}</span>
      <span class="log-url">${path}</span>
      <span class="log-status ${statusClass}">${status}</span>
    </div>
    <div class="log-details-block">
      <div class="log-detail-title">Authorization Header:</div>
      <pre class="log-json" style="color: #60a5fa">${state.token ? `Bearer ${state.token.substring(0, 24)}...` : 'None'}</pre>
    </div>
    ${reqJsonBlock}
    ${resJsonBlock}
  `;
  
  consoleLogs.appendChild(entry);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;

  // Auto expand console panel on first API response to show the telemetry, if currently closed
  const apiConsole = document.getElementById('api-console');
  const consoleToggle = document.getElementById('btn-toggle-console');
  if (apiConsole && !apiConsole.classList.contains('open')) {
    apiConsole.classList.add('open');
    consoleToggle.classList.add('active');
    showToast('API Monitor', 'Real-time API response captured in telemetry sidebar.', 'info');
  }
};

// Clear console logs
document.getElementById('btn-clear-logs').addEventListener('click', () => {
  const consoleLogs = document.getElementById('console-logs');
  consoleLogs.innerHTML = `<div class="console-system-msg">Logs cleared at ${new Date().toLocaleTimeString()}. Monitor API requests below.</div>`;
});

// ==========================================================================
// CORE REST CLIENT
// ==========================================================================
const apiRequest = async (method, path, body = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(path, options);
    const data = await response.json().catch(() => null);
    
    // Log in dev terminal
    logApiCall(method, path, body, response.status, data);
    
    // Auto logout on Token Expired/Invalid
    if (response.status === 401 && state.token) {
      showToast('Session Expired', 'Please login again to continue.', 'error');
      logout();
      throw new Error('Unauthorized');
    }
    
    return { status: response.status, data };
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('Request failed:', error);
      showToast('Connection Error', 'Failed to communicate with server.', 'error');
    }
    return { status: 500, data: { status: 'error', message: error.message } };
  }
};

// ==========================================================================
// ROUTING / VIEW STATE CONTROLLERS
// ==========================================================================
const showView = (viewId) => {
  document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
  
  const header = document.getElementById('main-header');
  if (viewId === 'view-auth') {
    header.classList.add('hidden');
    // Hide api console on auth screen
    document.getElementById('api-console').classList.remove('open');
    document.getElementById('btn-toggle-console').classList.remove('active');
  } else {
    header.classList.remove('hidden');
  }
};

// Auth view sub-tabs
const setupAuthTabs = () => {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  
  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  });
  
  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  });
};

// Dashboard sections switcher (Tasks vs Admin panel)
const setupSectionTabs = () => {
  const secTabTasks = document.getElementById('sec-tab-tasks');
  const secTabAdmin = document.getElementById('sec-tab-admin');
  const sectionTasks = document.getElementById('section-tasks');
  const sectionAdmin = document.getElementById('section-admin');
  
  secTabTasks.addEventListener('click', () => {
    secTabTasks.classList.add('active');
    secTabAdmin.classList.remove('active');
    sectionTasks.classList.remove('hidden');
    sectionAdmin.classList.add('hidden');
    loadTasks();
  });
  
  secTabAdmin.addEventListener('click', () => {
    secTabAdmin.classList.add('active');
    secTabTasks.classList.remove('active');
    sectionAdmin.classList.remove('hidden');
    sectionTasks.classList.add('hidden');
    loadUsers();
  });
};

// ==========================================================================
// AUTHENTICATION LOGIC
// ==========================================================================
const login = async (email, password) => {
  const { status, data } = await apiRequest('POST', '/api/v1/auth/login', { email, password });
  
  if (status === 200 && data.status === 'success') {
    state.token = data.token;
    state.user = data.data.user;
    localStorage.setItem('token', data.token);
    
    showToast('Success', `Welcome back, ${state.user.name}!`, 'success');
    initializeDashboard();
  } else {
    showToast('Login Failed', data.message || 'Check your credentials.', 'error');
  }
};

const register = async (name, email, password, role) => {
  const { status, data } = await apiRequest('POST', '/api/v1/auth/register', { name, email, password, role });
  
  if (status === 201 && data.status === 'success') {
    state.token = data.token;
    state.user = data.data.user;
    localStorage.setItem('token', data.token);
    
    showToast('Success', `Account created! Welcome, ${state.user.name}.`, 'success');
    initializeDashboard();
  } else {
    showToast('Registration Failed', data.message || 'Provide valid parameters.', 'error');
  }
};

const logout = () => {
  state.token = null;
  state.user = null;
  state.tasks = [];
  state.users = [];
  localStorage.removeItem('token');
  
  // Reset forms
  document.getElementById('form-login').reset();
  document.getElementById('form-register').reset();
  
  // Update header view
  showView('view-auth');
};

const fetchUserProfile = async () => {
  const { status, data } = await apiRequest('GET', '/api/v1/auth/me');
  if (status === 200 && data.status === 'success') {
    state.user = data.data.user;
    return true;
  }
  return false;
};

// ==========================================================================
// TASK OPERATIONS
// ==========================================================================
const loadTasks = async () => {
  const { status, data } = await apiRequest('GET', '/api/v1/tasks');
  if (status === 200 && data.status === 'success') {
    state.tasks = data.data.tasks;
    renderTasks();
    renderStats();
  }
};

const saveTask = async (title, description, status) => {
  const payload = { title, description, status };
  let result;
  
  if (state.editingTaskId) {
    result = await apiRequest('PUT', `/api/v1/tasks/${state.editingTaskId}`, payload);
  } else {
    result = await apiRequest('POST', '/api/v1/tasks', payload);
  }
  
  if (result.status === 200 || result.status === 201) {
    showToast('Success', state.editingTaskId ? 'Task updated.' : 'Task created successfully.', 'success');
    closeTaskModal();
    loadTasks();
  } else {
    showToast('Error', result.data.message || 'Could not save task.', 'error');
  }
};

const deleteTask = async (taskId) => {
  if (confirm('Are you sure you want to delete this task?')) {
    const { status, data } = await apiRequest('DELETE', `/api/v1/tasks/${taskId}`);
    if (status === 200) {
      showToast('Success', 'Task deleted successfully.', 'success');
      loadTasks();
    } else {
      showToast('Error', data.message || 'Could not delete task.', 'error');
    }
  }
};

// Toggle status directly on cards
const updateTaskStatus = async (taskId, currentStatus) => {
  const statuses = ['pending', 'in-progress', 'completed'];
  const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
  const nextStatus = statuses[nextIndex];
  
  const { status, data } = await apiRequest('PUT', `/api/v1/tasks/${taskId}`, { status: nextStatus });
  if (status === 200) {
    showToast('Status Updated', `Task status changed to ${nextStatus}`, 'success');
    loadTasks();
  }
};

// ==========================================================================
// ADMIN USER ACTIONS
// ==========================================================================
const loadUsers = async () => {
  const { status, data } = await apiRequest('GET', '/api/v1/users');
  if (status === 200 && data.status === 'success') {
    state.users = data.data.users;
    renderUsers();
  }
};

const promoteUser = async (userId, newRole) => {
  const { status, data } = await apiRequest('PUT', `/api/v1/users/${userId}/role`, { role: newRole });
  if (status === 200) {
    showToast('Role Updated', `User promoted to ${newRole}`, 'success');
    loadUsers();
  } else {
    showToast('Access Denied', data.message || 'Action forbidden.', 'error');
    loadUsers(); // refresh role values
  }
};

// ==========================================================================
// UI RENDERING ENGINE
// ==========================================================================
const initializeDashboard = () => {
  // Update header details
  document.getElementById('header-username').textContent = state.user.name;
  document.getElementById('header-userrole').textContent = state.user.role;
  document.getElementById('header-avatar').textContent = state.user.name.charAt(0).toUpperCase();
  
  // Show admin tab if user is administrator
  const adminTab = document.getElementById('sec-tab-admin');
  if (state.user.role === 'admin') {
    adminTab.classList.remove('hidden');
  } else {
    adminTab.classList.add('hidden');
  }
  
  // Set default tabs
  document.getElementById('sec-tab-tasks').classList.add('active');
  adminTab.classList.remove('active');
  document.getElementById('section-tasks').classList.remove('hidden');
  document.getElementById('section-admin').classList.add('hidden');
  
  // Synchronize layout buttons active state
  const btnGrid = document.getElementById('layout-btn-grid');
  const btnKanban = document.getElementById('layout-btn-kanban');
  if (state.layoutMode === 'kanban') {
    btnGrid.classList.remove('active');
    btnKanban.classList.add('active');
  } else {
    btnGrid.classList.add('active');
    btnKanban.classList.remove('active');
  }
  
  showView('view-dashboard');
  loadTasks();
};

const renderStats = () => {
  const total = state.tasks.length;
  const pending = state.tasks.filter(t => t.status === 'pending').length;
  const progress = state.tasks.filter(t => t.status === 'in-progress').length;
  const completed = state.tasks.filter(t => t.status === 'completed').length;
  
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-progress').textContent = progress;
  document.getElementById('stat-completed').textContent = completed;
};

// Returns standard card HTML block
const createTaskCardHTML = (task) => {
  let statusLabel = 'Pending';
  if (task.status === 'in-progress') statusLabel = 'In Progress';
  if (task.status === 'completed') statusLabel = 'Completed';
  
  // Check if we display owner details (only admins see multiple users tasks)
  const displayOwner = state.user.role === 'admin' && task.user;
  const ownerHtml = displayOwner ? `
    <div class="task-owner">
      <div class="task-owner-avatar" title="${task.user.name}">${task.user.name.charAt(0).toUpperCase()}</div>
      <span>${task.user.email}</span>
    </div>
  ` : `
    <div class="task-owner">
      <div class="task-owner-avatar">${state.user.name.charAt(0).toUpperCase()}</div>
      <span>Own task</span>
    </div>
  `;
  
  return `
    <div class="task-card-header">
      <h4 class="task-title">${escapeHTML(task.title)}</h4>
      <span class="status-badge status-${task.status}" style="cursor: pointer" onclick="event.stopPropagation(); window.appUpdateTaskStatus('${task.id}', '${task.status}')" title="Click to quickly switch status">
        ${statusLabel}
      </span>
    </div>
    <p class="task-desc">${escapeHTML(task.description || 'No description provided.')}</p>
    <div class="task-card-footer">
      ${ownerHtml}
      <div class="task-actions">
        <button class="btn-task-action" onclick="window.appEditTask('${task.id}')" title="Edit Task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
        </button>
        <button class="btn-task-action delete" onclick="window.appDeleteTask('${task.id}')" title="Delete Task">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    </div>
  `;
};

// Bind HTML5 drag behaviors to task cards
const bindDragListeners = (cardElement, task) => {
  cardElement.addEventListener('dragstart', (e) => {
    cardElement.classList.add('dragging');
    e.dataTransfer.setData('text/plain', task.id);
  });
  
  cardElement.addEventListener('dragend', () => {
    cardElement.classList.remove('dragging');
  });
};

const renderTasks = () => {
  const gridContainer = document.getElementById('tasks-container');
  const kanbanContainer = document.getElementById('tasks-kanban-container');
  
  const filteredTasks = state.tasks.filter(task => {
    if (state.currentFilter === 'all') return true;
    return task.status === state.currentFilter;
  });
  
  if (state.layoutMode === 'grid') {
    // Show grid list, hide Kanban
    gridContainer.classList.remove('hidden');
    kanbanContainer.classList.add('hidden');
    
    gridContainer.innerHTML = '';
    
    if (filteredTasks.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📂</div>
          <h3>No tasks found</h3>
          <p>No task entries match the chosen status.</p>
        </div>
      `;
      return;
    }
    
    filteredTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.setAttribute('draggable', 'true');
      card.innerHTML = createTaskCardHTML(task);
      
      bindDragListeners(card, task);
      gridContainer.appendChild(card);
    });
    
  } else {
    // Show Kanban, hide Grid list
    kanbanContainer.classList.remove('hidden');
    gridContainer.classList.add('hidden');
    
    const colPending = document.getElementById('cards-pending');
    const colProgress = document.getElementById('cards-inprogress');
    const colCompleted = document.getElementById('cards-completed');
    
    colPending.innerHTML = '';
    colProgress.innerHTML = '';
    colCompleted.innerHTML = '';
    
    // Distribute all loaded tasks into their columns
    // (We display all tasks in Kanban columns, but if filters are set we highlight or dim others. 
    // For clean layout, we filter cards matching status filter if not set to 'all')
    const kanbanTasks = state.tasks.filter(task => {
      if (state.currentFilter === 'all') return true;
      return task.status === state.currentFilter;
    });
    
    let countPending = 0;
    let countProgress = 0;
    let countCompleted = 0;
    
    kanbanTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.setAttribute('draggable', 'true');
      card.innerHTML = createTaskCardHTML(task);
      
      bindDragListeners(card, task);
      
      if (task.status === 'pending') {
        colPending.appendChild(card);
        countPending++;
      } else if (task.status === 'in-progress') {
        colProgress.appendChild(card);
        countProgress++;
      } else if (task.status === 'completed') {
        colCompleted.appendChild(card);
        countCompleted++;
      }
    });
    
    // If a column is empty, inject a smaller clean placeholder
    if (countPending === 0) {
      colPending.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size:12px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm)">Drop tasks here</div>`;
    }
    if (countProgress === 0) {
      colProgress.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size:12px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm)">Drop tasks here</div>`;
    }
    if (countCompleted === 0) {
      colCompleted.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-muted); font-size:12px; border: 1px dashed var(--border-color); border-radius: var(--radius-sm)">Drop tasks here</div>`;
    }
    
    // Update counts
    document.getElementById('count-pending').textContent = countPending;
    document.getElementById('count-inprogress').textContent = countProgress;
    document.getElementById('count-completed').textContent = countCompleted;
  }
};

const renderUsers = () => {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '';
  
  if (state.users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No users loaded.</td></tr>`;
    return;
  }
  
  state.users.forEach(u => {
    const row = document.createElement('tr');
    const dateStr = new Date(u.createdAt).toLocaleDateString();
    
    // Prevent changing role of oneself
    const isDisabled = u.id === state.user.id ? 'disabled' : '';
    
    row.innerHTML = `
      <td><strong>${escapeHTML(u.name)}</strong></td>
      <td>${escapeHTML(u.email)} ${u.id === state.user.id ? '<small class="text-muted">(You)</small>' : ''}</td>
      <td>${dateStr}</td>
      <td>
        <span class="${u.role === 'admin' ? 'admin-badge' : 'user-badge'}">${u.role}</span>
      </td>
      <td><span style="font-weight: 700; color: #fff;">${u.taskCount || 0}</span> tasks</td>
      <td>
        <div class="custom-select-wrapper">
          <select class="custom-select-pill" onchange="window.appPromoteUser('${u.id}', this.value)" ${isDisabled}>
            <option value="user" ${u.role === 'user' ? 'selected' : ''}>Standard</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
};

// Helper to escape HTML tags to prevent XSS
const escapeHTML = (str) => {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
};

// ==========================================================================
// MODALS LOGIC
// ==========================================================================
const openTaskModal = (task = null) => {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('form-task');
  
  form.reset();
  
  if (task) {
    state.editingTaskId = task.id;
    title.textContent = 'Modify Task Card';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description || '';
    document.getElementById('task-status').value = task.status;
  } else {
    state.editingTaskId = null;
    title.textContent = 'Create New Task';
    document.getElementById('task-id').value = '';
    document.getElementById('task-status').value = 'pending';
  }
  
  modal.classList.remove('hidden');
};

const closeTaskModal = () => {
  document.getElementById('task-modal').classList.add('hidden');
};

// ==========================================================================
// HTML5 DRAG AND DROP COLUMN BINDINGS
// ==========================================================================
const setupKanbanDropZones = () => {
  const columns = document.querySelectorAll('.kanban-column');
  
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    
    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });
    
    col.addEventListener('drop', async (e) => {
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = col.dataset.status;
      
      const task = state.tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
        const { status, data } = await apiRequest('PUT', `/api/v1/tasks/${taskId}`, { status: newStatus });
        if (status === 200) {
          showToast('Status Updated', `Task status changed to ${newStatus}`, 'success');
          loadTasks();
        } else {
          showToast('Error', data.message || 'Could not update status', 'error');
        }
      }
    });
  });
};

// ==========================================================================
// INITIAL BINDING & LAUNCH
// ==========================================================================
const init = async () => {
  // Bind Logout
  document.getElementById('btn-logout').addEventListener('click', logout);
  
  // Bind Modal Controllers
  document.getElementById('btn-open-create-modal').addEventListener('click', () => openTaskModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeTaskModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeTaskModal);
  
  // Theme toggle configuration
  const themeToggle = document.getElementById('btn-toggle-theme');
  const applyTheme = (theme) => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };
  
  // Set initial theme on load
  applyTheme(state.themeMode);

  themeToggle.addEventListener('click', () => {
    state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('themeMode', state.themeMode);
    applyTheme(state.themeMode);
    showToast('Theme Switch', `Switched to ${state.themeMode} mode.`, 'info');
  });

  // Bind Collapsible API console sidebar
  const consoleToggle = document.getElementById('btn-toggle-console');
  const apiConsole = document.getElementById('api-console');
  consoleToggle.addEventListener('click', () => {
    apiConsole.classList.toggle('open');
    consoleToggle.classList.toggle('active');
  });

  // Bind Grid vs Kanban toggle layout views
  const btnGrid = document.getElementById('layout-btn-grid');
  const btnKanban = document.getElementById('layout-btn-kanban');
  btnGrid.addEventListener('click', () => {
    btnGrid.classList.add('active');
    btnKanban.classList.remove('active');
    state.layoutMode = 'grid';
    localStorage.setItem('layoutMode', 'grid');
    renderTasks();
  });
  btnKanban.addEventListener('click', () => {
    btnKanban.classList.add('active');
    btnGrid.classList.remove('active');
    state.layoutMode = 'kanban';
    localStorage.setItem('layoutMode', 'kanban');
    renderTasks();
  });

  // Autofill button credentials listeners
  document.getElementById('autofill-user').addEventListener('click', () => {
    document.getElementById('login-email').value = 'user@example.com';
    document.getElementById('login-password').value = 'password123';
    showToast('Autofill', 'Standard credentials loaded. Click Sign In.', 'info');
  });
  document.getElementById('autofill-admin').addEventListener('click', () => {
    document.getElementById('login-email').value = 'admin@example.com';
    document.getElementById('login-password').value = 'password123';
    showToast('Autofill', 'Admin credentials loaded. Click Sign In.', 'info');
  });

  // Bind Forms Submission
  document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    login(email, pass);
  });
  
  document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const pass = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;
    register(name, email, pass, role);
  });
  
  document.getElementById('form-task').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const status = document.getElementById('task-status').value;
    saveTask(title, desc, status);
  });
  
  // Bind Task Filter Pills
  document.querySelectorAll('.radio-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentFilter = pill.dataset.filter;
      renderTasks();
    });
  });
  
  // Setup tabs loaders
  setupAuthTabs();
  setupSectionTabs();
  setupKanbanDropZones();
  
  // Expose triggers to window scope (needed for onclick inside template literal strings)
  window.appEditTask = (taskId) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) openTaskModal(task);
  };
  window.appDeleteTask = deleteTask;
  window.appUpdateTaskStatus = updateTaskStatus;
  window.appPromoteUser = promoteUser;
  
  // Check if token already exists to auto-restore session
  if (state.token) {
    const success = await fetchUserProfile();
    if (success) {
      showToast('Session Restored', `Welcome back, ${state.user.name}!`, 'info');
      initializeDashboard();
    } else {
      logout();
    }
  } else {
    showView('view-auth');
  }
};

// Launch SPA
document.addEventListener('DOMContentLoaded', init);
