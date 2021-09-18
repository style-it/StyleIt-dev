import { setStyle, normalizeStyle } from '../services/style.service';
import { normalizeElement } from '../services/textEditor.service';
import spliterHtml from 'spliter-html';
// TODO:review
export function useRules(data) {
  const colorTextDecorationRule = _data => {
    if (_data.key === 'color') {
      const textDecoration = _data.element.closest(`[style*='text-decoration']`);
      if (textDecoration) {
        const splits = spliterHtml(_data.element, textDecoration);
        if (splits) {
          normalizeStyle();
          setStyle(splits.center, 'text-decoration-color', `${_data.value}`);
          for (const key in splits) {
            if (Object.prototype.hasOwnProperty.call(splits, key)) {
              const element = splits[key];
              normalizeElement(element);
            }
          }
        } else {
          setStyle(textDecoration, 'text-decoration-color', `${_data.value}`);
        }
      }
    }
  };
  const Rules = [
    colorTextDecorationRule
  ];
  Rules.forEach(rule => rule(data));
}
