// 見出しテキストを 1 文字ずつ span に分割するユーティリティ（split-text-animation スキル）。
// 各文字を outer（overflow: hidden のマスク）> inner（動かす実体）の 2 重にする。
// inner を yPercent: 100 → 0 すると「行の中からせり上がる」表現になる。
// 生成構造に対応する CSS（.char-mask / .char / .word）は global.css にある。

// 1 文字ずつマスク 2 重の span にする。スペースは span にせずテキストノードで挿入する
// （inline-block 同士の間に自然な語間を残すため）
export const splitChars = (el) => {
  if (el.dataset.split === "true") return; // 二重分割ガード

  const text = el.textContent;
  el.textContent = "";

  for (const char of text) {
    if (char === " ") {
      el.insertAdjacentText("beforeend", " ");
      continue;
    }
    const mask = document.createElement("span");
    mask.className = "char-mask";
    mask.setAttribute("aria-hidden", "true");

    const inner = document.createElement("span");
    inner.className = "char";
    inner.textContent = char;

    mask.appendChild(inner);
    el.appendChild(mask);
  }

  el.dataset.split = "true";
};

// 単語ごとに .word で包んでから中を 1 文字分割する。
// inline-block の文字 span は単語の途中でも折り返すため、複数単語の英文見出しでは必須。
// 分割後の .char を NodeList で返すので、そのまま GSAP のターゲットにできる
export const splitCharsByWord = (el) => {
  if (el.dataset.wordSplit === "true") return el.querySelectorAll(".char");

  const text = el.textContent;
  el.textContent = "";

  for (const [i, word] of text.split(" ").entries()) {
    if (i > 0) el.insertAdjacentText("beforeend", " ");
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    wordSpan.textContent = word;
    wordSpan.setAttribute("aria-hidden", "true");
    el.appendChild(wordSpan);
    splitChars(wordSpan); // 単語内をさらに 1 文字分割
  }

  el.dataset.wordSplit = "true";
  return el.querySelectorAll(".char");
};
