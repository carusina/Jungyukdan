/**
 * 창업 문의 접수 → 이메일 전송 (Vercel 서버리스 함수)
 *
 * 필요한 환경변수 (Vercel 대시보드 → Settings → Environment Variables):
 *   RESEND_API_KEY  Resend에서 발급받은 API 키 (필수)
 *   INQUIRY_TO      문의를 받을 이메일 주소 (필수). 쉼표로 여러 명 지정 가능
 *   INQUIRY_FROM    보내는 사람 주소 (선택). 미설정 시 Resend 테스트 주소 사용
 *                   자체 도메인을 쓰려면 Resend에서 도메인 인증 후
 *                   "정육단 <franchise@도메인>" 형태로 지정
 */

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

const STORE_OPTIONS = [
  "보유 중 (영업 중인 매장)",
  "보유 중 (공실·임차 완료)",
  "알아보는 중",
  "없음 (본사 추천 희망)"
];

const TIMING_OPTIONS = [
  "1개월 이내", "3개월 이내", "6개월 이내", "6개월 이후", "미정 (정보 수집 중)"
];

/** HTML 이메일에 값을 넣기 전 이스케이프 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 길이를 제한하고 공백을 정리한다.
 * multiline이 아니면 줄바꿈을 공백 하나로 접어, 제목 줄에 개행이 섞이지 않게 한다.
 */
function clean(value, maxLength, multiline) {
  if (typeof value !== "string") return "";
  var text = multiline
    ? value.replace(/\r\n/g, "\n").replace(/[^\S\n]+/g, " ")
    : value.replace(/\s+/g, " ");
  return text.trim().slice(0, maxLength);
}

function buildEmailHtml(data, meta) {
  const row = (label, value) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e8e3dd;color:#8a8078;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8e3dd;color:#1a1715;font-size:15px;font-weight:600;">${value}</td>
    </tr>`;

  const messageBlock = data.message
    ? `<tr>
         <td style="padding:12px 16px;color:#8a8078;font-size:13px;vertical-align:top;">문의 내용</td>
         <td style="padding:12px 16px;color:#1a1715;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(data.message)}</td>
       </tr>`
    : "";

  return `<!doctype html>
<html lang="ko">
<body style="margin:0;padding:24px;background:#f5f2ee;font-family:'Malgun Gothic',-apple-system,BlinkMacSystemFont,sans-serif;">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e3dd;" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="background:#16130f;padding:26px 24px;">
        <p style="margin:0;color:#c9a86a;font-size:12px;letter-spacing:2px;font-weight:700;">JUNGYUKDAN</p>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:21px;font-weight:800;">새로운 창업 상담 신청</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 8px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          ${row("성함", escapeHtml(data.name))}
          ${row("연락처", `<a href="tel:${escapeHtml(data.phone)}" style="color:#c8342c;text-decoration:none;">${escapeHtml(data.phone)}</a>`)}
          ${row("희망 지역", `${escapeHtml(data.region)} ${escapeHtml(data.district)}`)}
          ${row("점포 유무", escapeHtml(data.store))}
          ${row("창업 시기", escapeHtml(data.timing))}
          ${messageBlock}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:18px 24px 24px;">
        <a href="tel:${escapeHtml(data.phone)}" style="display:block;background:#c8342c;color:#ffffff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-weight:700;font-size:15px;">바로 전화 걸기</a>
        <p style="margin:16px 0 0;color:#9a9089;font-size:12px;line-height:1.7;">
          접수 시각: ${escapeHtml(meta.receivedAt)}<br />
          이 메일은 정육단 창업 문의 페이지에서 자동 발송되었습니다.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(data, meta) {
  const lines = [
    "새로운 창업 상담 신청",
    "",
    `성함: ${data.name}`,
    `연락처: ${data.phone}`,
    `희망 지역: ${data.region} ${data.district}`,
    `점포 유무: ${data.store}`,
    `창업 시기: ${data.timing}`
  ];
  if (data.message) lines.push("", "문의 내용:", data.message);
  lines.push("", `접수 시각: ${meta.receivedAt}`);
  return lines.join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "POST 요청만 허용됩니다." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO;
  const from = process.env.INQUIRY_FROM || "정육단 창업문의 <onboarding@resend.dev>";

  if (!apiKey || !to) {
    console.error("환경변수 누락: RESEND_API_KEY 또는 INQUIRY_TO가 설정되지 않았습니다.");
    return res.status(500).json({
      ok: false,
      error: "메일 발송 설정이 완료되지 않았습니다. 전화로 문의해 주세요."
    });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};

  /* 스팸 봇 차단: 사람에게는 보이지 않는 필드가 채워졌다면 조용히 성공 처리 */
  if (clean(body.company, 100)) {
    return res.status(200).json({ ok: true });
  }

  const data = {
    name: clean(body.name, 40),
    phone: clean(body.phone, 20),
    region: clean(body.region, 20),
    district: clean(body.district, 40),
    store: clean(body.store, 40),
    timing: clean(body.timing, 40),
    message: clean(body.message, 2000, true)
  };

  /* 서버 측 검증 — 클라이언트 검증만 믿지 않는다 */
  const errors = [];
  if (!data.name) errors.push("성함을 입력해 주세요.");
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(data.phone.replace(/\s/g, ""))) {
    errors.push("연락처 형식이 올바르지 않습니다.");
  }
  if (!REGIONS.includes(data.region)) errors.push("희망 지역(시/도)을 선택해 주세요.");
  if (!data.district) errors.push("희망 지역(시/군/구)을 입력해 주세요.");
  if (!STORE_OPTIONS.includes(data.store)) errors.push("점포 유무를 선택해 주세요.");
  if (!TIMING_OPTIONS.includes(data.timing)) errors.push("예상 창업 시기를 선택해 주세요.");

  if (errors.length) {
    return res.status(400).json({ ok: false, error: errors[0] });
  }

  const meta = {
    receivedAt: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: from,
        to: to.split(",").map(function (address) { return address.trim(); }),
        subject: `[창업문의] ${data.name} · ${data.region} ${data.district}`,
        html: buildEmailHtml(data, meta),
        text: buildEmailText(data, meta)
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend 전송 실패:", response.status, detail);
      return res.status(502).json({
        ok: false,
        error: "메일 발송에 실패했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요."
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("문의 처리 중 오류:", error);
    return res.status(500).json({
      ok: false,
      error: "일시적인 오류가 발생했습니다. 전화로 문의해 주세요."
    });
  }
};

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
}
