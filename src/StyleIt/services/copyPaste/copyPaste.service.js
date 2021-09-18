import { block_elments, block_elments_queryString } from '../../constants/block_elms';
import { inline_elements } from '../../constants/inline_elems';
import { void_elements } from '../../constants/void_elms';
import spliterHtml from 'spliter-html';
import { pasteHtmlAtCaret, setCaretAt } from '../range.service';
import { getInheirtCss, setStyles } from '../style.service';
import { getCleanText, normalizeElement } from '../textEditor.service';

export default class CopyPaste {

  constructor(target, options) {
    if (options.plugins && typeof options.plugins.copyPaste === 'boolean' && options.plugins.copyPaste === false) {
      return;
    }
    this.target = target;
    this.stylesToPaste = typeof options.stylesToPaste === 'object' ? options.stylesToPaste : null;
    this.paste = this.paste.bind(this);
    this.copy = this.copy.bind(this);
    this.destroy = this.destroy.bind(this);
    this.start();
  }

  copy(event) {
    let html = '';
    if (window.getSelection) {
      let sel = window.getSelection();
      if (sel.rangeCount) {
        const container = document.createElement('div');
        for (let i = 0, len = sel.rangeCount; i < len; ++i) {
          const range = sel.getRangeAt(i);
          let copiedNode = range.cloneContents();
          container.appendChild(copiedNode);
          if (event.type === 'cut') {
            range.extractContents();
          }
          Array.from(container.childNodes).forEach(n => {
            if (n.nodeType === 3) {
              const parentCopiedNode = sel.getRangeAt(i).startContainer.parentNode;
              const collectedCSS = getInheirtCss(parentCopiedNode, this.target);
              const span = document.createElement('span');
              span.textContent = copiedNode.textContent;
              setStyles(span, collectedCSS);
              n.wrap(span);

            } else if (void_elements[n.nodeName] && n.nodeName !== 'BR') {
              n.parentElement.removeChild(n);
            }
          });

        }
        html = container;
      }
    } else if (document.selection) {
      if (document.selection.type === 'Text') {
        html = document.selection.createRange().htmlText;
      }
    }
    event.preventDefault();
    event.clipboardData.setData('styleit/html', html.innerHTML);
    event.clipboardData.setData('text/plain', html.textContent);
  }
  paste(event) {
    const isShifted = event.shiftKey;
    if (isShifted) {
      this.pastePlainText(event);
    } else {
      this.pasteWithStyles(event);
    }

  }

  pastePlainText(event) {
    const data = event.clipboardData || window.clipboardData;
    event.preventDefault();
    let copied = data.getData('text/plain').trim();
    copied = copied.replace(/\n/g, '<br/>');
    if (!copied.trim()) {
      return;
    }
    const p = document.createElement('p');
    p.innerHTML = copied;

    pasteHtmlAtCaret(p);
    setCaretAt(p);

    if (p.parentElement !== this.target) {
      p.unwrap();

    }
    Array.from(this.target.children).forEach(child => {
      if (!child.textContent.trim()) {
        this.target.removeChild(child);
      }
    });
  }
  pasteWithStyles(event) {
    event.preventDefault();
    const data = event.clipboardData || window.clipboardData;
    const copied = data.getData('styleit/html').trim();
    // on copied on the editor localy
    if (copied) {
      const pastedContainer = document.createElement('div');
      pastedContainer.innerHTML = copied;
      pasteHtmlAtCaret(pastedContainer);
      Array.from(pastedContainer.children).forEach(child => {
        if (!getCleanText(child.textContent) && !void_elements[child.nodeName] && (block_elments[child.nodeName] || inline_elements[child.nodeName])) {
          child.parentElement.removeChild(child);
        }
      });
      Array.from(pastedContainer.children).forEach(child => {

        const sameNode = child.parentElement.closest(block_elments_queryString);
        if (sameNode && block_elments[child.nodeName] && getCleanText(sameNode.textContent) === getCleanText(pastedContainer.textContent)) {
          sameNode.parentElement.insertBefore(child, sameNode);
        } else if (child.nodeType === 1 && block_elments[child.nodeName] && sameNode) {
          if (pastedContainer.children.length > 1) {
            child.insertAfter(document.createElement('BR'));
          }
          child.unwrap();
        } else if (!getCleanText(child.textContent)) {
          child.unwrap();
        }
      });
      const block = pastedContainer.closest(block_elments_queryString);
      if (block) {
        const parts = spliterHtml(pastedContainer, block, { tag: block.nodeName });
        if (parts) {
          parts.left.appendChild(parts.center);
          parts.center.appendChild(parts.right);
          parts.right.unwrap();
          parts.center.unwrap();
        }
      }
      normalizeElement(this.target);
      setCaretAt(pastedContainer);
      pastedContainer.unwrap();
    } else {
      this.pastePlainText(event);
    }
  }

  start() {
    this.target.addEventListener('paste', this.paste);
    this.target.addEventListener('copy', this.copy);
    this.target.addEventListener('cut', this.copy);
  }
  destroy() {
    if (this.target) {
      this.target.removeEventListener('paste', this.paste);
      this.target.removeEventListener('copy', this.copy);
      this.target.addEventListener('cut', this.copy);
    }
  }
}

