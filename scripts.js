// Общие функции и хранилище пользователей/заявок в localStorage

// --- Пользователи ---
function saveUser(user) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  users.push(user);
  localStorage.setItem('users', JSON.stringify(users));
}

function getUserByLogin(login) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users.find(u => u.login === login);
}

// --- Авторизация ---
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}

function logoutUser() {
  localStorage.removeItem('currentUser');
}

// --- Заявки ---
function getRequests() {
  return JSON.parse(localStorage.getItem('requests') || '[]');
}

function saveRequest(request) {
  const requests = getRequests();
  requests.push(request);
  localStorage.setItem('requests', JSON.stringify(requests));
}

function updateRequest(updatedRequest) {
  const requests = getRequests();
  const idx = requests.findIndex(r => r.id === updatedRequest.id);
  if (idx !== -1) {
    requests[idx] = updatedRequest;
    localStorage.setItem('requests', JSON.stringify(requests));
  }
}

// --- Уникальный ID ---
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// --- Валидация телефона ---
function isValidPhone(phone) {
  return /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(phone);
}

/* ======== Страница регистрации ======== */
if (document.getElementById('registration-form')) {
  const form = document.getElementById('registration-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fullname = form.querySelector('#reg-fullname').value.trim();
    const phone = form.querySelector('#reg-phone').value.trim();
    const email = form.querySelector('#reg-email').value.trim();
    const login = form.querySelector('#reg-login').value.trim();
    const password = form.querySelector('#reg-password').value;

    if (!fullname.match(/^[а-яА-ЯёЁ\s]+$/)) {
      alert('ФИО должно содержать только кириллицу и пробелы.');
      return;
    }
    if (!isValidPhone(phone)) {
      alert('Телефон должен быть в формате +7(XXX)-XXX-XX-XX');
      return;
    }
    if (getUserByLogin(login)) {
      alert('Пользователь с таким логином уже существует.');
      return;
    }
    if (password.length < 6) {
      alert('Пароль должен быть минимум 6 символов.');
      return;
    }

    saveUser({ fullname, phone, email, login, password, role: 'user' });
    alert('Регистрация успешна! Теперь войдите в систему.');
    window.location.href = 'login.html';
  });
}

/* ======== Страница входа ======== */
if (document.getElementById('login-form')) {
  const form = document.getElementById('login-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const login = form.querySelector('#login-login').value.trim();
    const password = form.querySelector('#login-password').value;

    if (login === 'adminka' && password === 'password') {
      setCurrentUser({ login: 'adminka', role: 'admin' });
      window.location.href = 'admin_panel.html';
      return;
    }

    const user = getUserByLogin(login);
    if (!user || user.password !== password) {
      alert('Неверный логин или пароль.');
      return;
    }

    setCurrentUser(user);
    window.location.href = 'user_requests.html';
  });
}

