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
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  var hasObserver = "IntersectionObserver" in window;

  /* ---------- 스크롤 리빌 ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (hasObserver) {
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
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });

    /* 안전장치: 2초가 지나도 단 하나도 노출되지 않았다면 관찰자가
       동작하지 않는 환경이므로, 등장 효과를 포기하고 전부 보여준다.
       (하나라도 노출됐다면 정상 동작이므로 그대로 둔다) */
    setTimeout(function () {
      if (!document.querySelector(".reveal.is-visible")) {
        revealEls.forEach(function (el) {
          el.classList.add("is-visible");
        });
      }
    }, 2000);
  } else {
    /* 구형 브라우저: 등장 효과 없이 바로 노출 */
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- 숫자 카운트업 ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
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
  var statEls = document.querySelectorAll(".stat__num");

  if (hasObserver) {
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
    statEls.forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    /* 구형 브라우저: 애니메이션 없이 최종 숫자만 표시 */
    statEls.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (!isNaN(target)) el.textContent = target.toLocaleString("ko-KR");
    });
  }

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

  /* 필드 정의: 순서대로 검사하며, 첫 실패 지점에서 안내 */
  var fields = [
    { id: "name", message: "성함을 입력해 주세요." },
    {
      id: "phone",
      message: "연락처를 010-0000-0000 형식으로 입력해 주세요.",
      test: function (v) { return /^01[016789]-\d{3,4}-\d{4}$/.test(v); }
    },
    { id: "region", message: "희망 지역(시/도)을 선택해 주세요." },
    { id: "district", message: "희망 지역(시/군/구)을 입력해 주세요." },
    { id: "store", message: "점포 유무를 선택해 주세요." },
    { id: "timing", message: "예상 창업 시기를 선택해 주세요." }
  ];

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var agree = document.getElementById("agree");

    /* 유효성 검사 */
    fields.forEach(function (f) {
      document.getElementById(f.id).classList.remove("is-error");
    });
    result.className = "form__result";
    result.textContent = "";

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var el = document.getElementById(f.id);
      var value = el.value.trim();
      var valid = f.test ? f.test(value) : value !== "";

      if (!valid) {
        el.classList.add("is-error");
        showError(f.message);
        el.focus();
        return;
      }
    }

    if (!agree.checked) {
      showError("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    submit(showError);
  });

  function showError(msg) {
    result.className = "form__result is-error";
    result.textContent = msg;
  }

  /* ---------- 서버로 전송 ---------- */
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.textContent;
  var sending = false;

  function submit(onError) {
    if (sending) return;
    sending = true;

    submitBtn.disabled = true;
    submitBtn.textContent = "전송 중...";
    result.className = "form__result";
    result.textContent = "";

    var payload = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      region: document.getElementById("region").value,
      district: document.getElementById("district").value.trim(),
      store: document.getElementById("store").value,
      timing: document.getElementById("timing").value,
      message: document.getElementById("message").value.trim(),
      company: document.getElementById("company").value
    };

    fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (res) {
        if (res.ok && res.data.ok) {
          result.className = "form__result is-success";
          result.textContent =
            "상담 신청이 접수되었습니다. 담당자가 24시간 이내에 연락드리겠습니다.";
          form.reset();
        } else {
          onError(
            res.data.error ||
              "접수에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요."
          );
        }
      })
      .catch(function () {
        onError(
          "네트워크 연결을 확인해 주세요. 문제가 계속되면 전화로 문의해 주세요."
        );
      })
      .then(function () {
        sending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      });
  }

  /* ---------- 개인정보 안내 ---------- */
  document.getElementById("privacyLink").addEventListener("click", function (e) {
    e.preventDefault();
    alert(
      "개인정보 수집·이용 안내\n\n" +
        "1. 수집 항목: 성함, 연락처, 희망 지역, 점포 유무, 예상 창업 시기, 문의 내용\n" +
        "2. 수집 목적: 창업 상담 및 안내\n" +
        "3. 보유 기간: 상담 완료 후 6개월\n\n" +
        "※ 동의를 거부할 수 있으나, 거부 시 상담 신청이 제한됩니다."
    );
  });
})();
