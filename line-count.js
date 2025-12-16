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
  
  const computedStyle = getComputedStyle(el);
  const display = computedStyle.display;
  const height = getHeight(el);
  
  // Debug logging for problematic tests
  if (target.id && (target.id === 'test3' || target.id === 'test5')) {
    console.log(`  hasHeightValue check: ${el.tagName}.${el.className || 'no-class'} - display: ${display}, height: ${height}`);
  }
  
  // If element is inline or has no measurable height, look at parent
  if (["inline", "inline-block"].includes(display) || Number.isNaN(height) || height <= 0) {
    if (el.parentElement && el.parentElement !== target) {
      return hasHeightValue(el.parentElement, target);
    }
  }
  
  return el;
};

/**
 * Retrieves all text nodes under a given element, avoiding duplicate counting.
 * Uses a more sophisticated approach to handle nested structures.
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
      
      // Try to find the best element to measure
      let elementToMeasure = parentElement;
      
      // If the parent is the root element (direct text content), use it
      if (parentElement === el) {
        elementToMeasure = el;
      } else {
        const parentDisplay = getComputedStyle(parentElement).display;
        const parentTag = parentElement.tagName.toLowerCase();
        
        // Block-level semantic elements should be measured directly
        const blockSemanticTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'];
        
        // Inline semantic elements should often be grouped with their container
        const inlineSemanticTags = ['em', 'strong', 'b', 'i', 'span'];
        
        if (blockSemanticTags.includes(parentTag) || !["inline", "inline-block"].includes(parentDisplay)) {
          // Block elements or explicitly block-displayed elements: measure directly
          elementToMeasure = parentElement;
        } else if (inlineSemanticTags.includes(parentTag)) {
          // Inline semantic elements: check if there are other inline siblings
          // If so, measure the container instead to group them together
          const container = parentElement.parentElement;
          if (container && container !== el) {
            const siblings = Array.from(container.children);
            const inlineSiblings = siblings.filter(sibling => {
              const siblingDisplay = getComputedStyle(sibling).display;
              return ["inline", "inline-block"].includes(siblingDisplay) && sibling.textContent.trim();
            });
            
            if (inlineSiblings.length > 1) {
              // Multiple inline siblings - measure the container instead
              elementToMeasure = container;
            } else {
              // Single inline element - measure it directly
              elementToMeasure = parentElement;
            }
          } else {
            elementToMeasure = parentElement;
          }
        } else {
          // Generic elements: try to find a meaningful ancestor
          let current = parentElement.parentElement;
          while (current && current !== el) {
            const currentDisplay = getComputedStyle(current).display;
            if (!["inline", "inline-block"].includes(currentDisplay)) {
              elementToMeasure = current;
              break;
            }
            current = current.parentElement;
          }
          
          if (current === el) {
            elementToMeasure = parentElement;
          }
        }
      }
      
      // Debug: log what we're choosing to measure
      if (el.id && (el.id === 'test3' || el.id === 'test5')) {
        console.log(`Text: "${n.textContent.trim().substring(0, 20)}..." -> Parent: ${parentElement.tagName}.${parentElement.className || 'no-class'} -> Measuring: ${elementToMeasure.tagName}.${elementToMeasure.className || 'no-class'} (display: ${getComputedStyle(elementToMeasure).display})`);
      }
      
      // Special case: if elementToMeasure is the root element (direct text content)
      if (elementToMeasure === el) {
        // For direct text content, we should measure the root element itself
        if (!a.includes(el)) {
          a.push(el);
        }
      } else if (elementToMeasure && !a.includes(elementToMeasure)) {
        // Remove any children of this element from the array to prevent double counting
        a = a.filter((existing) => !elementToMeasure.contains(existing));
        
        // Only add if this element isn't contained within an existing element
        const isContained = a.some((existing) => existing.contains(elementToMeasure));
        if (!isContained) {
          a.push(elementToMeasure);
        }
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
/**
 * Gets accurate height measurement using Range API when available
 * @param {HTMLElement} el - Element to measure
 * @returns {number} - Height in pixels
 */