/* ======== Страница заявлений пользователя ======== */
if (document.getElementById('order-form')) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'user') {
    alert('Пожалуйста, войдите в систему!');
    window.location.href = 'login.html';
  }

  // Подставляем телефон из профиля
  document.getElementById('order-phone').value = currentUser.phone;

  // Логика показа поля "Описание иной услуги"
  const serviceSelect = document.getElementById('order-service');
  const otherDesc = document.getElementById('order-other-desc');
  const otherDescLabel = document.querySelector('label[for="order-other-desc"]');

  serviceSelect.addEventListener('change', () => {
    if (serviceSelect.value === 'Иная услуга') {
      otherDesc.classList.remove('hidden');
      otherDescLabel.classList.remove('hidden');
      otherDesc.setAttribute('required', 'required');
    } else {
      otherDesc.classList.add('hidden');
      otherDescLabel.classList.add('hidden');
      otherDesc.removeAttribute('required');
      otherDesc.value = '';
    }
  });

  // Отображаем заявки пользователя
  const requestsListEl = document.getElementById('requests-list');

  function renderRequests() {
    const allRequests = getRequests();
    const userRequests = allRequests.filter(r => r.userLogin === currentUser.login);
    if (userRequests.length === 0) {
      requestsListEl.innerHTML = '<li>Заявок нет</li>';
      return;
    }
    requestsListEl.innerHTML = '';
    userRequests.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>Услуга:</strong> ${r.service} <br />
        <strong>Адрес:</strong> ${r.address} <br />
        <strong>Дата/время:</strong> ${new Date(r.datetime).toLocaleString()} <br />
        <strong>Статус:</strong> ${r.status} <br />
        ${r.status === 'отменено' ? `<strong>Причина отмены:</strong> ${r.cancelReason}` : ''}
      `;
      requestsListEl.appendChild(li);
    });
  }

  renderRequests();

  // Отправка заявки
  const orderForm = document.getElementById('order-form');
  orderForm.addEventListener('submit', e => {
    e.preventDefault();

    const address = orderForm.querySelector('#order-address').value.trim();
    const phone = orderForm.querySelector('#order-phone').value.trim();
    const datetime = orderForm.querySelector('#order-date').value;
    const service = orderForm.querySelector('#order-service').value;
    const otherDescVal = orderForm.querySelector('#order-other-desc').value.trim();
    const payment = orderForm.querySelector('#order-payment').value;

    if (!isValidPhone(phone)) {
      alert('Телефон должен быть в формате +7(XXX)-XXX-XX-XX');
      return;
    }

    if (service === '') {
      alert('Выберите вид услуги');
      return;
    }

    let serviceFinal = service;
    if (service === 'Иная услуга') {
      if (otherDescVal.length === 0) {
        alert('Опишите иную услугу');
        return;
      }
      serviceFinal = otherDescVal;
    }

    const newRequest = {
      id: generateId(),
      userLogin: currentUser.login,
      fullname: currentUser.fullname,
      phone,
      email: currentUser.email,
      address,
      datetime,
      service: serviceFinal,
      payment,
      status: 'новая заявка',
      cancelReason: ''
    };

    saveRequest(newRequest);
    alert('Заявка успешно отправлена!');
    orderForm.reset();
    renderRequests();
  });

  // Выход
  document.getElementById('logout-btn').addEventListener('click', () => {
    logoutUser();
    window.location.href = 'login.html';
  });
}

/* ======== Панель администратора ======== */
if (document.getElementById('admin-requests-tbody')) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Доступ запрещён! Пожалуйста, войдите как администратор.');
    window.location.href = 'login.html';
  }

  const tbody = document.getElementById('admin-requests-tbody');

  function renderAdminRequests() {
    const allRequests = getRequests();
    tbody.innerHTML = '';
    allRequests.forEach(req => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${req.fullname}</td>
        <td>${req.phone}</td>
        <td>${req.address}</td>
        <td>${req.service}</td>
        <td>${new Date(req.datetime).toLocaleString()}</td>
        <td>${req.payment}</td>
        <td>
          <select class="status-select" data-id="${req.id}">
            <option value="новая заявка" ${req.status === 'новая заявка' ? 'selected' : ''}>Новая заявка</option>
            <option value="в работе" ${req.status === 'в работе' ? 'selected' : ''}>В работе</option>
            <option value="выполнено" ${req.status === 'выполнено' ? 'selected' : ''}>Выполнено</option>
            <option value="отменено" ${req.status === 'отменено' ? 'selected' : ''}>Отменено</option>
          </select>
        </td>
        <td>
          <input type="text" class="cancel-reason" data-id="${req.id}" value="${req.cancelReason || ''}" placeholder="Причина отмены" ${req.status === 'отменено' ? '' : 'disabled'} />
        </td>
        <td>
          <button class="btn btn-save" data-id="${req.id}">Сохранить</button>
        </td>
      `;

      // Цвета строк в зависимости от статуса
      if (req.status === 'в работе') tr.classList.add('status-inwork');
      else if (req.status === 'выполнено') tr.classList.add('status-done');
      else if (req.status === 'отменено') tr.classList.add('status-canceled');

      tbody.appendChild(tr);
    });

    // События на изменение статуса
    document.querySelectorAll('.status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const reasonInput = document.querySelector(`.cancel-reason[data-id="${id}"]`);
        if (e.target.value === 'отменено') {
          reasonInput.disabled = false;
          reasonInput.focus();
        } else {
          reasonInput.disabled = true;
          reasonInput.value = '';
        }
      });
    });

    // Сохранение изменений
    document.querySelectorAll('.btn-save').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const select = document.querySelector(`.status-select[data-id="${id}"]`);
        const reasonInput = document.querySelector(`.cancel-reason[data-id="${id}"]`);

        const newStatus = select.value;
        const cancelReason = newStatus === 'отменено' ? reasonInput.value.trim() : '';

        if (newStatus === 'отменено' && cancelReason === '') {
          alert('Обязательно укажите причину отмены заявки.');
          reasonInput.focus();
          return;
        }

        const allRequests = getRequests();
        const req = allRequests.find(r => r.id === id);
        if (req) {
          req.status = newStatus;
          req.cancelReason = cancelReason;
          updateRequest(req);
          alert('Статус заявки обновлен.');
          renderAdminRequests();
        }
      });
    });
  }

  renderAdminRequests();

  // Выход из админки
  document.getElementById('admin-logout-btn').addEventListener('click', () => {
    logoutUser();
    window.location.href = 'login.html';
  });
}
