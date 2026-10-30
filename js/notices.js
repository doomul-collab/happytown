/* 소식·자료실 게시판 - data/notices.json 을 읽어 표시합니다.
   사용법: <div id="notice-list"></div>
          <script src="js/notices.js"></script>  */
(function () {
  const DATA_URL = 'data/notices.json';
  const TYPES = ['전체', '공지', '소식', '자료'];
  const box = document.getElementById('notice-list');
  if (!box) return;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const linkify = s => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  const fmtDate = d => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? `${m[1]}.${m[2]}.${m[3]}` : esc(d);
  };

  const style = document.createElement('style');
  style.textContent = `
    .nt-wrap{padding:28px 30px}
    .nt-wrap h2{margin:0 0 16px;font-size:22px;color:#005b88}
    .nt-filter{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
    .nt-filter button{padding:8px 16px;border:1px solid #0077aa;background:#fff;color:#0077aa;border-radius:20px;font-size:15px;cursor:pointer}
    .nt-filter button[aria-pressed="true"]{background:#0077aa;color:#fff}
    .nt-list{list-style:none;margin:0;padding:0;border-top:2px solid #005b88}
    .nt-item{border-bottom:1px solid #e3e3e3}
    .nt-head{box-sizing:border-box;display:flex;gap:12px;align-items:center;padding:15px 8px;cursor:pointer;background:none;border:0;width:100%;text-align:left;font:inherit;font-size:16px;color:#222;text-decoration:none}
    .nt-head:hover,.nt-head:focus{background:#f0f6fa}
    .nt-type{flex:none;font-size:13px;font-weight:700;padding:3px 9px;border-radius:4px;background:#e6f1f7;color:#005b88}
    .nt-type.t-공지{background:#fdecea;color:#b0281b}
    .nt-type.t-자료{background:#eaf5ea;color:#2a6b2a}
    .nt-title{flex:1;font-weight:600}
    .nt-pin{color:#b0281b;font-weight:700;margin-right:4px}
    .nt-date{color:#777;font-size:14px;white-space:nowrap}
    .nt-body{display:none;padding:6px 14px 22px;line-height:1.8;white-space:pre-wrap;word-break:break-word}
    .nt-item.open .nt-body{display:block}
    .nt-files{margin-top:14px;padding-top:10px;border-top:1px dashed #ccc;white-space:normal}
    .nt-files a{display:block;margin:5px 0;color:#0077aa}
    .nt-empty{color:#777;padding:24px 8px}
    @media (max-width:600px){.nt-wrap{padding:20px 16px}.nt-head{flex-wrap:wrap}.nt-date{width:100%;padding-left:2px}}`;
  document.head.appendChild(style);

  box.className = 'nt-wrap';
  box.innerHTML = '<h2>공지사항</h2><p class="nt-empty" role="status">불러오는 중...</p>';

  let all = [];
  let current = '전체';

  function itemHtml(n) {
    const label = `<span class="nt-type t-${esc(n.type)}">${esc(n.type || '공지')}</span>
      <span class="nt-title">${n.pinned ? '<span class="nt-pin">[중요]</span>' : ''}${esc(n.title)}</span>
      <span class="nt-date">${fmtDate(n.date)}</span>`;
    if (n.link) {
      return `<li class="nt-item"><a class="nt-head" href="${esc(n.link)}">${label}</a></li>`;
    }
    const files = (n.files || []).length
      ? '<div class="nt-files">' + n.files.map(f =>
          `<a href="${esc(f.path)}" download="${esc(f.name)}">첨부파일: ${esc(f.name)}</a>`).join('') + '</div>'
      : '';
    return `<li class="nt-item">
      <button type="button" class="nt-head" aria-expanded="false">${label}</button>
      <div class="nt-body">${linkify(esc(n.content))}${files}</div></li>`;
  }

  function render() {
    const list = current === '전체' ? all : all.filter(n => n.type === current);
    const filter = '<div class="nt-filter" role="group" aria-label="분류 선택">' +
      TYPES.map(t => `<button type="button" data-type="${t}" aria-pressed="${t === current}">${t}</button>`).join('') +
      '</div>';
    const body = list.length
      ? `<ul class="nt-list" aria-label="${esc(current)} 글 목록, ${list.length}개">${list.map(itemHtml).join('')}</ul>`
      : '<p class="nt-empty">등록된 글이 없습니다.</p>';
    box.innerHTML = '<h2>공지사항</h2>' + filter + body;

    box.querySelectorAll('.nt-filter button').forEach(b => {
      b.onclick = () => {
        current = b.dataset.type;
        render();
        const again = box.querySelector(`.nt-filter button[data-type="${current}"]`);
        if (again) again.focus();
      };
    });
    box.querySelectorAll('button.nt-head').forEach(btn => {
      btn.onclick = () => {
        const item = btn.parentElement;
        item.classList.toggle('open');
        btn.setAttribute('aria-expanded', item.classList.contains('open'));
      };
    });
  }

  fetch(DATA_URL + '?v=' + Date.now())
    .then(r => (r.ok ? r.json() : []))
    .then(list => {
      all = list.slice().sort((a, b) =>
        ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || String(b.date).localeCompare(String(a.date)) || (b.id - a.id));
      render();
    })
    .catch(() => { box.innerHTML = '<h2>공지사항</h2><p class="nt-empty">글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>'; });
})();
