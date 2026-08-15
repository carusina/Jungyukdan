/* 정육단 창업 문의 페이지 스크립트 */
(function () {
  "use strict";

  /* ---------- 헤더 스크롤 상태 ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 모바일 메뉴 ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  burger.addEventListener("click", function () {
    nav.classList.toggle("is-open");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") nav.classList.remove("is-open");
  });

  /* ---------- 스크롤 리빌 ---------- */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- 숫자 카운트업 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var duration = 1400;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
      el.textContent = Math.round(target * eased).toLocaleString("ko-KR");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var countObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll(".stat__num").forEach(function (el) {
    countObserver.observe(el);
  });

  /* ---------- 연락처 자동 하이픈 ---------- */
  var phoneInput = document.getElementById("phone");
  phoneInput.addEventListener("input", function () {
    var digits = this.value.replace(/\D/g, "").slice(0, 11);
    var formatted = digits;
    if (digits.length > 7) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3, 7) + "-" + digits.slice(7);
    } else if (digits.length > 3) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    }
    this.value = formatted;
  });

  /* ---------- 문의 폼 제출 ---------- */
  var form = document.getElementById("contactForm");
  var result = document.getElementById("formResult");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("name");
    var phone = document.getElementById("phone");
    var region = document.getElementById("region");
    var agree = document.getElementById("agree");

    /* 유효성 검사 */
    [name, phone, region].forEach(function (el) {
      el.classList.remove("is-error");
    });
    result.className = "form__result";
    result.textContent = "";

    if (!name.value.trim()) {
      name.classList.add("is-error");
      showError("이름을 입력해 주세요.");
      name.focus();
      return;
    }
    if (!/^01[016789]-\d{3,4}-\d{4}$/.test(phone.value.trim())) {
      phone.classList.add("is-error");
      showError("연락처를 010-0000-0000 형식으로 입력해 주세요.");
      phone.focus();
      return;
    }
    if (!region.value) {
      region.classList.add("is-error");
      showError("창업 희망 지역을 선택해 주세요.");
      region.focus();
      return;
    }
    if (!agree.checked) {
      showError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    /* TODO: 실제 서비스 시 아래를 백엔드/폼 서비스 연동으로 교체하세요.
       예) fetch("/api/franchise-inquiry", { method: "POST", body: new FormData(form) })
       또는 Google Forms, Formspree, 카카오톡 채널 연동 등 */
    result.classList.add("is-success");
    result.textContent = "상담 신청이 접수되었습니다. 담당자가 24시간 이내에 연락드리겠습니다.";
    form.reset();

    function showError(msg) {
      result.classList.add("is-error");
      result.textContent = msg;
    }
  });

  /* ---------- 개인정보 안내 ---------- */
  document.getElementById("privacyLink").addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "개인정보 수집·이용 안내\n\n" +
        "1. 수집 항목: 이름, 연락처, 창업 희망 지역, 문의 내용\n" +
        "2. 수집 목적: 창업 상담 및 안내\n" +
        "3. 보유 기간: 상담 완료 후 6개월\n\n" +
        "※ 동의를 거부할 수 있으나, 거부 시 상담 신청이 제한됩니다."
    );
  });
})();
