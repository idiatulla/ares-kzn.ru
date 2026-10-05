(function () {
  'use strict';

  var form = document.getElementById('gform_1');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var button = form.querySelector('input[type="submit"]');

  function show(text, ok) {
    status.textContent = text;
    status.style.color = ok ? '#2e7d32' : '#c62828';
    status.style.marginTop = '12px';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
      website: form.elements.website.value,
      page: location.pathname
    };

    if (!data.name || !data.message) {
      return show('Укажите, как к Вам обращаться, и опишите вопрос.', false);
    }
    if (!data.phone && !data.email) {
      return show('Укажите телефон или адрес электронной почты для ответа.', false);
    }

    button.disabled = true;
    show('Отправляем...', true);

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          if (!res.ok || !body.ok) throw new Error(body.error || 'Ошибка отправки');
          form.reset();
          show('Спасибо! Ваше сообщение отправлено, мы свяжемся с Вами в ближайшее время.', true);
        });
      })
      .catch(function (err) {
        show(err.message + '. Попробуйте ещё раз или позвоните: +7 (843) 239-44-34.', false);
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
