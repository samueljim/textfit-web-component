import { css } from "https://cdn.skypack.dev/@emotion/css";
import { getHeight } from "./utilities.js";

const countingLines = css`
  * {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    min-height: 0 !important;
    max-height: none !important;
  }
`;

/**
 * Finds the first parent element with a valid height value. 
 * It's wild how unreliable the height value is in some cases.
 * @param {HTMLElement} el - The element to check.
 * @param {HTMLElement} target - The target element to compare with.
 * @returns {HTMLElement} - The element with a valid height value.
 */
const hasHeightValue = (el, target) => {
  if (el.isSameNode(target)) {
    return el;
  }
  if (
    ["inline", "inline-block"].includes(getComputedStyle(el).display) ||
    Number.isNaN(getHeight(el))
  ) {
    return hasHeightValue(el.parentElement, target);
  }
  return el;
};

/**
 * Retrieves all text nodes under a given element.
 *
 * @param {Element} el - The element to search for text nodes.
 * @returns {Array<Element>} - An array of elements containing text nodes.
 */
const textNodesUnder = (el) => {
  if (!el) return [];
  let n = null;
  let a = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  while ((n = walk.nextNode())) {
    if (n.textContent.trim()) {
      const { parentElement } = n;
      const e = hasHeightValue(parentElement, el);
      // if (e) exits and ins't already returned then add it to the list of elements to line check
      if (e && !a.includes(e)) {
        // if (e) has got a child in (a) then we need to remove the child
        // this is done to prevent the child from being counted twice
        a = a.filter((i) => !e.contains(i));
        a.push(e);
      }
    }
  }
  return a;
};

/**
 * @typedef {Object} LineCountResult
 * @property {number} lineCount - The number of lines in the element.
 * @property {number} naturalHeight - The natural height of the element.
 */
/**
 * Calculates the number of lines in an element's text content.
 * 
 * @param {HTMLElement} element - The DOM element to count the lines of.
 * @returns {LineCountResult} An object containing the line count and the natural height of the element.
 */
export const lineCount = (element) => {
  const naturalHeight = getHeight(element);
  
  const { classList } = element;
  classList.add(countingLines);

  let lineCount = 0;
  textNodesUnder(element).forEach((el) => {
    // get the height at the start
    let naturalNodeHeight = getHeight(el);
    // if it is possible get the height of the text itself using a range
    if (document.createRange) {
      let range = document.createRange();
      range.selectNodeContents(el);
      if (range.getBoundingClientRect) {
        let rect = range.getBoundingClientRect();
        if (rect) {
          naturalNodeHeight = rect.bottom - rect.top;
        }
      }
    }
    // add a line break and a space to the end of the text to change the height
    const counter = document.createElement("br");
    const textNode = document.createTextNode("\xa0");
    el.appendChild(counter);
    el.appendChild(textNode);

    // get the height of the text after the change
    let newHeight = getHeight(el);
    // if it is possible get the height of the text itself using a range
    if (document.createRange) {
      let range2 = document.createRange();
      range2.selectNodeContents(el);
      if (range2.getBoundingClientRect) {
        let rect2 = range2.getBoundingClientRect();
        if (rect2) {
          newHeight = rect2.bottom - rect2.top;
        }
      }
    }
    // remove the line break and space from the end of the text to reset the content
    el.removeChild(textNode);
    el.removeChild(counter);

    // work out how much extra space the line added
    const additionalLineNodeHeight = newHeight - naturalNodeHeight;
    if (additionalLineNodeHeight <= 0) {
      // if there is no added height then something is wrong
    }
    // work out the number of lines added
    const line = Math.round(naturalNodeHeight / additionalLineNodeHeight);
    el.dataset.linesCounted = line;
    lineCount += line;
  });
  classList.remove(countingLines);
  if (isNaN(lineCount)) {
    lineCount = false
  }
  return {
    lineCount,
    naturalHeight,
  };
};
