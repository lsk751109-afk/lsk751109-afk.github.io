(() => {
  "use strict";

  const config = window.JEIL_CONFIG || {};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const clean = (value) => typeof value === "string" ? value.trim() : "";
  const phone = clean(config.phone);
  const mobile = clean(config.mobile);
  const contactTitle = clean(config.contactTitle) || "문의 담당자";
  const email = clean(config.email);
  const address = clean(config.address);
  const businessHours = clean(config.businessHours) || "평일 09:00–18:00";

  function setContactRow(type, value, attribute, href) {
    const row = $(`[data-contact-row="${type}"]`);
    const target = $(`[${attribute}]`);
    if (!row || !target || !value) return;
    target.textContent = value;
    if (href) target.href = href;
    row.hidden = false;
  }

  setContactRow("phone", phone, "data-company-phone", `tel:${phone.replace(/[^0-9+]/g, "")}`);
  setContactRow("mobile", mobile, "data-company-mobile", `tel:${mobile.replace(/[^0-9+]/g, "")}`);
  setContactRow("email", email, "data-company-email", `mailto:${email}`);
  setContactRow("address", address, "data-company-address");

  const hoursNode = $("[data-company-hours]");
  if (hoursNode) hoursNode.textContent = businessHours;
  const contactTitleNode = $("[data-contact-title]");
  if (contactTitleNode) contactTitleNode.textContent = contactTitle;

  const footerValues = [
    ["[data-footer-phone]", phone],
    ["[data-footer-mobile]", mobile ? `${contactTitle} ${mobile}` : ""],
    ["[data-footer-email]", email],
    ["[data-footer-address]", address]
  ];
  footerValues.forEach(([selector, value]) => {
    const node = $(selector);
    if (node && value) {
      node.textContent = value;
      node.hidden = false;
    }
  });

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const menuButton = $(".menu-toggle");
  const nav = $(".primary-nav");
  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  };
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("open", !open);
      document.body.classList.toggle("menu-open", !open);
    });
    $$('a[href^="#"]', nav).forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => { if (window.innerWidth > 820) closeMenu(); });
  }

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -4%" })
    : null;
  $$(".reveal").forEach((node) => {
    if (revealObserver) revealObserver.observe(node);
    else node.classList.add("is-visible");
  });

  const lightbox = $("#equipment-lightbox");
  if (lightbox && typeof lightbox.showModal === "function") {
    const lightboxImage = $("img", lightbox);
    const lightboxCaption = $("p", lightbox);
    $$(".equipment-card").forEach((card) => {
      card.addEventListener("click", () => {
        lightboxImage.src = card.dataset.image || "";
        lightboxImage.alt = card.dataset.title || "설비 이미지";
        lightboxCaption.textContent = card.dataset.title || "";
        lightbox.showModal();
        document.body.classList.add("dialog-open");
      });
    });
    const closeLightbox = () => {
      lightbox.close();
      document.body.classList.remove("dialog-open");
    };
    $(".lightbox-close", lightbox)?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  }

  const toast = $("#toast");
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
  }

  const form = $("#inquiry-form");
  const submitLabel = $("[data-submit-label]");
  const formNote = $("[data-form-note]");
  if (email && submitLabel) {
    submitLabel.textContent = "이메일 문의 보내기";
    if (formNote) formNote.textContent = "입력한 내용은 사용자의 이메일 프로그램을 통해 전송됩니다.";
  } else if (mobile && submitLabel) {
    submitLabel.textContent = "문의서 복사하기";
    if (formNote) formNote.textContent = `작성 내용을 복사한 뒤 ${contactTitle} ${mobile}로 전달해 주세요.`;
  }

  function inquiryText(data) {
    return [
      "[제일솔루션 생산 협력 문의]",
      "",
      `회사명: ${data.get("company") || ""}`,
      `담당자: ${data.get("name") || ""}`,
      `연락처: ${data.get("phone") || ""}`,
      `회신 이메일: ${data.get("email") || ""}`,
      `문의 분야: ${data.get("service") || ""}`,
      `예상 수량: ${data.get("quantity") || "미정"}`,
      "",
      "문의 내용:",
      data.get("message") || ""
    ].join("\n");
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  if (form) {
    form.addEventListener("input", (event) => event.target.classList?.remove("field-error"));
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const required = $$('[required]', form);
      let firstInvalid = null;
      required.forEach((field) => {
        const invalid = field.type === "checkbox" ? !field.checked : !field.validity.valid;
        field.classList.toggle("field-error", invalid);
        if (invalid && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        showToast("필수 항목을 확인해 주세요.");
        return;
      }

      const data = new FormData(form);
      const text = inquiryText(data);
      if (email) {
        const subject = encodeURIComponent(`[생산 협력 문의] ${data.get("company")} / ${data.get("service")}`);
        const body = encodeURIComponent(text);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        showToast("이메일 프로그램을 여는 중입니다.");
      } else {
        try {
          await copyText(text);
          showToast("문의서가 복사되었습니다. 담당자에게 전달해 주세요.");
        } catch {
          showToast("복사하지 못했습니다. 입력 내용을 직접 저장해 주세요.");
        }
      }
    });
  }
})();