const getAccurateHeight = (el) => {
  let height = getHeight(el);
  
  // Use Range API for more accurate text height measurement
  if (document.createRange && el.firstChild) {
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rect = range.getBoundingClientRect();
      if (rect && rect.height > 0) {
        height = rect.height;
      }
    } catch (e) {
      // Fallback to element height if Range API fails
    }
  }
  
  return height;
};

export const lineCount = (element) => {
  const naturalHeight = getHeight(element);
  
  const { classList } = element;
  classList.add(countingLines);

  let totalLineCount = 0;
  const elementsToCount = textNodesUnder(element);
  
  // Debug logging for problematic tests
  if (element.id && (element.id === 'test3' || element.id === 'test5')) {
    console.log(`\n=== Processing ${element.id} ===`);
    console.log('Elements found:', elementsToCount.length);
    elementsToCount.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tagName}.${el.className || 'no-class'}: "${el.textContent.trim()}"`);
    });
  }
  
  // Cache for elements we've already measured to avoid redundant calculations
  const heightCache = new Map();
  
  elementsToCount.forEach((el, index) => {
    // Disable caching for now to ensure accurate counts during debugging
    // const elementId = `${el.tagName}-${el.textContent.trim().substring(0, 30)}`;
    
    // Skip caching to ensure we get accurate results
    // if (heightCache.has(elementId)) {
    //   totalLineCount += heightCache.get(elementId);
    //   return;
    // }
    
    // Measure natural height
    const naturalNodeHeight = getAccurateHeight(el);
    
    if (naturalNodeHeight <= 0) {
      // Skip elements with no height
      heightCache.set(elementId, 0);
      return;
    }
    
    // Add measurement elements
    const counter = document.createElement("br");
    const textNode = document.createTextNode("\xa0");
    el.appendChild(counter);
    el.appendChild(textNode);

    // Measure height after adding line break
    const newHeight = getAccurateHeight(el);
    
    // Clean up measurement elements
    try {
      el.removeChild(textNode);
      el.removeChild(counter);
    } catch (e) {
      // Elements might have been removed by other processes
      console.warn('TextFit: Error cleaning up measurement elements', e);
    }

    // Calculate line height and count
    const additionalLineNodeHeight = newHeight - naturalNodeHeight;
    
    let elementLineCount = 0;
    if (additionalLineNodeHeight > 0) {
      // Calculate lines, ensuring we get at least 1 line for elements with content
      elementLineCount = Math.max(1, Math.round(naturalNodeHeight / additionalLineNodeHeight));
      
      // Sanity check: if calculated lines seem too high, cap them
      const maxReasonableLines = Math.floor(naturalHeight / (additionalLineNodeHeight * 0.5));
      if (elementLineCount > maxReasonableLines && maxReasonableLines > 0) {
        elementLineCount = maxReasonableLines;
      }
    } else if (naturalNodeHeight > 0) {
      // Fallback: if we can't measure line height properly, assume 1 line
      elementLineCount = 1;
    }
    
    // Skip caching for now
    // heightCache.set(elementId, elementLineCount);
    el.dataset.linesCounted = elementLineCount;
    totalLineCount += elementLineCount;
    
    // Debug logging for problematic tests
    if (element.id && (element.id === 'test3' || element.id === 'test5')) {
      console.log(`Line count debug for ${element.id}:`, {
        element: `${el.tagName}.${el.className}`,
        text: el.textContent.trim(),
        lines: elementLineCount,
        naturalHeight: naturalNodeHeight,
        additionalHeight: additionalLineNodeHeight,
        elementIndex: index
      });
    }
  });
  classList.remove(countingLines);
  
  // Validate final result
  if (isNaN(totalLineCount) || totalLineCount < 0) {
    totalLineCount = 0;
  }
  
  // Ensure we have at least 1 line if there's visible content
  if (totalLineCount === 0 && element.textContent.trim().length > 0) {
    totalLineCount = 1;
  }
  
  return {
    lineCount: totalLineCount,
    naturalHeight,
    elementsProcessed: elementsToCount.length
  };
};
