/**
 * Returns the bounding rectangle of an element.
 *
 * @param {Element} element - The element to get the bounding rectangle of.
 * @returns {DOMRect} The bounding rectangle of the element.
 */
const getRect = (element) => element.getBoundingClientRect();

/**
 * Calculates the height of an element, taking into account padding and border widths.
 * @param {HTMLElement} el - The element for which to calculate the height.
 * @returns {number} The calculated height of the element.
 */
export const getHeight = (el) => {
  let height = getRect(el).height;
  const style = window.getComputedStyle(el, null);
  const boxSizing = style.getPropertyValue("box-sizing");
  if (boxSizing === "border-box") {
    const paddingTop = parseFloat(style.getPropertyValue("padding-top"));
    const paddingBottom = parseFloat(style.getPropertyValue("padding-bottom"));
    const borderTop = parseFloat(style.getPropertyValue("border-top-width"));
    const borderBottom = parseFloat(
      style.getPropertyValue("border-bottom-width")
    );
    height = height - paddingTop - paddingBottom - borderTop - borderBottom;
  }
  return height;
};

/**
 * Calculates the width of an element, taking into account padding and border.
 * @param {HTMLElement} el - The element for which to calculate the width.
 * @returns {number} The calculated width of the element.
 */
export const getWidth = (el) => {
  let width = getRect(el).width;
  const style = window.getComputedStyle(el, null);
  const boxSizing = style.getPropertyValue("box-sizing");
  if (boxSizing === "border-box") {
    const paddingLeft = parseFloat(style.getPropertyValue("padding-left"));
    const paddingRight = parseFloat(style.getPropertyValue("padding-right"));
    const borderLeft = parseFloat(style.getPropertyValue("border-left-width"));
    const borderRight = parseFloat(
      style.getPropertyValue("border-right-width")
    );
    width = width - paddingLeft - paddingRight - borderLeft - borderRight;
  }
  return width;
};

/**
 * Detects the bounding overflow of an element within a container.
 * @param {HTMLElement} element - The element to detect the overflow for.
 * @param {HTMLElement} container - The container element.
 * @returns {Object} - An object containing properties to determine the bounding overflow.
 */
export const detectBoundingOverflow = (element, container) => ({
    /**
     * Checks if the element collides with the top of the container.
     * @returns {boolean} - True if the element collides with the top, false otherwise.
     */
    get collidedTop() {
        return getRect(element).top < getRect(container).top;
    },
    /**
     * Checks if the element collides with the bottom of the container.
     * @returns {boolean} - True if the element collides with the bottom, false otherwise.
     */
    get collidedBottom() {
        return getRect(element).bottom > getRect(container).bottom;
    },
    /**
     * Checks if the element collides with the left side of the container.
     * @returns {boolean} - True if the element collides with the left side, false otherwise.
     */
    get collidedLeft() {
        return getRect(element).left < getRect(container).left;
    },
    /**
     * Checks if the element collides with the right side of the container.
     * @returns {boolean} - True if the element collides with the right side, false otherwise.
     */
    get collidedRight() {
        return getRect(element).right > getRect(container).right;
    },
    /**
     * Checks if the element collides in the vertical direction (top or bottom).
     * @returns {boolean} - True if the element collides in the vertical direction, false otherwise.
     */
    get collidedY() {
        return this.collidedTop || this.collidedBottom;
    },
    /**
     * Checks if the element collides in the horizontal direction (left or right).
     * @returns {boolean} - True if the element collides in the horizontal direction, false otherwise.
     */
    get collidedZ() {
        return this.collidedLeft || this.collidedRight;
    },
    /**
     * Checks if the element collides in any direction (vertical or horizontal).
     * @returns {boolean} - True if the element collides in any direction, false otherwise.
     */
    get collidedAny() {
        return this.collidedY || this.collidedZ;
    },
    /**
     * Calculates the overflow distance from the top of the container.
     * @returns {number} - The overflow distance from the top.
     */
    get overflowTop() {
        return getRect(container).top - getRect(element).top;
    },
    /**
     * Calculates the overflow distance from the bottom of the container.
     * @returns {number} - The overflow distance from the bottom.
     */
    get overflowBottom() {
        return getRect(element).bottom - getRect(container).bottom;
    },
    /**
     * Calculates the overflow distance from the left side of the container.
     * @returns {number} - The overflow distance from the left side.
     */
    get overflowLeft() {
        return getRect(container).left - getRect(element).left;
    },
    /**
     * Calculates the overflow distance from the right side of the container.
     * @returns {number} - The overflow distance from the right side.
     */
    get overflowRight() {
        return getRect(element).right - getRect(container).right;
    },
});

export const checkOverflow = (element, maxHeightMode) => {
  if (maxHeightMode === "parent") {
    // Check if this element is larger than its parent height. 
    let scrollHeight = Math.ceil(element.scrollHeight);
    element.dataset.calculatedScrollHeight = scrollHeight;
    if (scrollHeight > Math.ceil(getHeight(element.parentElement))) {
      return true
    }
    return false
  } else if (maxHeightMode === "outerbox") {
    // Check if this is elements bounding box is larger than its parent bounding box.
    if (element.parentNode) {
      let boundingBox = detectBoundingOverflow(element, element.parentNode);
      if (boundingBox.collidedBottom) {
        return true
      }
    }
    return false
  } else if (maxHeightMode === "innerbox") {
    // Check if any of the children elements bounding box is larger than the element. 
    if (element.childNodes) {
      return element.childNodes.some((child) => {
        let boundingBox = detectBoundingOverflow(child, element);
        if (boundingBox.collidedBottom) {
          return true
        }
      });
    }
    return false
  } else if (maxHeightMode === "css") {
    // Check that the max scrollHeight is not larger than the css max height set on the element.
    let scrollHeight = Math.ceil(element.scrollHeight);
    element.dataset.calculatedScrollHeight = scrollHeight;
    const computedBlockStyle = window.getComputedStyle(element);
    const maxHeight = parseFloat(computedBlockStyle.maxHeight);
    if (!maxHeight) {
      console.warn(
        element,
        "There needs to be a max height set on the element if you want to use a CSS mode limiter"
      );
    }
    if (scrollHeight > Math.ceil(maxHeight)) {
      return true
    }
    return false
  } else if (maxHeightMode === "self") {
    // Check that the max scrollHeight is not larger than its measured height. 
    let scrollHeight = Math.ceil(element.scrollHeight);
    element.dataset.calculatedScrollHeight = scrollHeight;
    if (scrollHeight > Math.ceil(getHeight(element))) {
      return true
    }
    return false
  } else if (maxHeightMode === "onScreen") {
    // check that the element is not clipping the edges of the screen
    const rect = element.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      return true
    }
    return false
  } else if (maxHeightMode.endsWith("%")) {
    // make it so the element is at most a % of the screen height
    let viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let scrollHeight = Math.ceil(element.scrollHeight);
    element.dataset.calculatedScrollHeight = scrollHeight;
    if (scrollHeight > Math.ceil(viewportHeight * parseFloat(maxHeightMode.replace("%", "")) / 100)) {
      return true
    }
    return false
  } else if (!isNaN(maxHeightMode)) {
    // assume it is a number and use it as the max height
    let scrollHeight = Math.ceil(element.scrollHeight);
    element.dataset.calculatedScrollHeight = scrollHeight;
    if (scrollHeight > Math.ceil(maxHeightMode)) {
      return true
    }
    return false
  }
}