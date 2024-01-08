import { css } from "https://cdn.skypack.dev/@emotion/css";
import { getHeight, getWidth, checkOverflow } from "./utilities.js";

const fullWidth = css`
  width: 100%;
`;
const growInHeight = css`
  height: 100%;
`;

/**
 * Limits the font size of an element to fit within specified constraints.
 * @param {HTMLElement} el - The element to apply the font size limit to.
 * @param {Object} settings - The configuration settings for the font size limit.
 * @param {number} [settings.maxFontSize=100] - The maximum font size allowed.
 * @param {boolean} [settings.growInHeight=false] - Whether the element should grow in height to fit the text or be limited by the initial height
 * @param {string} [settings.fontUnit="%"] - The unit of measurement for the font size.
 * @param {number} [settings.minFontSize=0] - The minimum font size allowed.
 * @param {number} [settings.maxLines] - The maximum number of lines allowed for the text.
 * @param {string} [settings.maxHeight=false] - A string that will be set when there's some type of overflow happening which is configured by the maxHeight prop. If this is set then we should be reducing the font size.
 * @returns {number} - The final font size applied to the element.
 * inspired by https://github.com/STRML/textFit
 *
 * @example
 * const element = document.getElementById("myElement");
 * const settings = {
 *   maxFontSize: 50,
 *   growInHeight: true,
 *   fontUnit: "px",
 *   minFontSize: 10,
 *   maxLines: 3
 * };
 * const fontSize = limiter(element, settings);
 * console.log("Final font size:", fontSize);
 */
export const limiter = (el, settings) => {
  let fontSize = settings.maxFontSize || 100;
  el.classList.add(fullWidth);

  let originalHeight;
  let originalWidth;
  let low;
  let mid;
  let high;
  if (settings.growInHeight) {
    el.classList.add(growInHeight);
  }
  originalWidth = getWidth(el);
  originalHeight = getHeight(el);
  let fontUnit = settings.fontUnit || "%";
  low = settings.minFontSize || 0;
  high = settings.maxFontSize || 100;
  // if there is no width then stop. it's not loaded yet
  if (isNaN(originalWidth)) return false;
  // if there is only width then just width only as that's better than nothing
  if (isNaN(originalHeight)) settings.widthOnly = true;

  fontSize = low;

  // Binary search for highest best fit
  while (low <= high) {
    mid = parseFloat(((high + low) / 2).toFixed(2));
    el.style.fontSize = mid + fontUnit;

    if (settings.growInHeight) {
      el.classList.add(growInHeight);
    }
    const scrollWidth = getWidth(el) <= originalWidth;
    const scrollHeight = settings.widthOnly || getHeight(el) <= originalHeight;
    el.classList.remove(growInHeight);

    // check if too many lines and if it is then we need to adjust the font size accordingly
    let fontSizeTooLarge = false;
    if (settings.maxLines) {
      fontSizeTooLarge = el.lineCount > settings.maxLines;
    }  
    // check if the height is too much and if it is then we need to adjust the font size accordingly but only if we don't have too many lines
    if (settings.maxHeight && !fontSizeTooLarge) {
      fontSizeTooLarge = checkOverflow(el, settings.maxHeight);
    }
    if (scrollWidth && scrollHeight && !fontSizeTooLarge) {
      fontSize = mid;
      low = mid + 0.01; // set font size to larger
    } else {
      high = mid - 0.01; // set font size to  smaller
    }
  }
  el.classList.remove(fullWidth);
  el.style.fontSize = Math.floor(fontSize) + fontUnit;

  return fontSize;
};
