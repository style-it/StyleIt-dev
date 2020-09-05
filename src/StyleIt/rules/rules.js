import { setStyle, normalizeStyle } from "../services/style.service";
import { splitHTML } from "../utilis/splitHTML";
import { normalizeElement } from "../services/textEditor.service";

//TODO:review
export function UseRules(data) {
    const ColorTextDecorationRule = (data) => {
        if (data.key === "color") {
            const textDecoration = data.element.closest(`[style*='text-decoration']`);
            if (textDecoration) {
                const splits = splitHTML(data.element, textDecoration);
                if (splits) {
                    normalizeStyle();
                    setStyle(splits.center, 'text-decoration-color', `${data.value}`);
                    for (const key in splits) {
                        const element = splits[key];
                        normalizeElement(element);
                    }
                } else {
                    setStyle(textDecoration, 'text-decoration-color', `${data.value}`);
                }
            }
        }
    }
    const Rules = [
        ColorTextDecorationRule
    ]
    Rules.forEach(rule => rule(data));
}