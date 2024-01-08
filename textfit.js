import { css } from "https://cdn.skypack.dev/@emotion/css";
import { getHeight, getWidth, detectBoundingOverflow, checkOverflow } from "./utilities.js";
import { limiter } from "./limiter.js";
import { lineCount } from "./line-count.js";
import debounce from "./debounce.js";

const styles = css`
  display: block;
  overflow-wrap: break-word;
  position: relative;
`;

customElements.define(
  "text-fit",
  class extends HTMLElement {
    static get observedAttributes() {
      return [
        "max-lines",
        "max-height",
        "width-only",
        "min-font-size",
        "max-font-size",
        "display-overflow-error",
        "font-unit",
        "debounce-time",
        "dont-grow-in-height",
        "disable-dynamic-font-size",
        "max-font-size",
        "min-font-size",
        "classname",
      ];
    }
    /**
     * Runs the validation process for the textfit web component.
     *
     * @param {Event} e - The event object.
     */
    runValidation(e) {
      this.done = false;

      if (this.observer) {
        this.observer.disconnect();
      }
      this.maxLines = parseInt(this.getAttribute("max-lines")) || false;
      // should the font size be dynamic. This can be turned off if the user just wants to use overflow and line counting features
      this.dynamicFontSize =
        !this.hasAttribute("disable-dynamic-font-size") || true;
      // should the overflow error be displayed over the element to let the user know there is an issue with the content
      this.logOverflowError =
        this.hasAttribute("log-overflow-error") || false;
      // the max height to allow the element to grow to before it is considered to be overflowing or textfit needs to happen. This supports a few dynamic values as well as pixel values
      this.maxHeight = this.getAttribute("max-height") || false;
      // how long to wait before running the validation
      this.debounceTime = parseInt(this.getAttribute("debounce-time")) || 0;
      this.observer = false;
      this.overflow = false;
      this.dontGrowInHeight = Boolean(this.hasAttribute("dont-grow-in-height")) || false;
      this.maxFontSize = parseFloat(this.getAttribute("max-font-size")) || 100;
      this.minFontSize = parseFloat(this.getAttribute("min-font-size")) || 20;
      this.fontUnit = this.getAttribute("font-unit") || "%";
      this.overflow = false;

      if (this.dynamicFontSize) {
        this.fontSize = limiter(this, {
          maxFontSize: this.maxFontSize,
          minFontSize: this.minFontSize,
          fontUnit: this.fontUnit,
          maxLines: this.maxLines,
          growInHeight: !this.dontGrowInHeight,
          maxHeight: this.maxHeight,
        });
      }

      if (this.maxLines) {
        let count = lineCount(this);
        this.dataset.lineCount = count.lineCount;
        if (count.lineCount > this.maxLines) {
          if (this.maxLines == 1) {
            this.overflow = "There can only be a single line of content here";
          } else {
            this.overflow = `There can't be more than ${this.maxLines} lines of content here`;
          }
        }
      }

      if (this.maxHeight) {
        if (checkOverflow(this, this.maxHeight)) {
          this.overflow = "More content has been added than space allows";
        }
      }

      if (this.overflow && this.logOverflowError) {
        console.warn(this, this.overflow);
      }

      this.observer = new MutationObserver(
        this.debounceTime > 0
          ? debounce(() => {
              this.runValidation();
            }, this.debounceTime)
          : () => {
              this.runValidation();
            }
      );
      this.observer.observe(this, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
      this.done = true; // this is so we can the page can check if it is done running
    }
    get lineCount() {
      return lineCount(this).lineCount;
    }
    get height() {
      return getHeight(this);
    }
    get width() {
      return getWidth(this);
    }
    addClassNames() {
      if (this.hasAttribute("classname")) {
        this.removeAttribute("class");
        this.classList.add(styles);
        this.getAttribute("classname")
          .trim()
          .replace(/\n/g, " ")
          .split(" ")
          .forEach((className) => {
            if (className.trim()) {
              this.classList.add(className.trim());
            }
          });
        this.removeAttribute("classname");
      }
    }
    connectedCallback() {
      this.classList.add(styles);
      this.addClassNames();

      document.fonts.ready.then((v) => {
        this.runValidation();
        window.addEventListener("resize", this.runValidation.bind(this));
      });
    }
    attributeChangedCallback(name) {
      if (name === "classname") {
        this.addClassNames();
      }
      this.runValidation();
    }
    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
      window.removeEventListener("resize", this.runValidation.bind(this));
    }
  }
);
