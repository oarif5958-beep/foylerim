/* Okuma modu: beyaz ekranda tek cümle. Panel ve telefon sayfası aynı dosyayı kullanır; kartları core/okuma.py hazırlar.
   Okuma.ac(kartlar, { id, tamEkran }) · ilerleme: dokun, kaydır, boşluk/ok tuşları, sunum kumandası. */
(function () {
  const CSS = `
.ok-ekran { position: fixed; inset: 0; z-index: 9999; background: #fff; color: #000; display: flex; flex-direction: column;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif; user-select: none; -webkit-user-select: none;
  touch-action: none; overscroll-behavior: none; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
.ok-ust { flex: none; display: flex; align-items: center; gap: 6px; padding: 6px 10px; }
.ok-ust button { border: 0; background: none; color: #767676; font: inherit; font-size: 16px; font-weight: 600; min-height: 44px; padding: 0 12px; cursor: pointer; border-radius: 10px; }
.ok-ust button:hover { background: #f2f2f2; }
.ok-ust .ok-acik { color: #000; }
.ok-ara { flex: 1; }
.ok-etiket { flex: none; text-align: center; color: #0a6ebd; font-weight: 700; font-size: clamp(18px, 3.4vh, 34px); padding: 0 5vw 10px; }
.ok-etiket:empty { display: none; }
.ok-kutu { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 4vw 3vh; overflow: hidden; }
.ok-metin { width: 100%; flex: none; text-align: center; font-weight: 700; line-height: 1.16; letter-spacing: -.01em; text-wrap: balance; overflow-wrap: normal; word-break: normal; }
.ok-cubuk { flex: none; height: 6px; background: #ececec; }
.ok-cubuk i { display: block; height: 100%; background: #000; width: 0; transition: width .15s; }`;

  const dur = { acik: null };

  function stilEkle() {
    if (document.getElementById("okStil")) return;
    const s = document.createElement("style");
    s.id = "okStil"; s.textContent = CSS;
    document.head.append(s);
  }
  const oku = (k, v) => { try { const x = localStorage.getItem(k); return x === null ? v : x; } catch (e) { return v; } };
  const yaz = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* depolama yoksa sadece bu oturum */ } };

  // Yazıyı kutuya sığan en büyük boyuta getirir; uzun kelime satıra taşmaz
  function sigdir(m, kutu) {
    const cs = getComputedStyle(kutu);
    const G = kutu.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const Y = kutu.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (G <= 0 || Y <= 0) return;
    let az = 14, cok = Math.floor(Math.min(Y * 0.42, G * 0.2));
    const sigiyor = (px) => { m.style.fontSize = px + "px"; return m.scrollWidth <= m.clientWidth + 1 && m.offsetHeight <= Y + 1; };
    while (cok - az > 1) {
      const orta = Math.floor((az + cok) / 2);
      if (sigiyor(orta)) az = orta; else cok = orta;
    }
    m.style.fontSize = (sigiyor(cok) ? cok : az) + "px";
  }

  function ac(kartlar, ayar) {
    if (dur.acik || !kartlar || !kartlar.length) return;
    ayar = ayar || {};
    stilEkle();
    const anahtar = "okuma:" + (ayar.id || "");
    let teknik = oku("okuma:teknik", "1") === "1";
    const gorunen = () => kartlar.filter((k) => teknik || k.tur !== "teknik");
    let liste = gorunen();
    const son = +oku(anahtar, 0) || 0;                   // kaldığı yerden; föy bitmişse baştan
    let kart = liste[son >= liste.length - 1 ? 0 : son];

    const dugme = (metin, baslik, is) => { const b = document.createElement("button"); b.type = "button"; b.textContent = metin; b.title = baslik; b.onclick = is; return b; };
    const ekran = document.createElement("div"); ekran.className = "ok-ekran"; ekran.tabIndex = -1;
    const ust = document.createElement("div"); ust.className = "ok-ust";
    const sayac = dugme("", "Başa dön", () => git(0));
    const ara = document.createElement("span"); ara.className = "ok-ara";
    const tekD = dugme("Teknik", "Çekim notlarını göster ya da gizle (T)", () => tekDegis());
    const kapat = dugme("Kapat ✕", "Kapat (Esc)", () => bitir());
    ust.append(sayac, ara, tekD, kapat);
    const etiket = document.createElement("div"); etiket.className = "ok-etiket";
    const kutu = document.createElement("div"); kutu.className = "ok-kutu";
    const m = document.createElement("div"); m.className = "ok-metin";
    kutu.append(m);
    const cubuk = document.createElement("div"); cubuk.className = "ok-cubuk";
    const dolu = document.createElement("i"); cubuk.append(dolu);
    ekran.append(ust, etiket, kutu, cubuk);

    function ciz() {
      const i = liste.indexOf(kart);
      sayac.textContent = `${i + 1} / ${liste.length}`;
      tekD.classList.toggle("ok-acik", teknik);
      etiket.textContent = kart.tur === "teknik" ? (kart.etiket || "Çekim") : "";
      m.textContent = kart.metin;
      dolu.style.width = ((i + 1) / liste.length * 100) + "%";
      sigdir(m, kutu);
      yaz(anahtar, String(i));
    }
    function git(i) { kart = liste[Math.max(0, Math.min(i, liste.length - 1))]; ciz(); }
    const ileri = () => git(liste.indexOf(kart) + 1);
    const geri = () => git(liste.indexOf(kart) - 1);
    function tekDegis() {
      teknik = !teknik; yaz("okuma:teknik", teknik ? "1" : "0");
      const yeni = gorunen(), sira = kartlar.indexOf(kart);
      kart = yeni.includes(kart) ? kart : (kartlar.slice(sira).find((k) => yeni.includes(k)) || yeni[yeni.length - 1]);
      liste = yeni; ciz();
    }

    function tus(e) {
      const ad = e.key;
      if (ad === " " || ad === "ArrowRight" || ad === "ArrowDown" || ad === "PageDown" || ad === "Enter") ileri();
      else if (ad === "ArrowLeft" || ad === "ArrowUp" || ad === "PageUp" || ad === "Backspace") geri();
      else if (ad === "Home") git(0);
      else if (ad === "End") git(liste.length - 1);
      else if (ad === "Escape") bitir();
      else if (ad === "t" || ad === "T") tekDegis();
      else return;
      e.preventDefault(); e.stopPropagation();
    }
    // Dokunma ve fare: sol taraf geri, kalan yer ileri; yatay kaydırma da sayfa çevirir
    let bas = null;
    function indi(e) { bas = e.target.closest("button") ? null : { x: e.clientX, y: e.clientY }; }
    function kalkti(e) {
      if (!bas) return;
      const dx = e.clientX - bas.x, dy = e.clientY - bas.y;
      bas = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) ileri(); else geri(); }
      else if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { if (e.clientX < window.innerWidth * 0.3) geri(); else ileri(); }
    }
    const boyut = () => sigdir(m, kutu);

    // Okurken telefon ekranı kapanmasın (destek yoksa sessizce geçer)
    let kilit = null;
    async function uyanikKal() {
      try { if ("wakeLock" in navigator && document.visibilityState === "visible") kilit = await navigator.wakeLock.request("screen"); } catch (e) { kilit = null; }
    }
    const gorunum = () => { if (document.visibilityState === "visible" && dur.acik) uyanikKal(); };

    function tamEkran(acilsin) {
      if (ayar.tamEkran) { try { ayar.tamEkran(acilsin); } catch (e) { /* pencere modunda devam */ } return; }
      try {
        if (acilsin && ekran.requestFullscreen) ekran.requestFullscreen().catch(() => {});
        else if (!acilsin && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } catch (e) { /* desteklemeyen tarayıcıda normal ekranda kalır */ }
    }

    function bitir() {
      dur.acik = null;
      document.removeEventListener("keydown", tus, true);
      document.removeEventListener("visibilitychange", gorunum);
      window.removeEventListener("resize", boyut);
      if (kilit) { kilit.release().catch(() => {}); kilit = null; }
      tamEkran(false);
      ekran.remove();
      if (ayar.kapaninca) ayar.kapaninca();
    }

    dur.acik = { bitir, git };
    document.body.append(ekran);
    document.addEventListener("keydown", tus, true);
    document.addEventListener("visibilitychange", gorunum);
    window.addEventListener("resize", boyut);
    ekran.addEventListener("pointerdown", indi);
    ekran.addEventListener("pointerup", kalkti);
    ekran.focus();
    tamEkran(true);
    uyanikKal();
    ciz();
  }

  window.Okuma = { ac, kapat: () => dur.acik && dur.acik.bitir() };
})();
