(function () {
  'use strict';
  var B = window.BRANCHES || [];
  var IMG = 'images/branch/';
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var no2 = function (n) { return (n < 10 ? '0' : '') + n; };

  // 헤더: 스크롤 시 배경, 모바일 메뉴
  var hd = $('#hd'), gnb = $('#gnb'), menuBtn = $('#menuBtn');
  var onScroll = function () { hd.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menuBtn.addEventListener('click', function () {
    var open = gnb.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  gnb.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { gnb.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  // 원형 지점 줄 (마키 루프용으로 두 번 반복)
  var circleHtml = B.map(function (b) {
    return '<a class="circle" href="#branches" data-no="' + b.no + '"><img src="' + IMG + b.cover + '" alt="" loading="lazy">' +
      '<b>' + esc(b.name.replace('휘트니스 오름 ', '오름 ')) + '</b><small>' + esc(b.area) + '</small></a>';
  }).join('');
  $('#circleTrack').innerHTML = circleHtml + circleHtml;
  $('#circleTrack').addEventListener('click', function (e) {
    var a = e.target.closest('.circle'); if (!a) return;
    e.preventDefault(); openModal(+a.dataset.no);
  });

  // 쇼케이스 슬라이더: 지점별 대표 사진
  var showList = [1, 7, 11, 16, 15, 13, 14, 9].map(function (n) { return B.find(function (b) { return b.no === n; }); }).filter(Boolean);
  var track = $('#showTrack'), dots = $('#showDots'), cur = 0, timer;
  track.innerHTML = showList.map(function (b, i) {
    var hours = b.hoursShort.map(function (h) { return h[0] + ' ' + h[1]; }).join(' · ');
    return '<div class="show-slide"><img src="' + IMG + b.cover + '" alt="' + esc(b.name) + ' 내부" ' + (i ? 'loading="lazy"' : '') + '>' +
      '<div class="ov"><p class="bn-kicker">BRANCH ' + no2(b.no) + '</p>' +
      '<h2 class="bn-title">' + esc(b.area) + ' 헬스장<br>' + esc(b.name) + '</h2>' +
      '<p class="bn-sub">' + esc(hours) + '</p><p class="bn-foot">FITNESS OREUM</p></div></div>';
  }).join('');
  dots.innerHTML = showList.map(function (_, i) { return '<button aria-label="' + (i + 1) + '번 슬라이드"></button>'; }).join('');
  var go = function (i) {
    cur = (i + showList.length) % showList.length;
    track.style.transform = 'translateX(' + (-100 * cur) + '%)';
    [].forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === cur); });
  };
  var auto = function () { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 4500); };
  dots.addEventListener('click', function (e) {
    var k = [].indexOf.call(dots.children, e.target); if (k >= 0) { go(k); auto(); }
  });
  var sx = null;
  track.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); auto(); }
  });
  go(0); auto();

  // 지점 카드 그리드 + 구 필터
  var grid = $('#brGrid');
  var renderGrid = function (gu) {
    grid.innerHTML = B.filter(function (b) { return gu === 'all' || b.gu === gu; }).map(function (b) {
      var hours = b.hoursShort.map(function (h) { return '<span>' + esc(h[0]) + ' ' + esc(h[1]) + '</span>'; }).join('<br>');
      var kw = b.keywords.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('');
      return '<article class="br-card" tabindex="0" role="button" data-no="' + b.no + '" aria-label="' + esc(b.name) + ' 상세 보기">' +
        '<div class="br-thumb"><img src="' + IMG + b.cover + '" alt="" loading="lazy"><span class="br-no">BRANCH ' + no2(b.no) + '</span></div>' +
        '<div class="br-info"><p class="br-gu">' + esc(b.gu) + ' · ' + esc(b.area) + '</p><h4 class="br-name">' + esc(b.name) + '</h4>' +
        '<p class="br-addr">' + esc(b.addr) + '</p><p class="br-hours">' + hours + '</p>' +
        (kw ? '<div class="br-kw">' + kw + '</div>' : '') + '</div></article>';
    }).join('');
  };
  renderGrid('all');
  $('#brTabs').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    [].forEach.call(this.children, function (b) { b.classList.toggle('on', b === t); });
    renderGrid(t.dataset.gu);
  });
  grid.addEventListener('click', function (e) { var c = e.target.closest('.br-card'); if (c) openModal(+c.dataset.no); });
  grid.addEventListener('keydown', function (e) {
    var c = e.target.closest('.br-card');
    if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openModal(+c.dataset.no); }
  });

  // 지점 상세 모달
  var modal = $('#modal'), lastFocus = null;
  function openModal(no) {
    var b = B.find(function (x) { return x.no === no; }); if (!b) return;
    lastFocus = document.activeElement;
    var main = $('#mdMain');
    main.src = IMG + b.cover; main.alt = b.name + ' 시설 사진';
    $('#mdThumbs').innerHTML = b.photos.map(function (p) {
      return '<button class="' + (p === b.cover ? 'on' : '') + '" data-src="' + IMG + p + '" aria-label="사진 보기"><img src="' + IMG + p + '" alt="" loading="lazy"></button>';
    }).join('');
    $('#mdMeta').textContent = 'BRANCH ' + no2(b.no) + ' · ' + b.gu + ' · ' + b.area;
    $('#mdName').textContent = b.name;
    $('#mdAddr').textContent = b.addr;
    $('#mdHours').innerHTML = b.hours.map(function (h) { return '<li><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span></li>'; }).join('') || '<li><span>네이버에 등록되지 않음</span></li>';
    $('#mdNote').textContent = b.hoursNote || '';
    $('#mdPrices').innerHTML = b.prices.length
      ? b.prices.map(function (p) { return '<li><span>' + esc(p[0]) + '</span><b>' + won(p[1]) + '</b></li>'; }).join('')
      : '<li><span>지점으로 문의해 주세요</span></li>';
    $('#mdBtns').innerHTML =
      (b.phone ? '<a class="btn-fill" href="tel:' + esc(b.phone) + '">전화 ' + esc(b.phone) + '</a>' : '') +
      '<a class="btn-line" href="' + esc(b.map) + '" target="_blank" rel="noopener">길찾기</a>' +
      '<a class="btn-line" href="' + esc(b.naver) + '" target="_blank" rel="noopener">네이버 플레이스</a>';
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.modal-x', modal).focus();
  }
  function closeModal() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-close')) return closeModal();
    var t = e.target.closest('.md-thumbs button');
    if (t) {
      $('#mdMain').src = t.dataset.src;
      [].forEach.call(t.parentNode.children, function (x) { x.classList.toggle('on', x === t); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  // 회원후기 마키 (특정 트레이너·외모 언급 후기는 제외)
  var skip = /쌤|잘생|미녀|사장님 바뀌|ㅋ|꒰/;
  var rv = (window.REVIEWS || []).filter(function (r) { return !skip.test(r.text); }).slice(0, 18);
  var rvHtml = rv.map(function (r) {
    return '<div class="rv-card"><span class="q">"</span><p>' + esc(r.text) + '</p><p class="who">' + esc(r.nick) + ' · ' + esc(r.branch) + '</p></div>';
  }).join('');
  $('#rvTrack').innerHTML = rvHtml + rvHtml;

  // 스크롤 등장 + 배너 패럴랙스
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  var banners = document.querySelectorAll('.banner');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var para = function () {
    if (reduce) return;
    var vh = window.innerHeight;
    banners.forEach(function (bn) {
      var r = bn.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      bn.style.setProperty('--py', (p * -40).toFixed(1) + 'px');
    });
  };
  window.addEventListener('scroll', para, { passive: true }); para();
})();
