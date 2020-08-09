import { setStyle } from "../services/style.service";

//TODO:review
export function UseRules (data) {
    const ColorTextDecorationRule = (data) =>{
        debugger
        if (data.key === "color") {
            const textDecoration = data.element.closest(`[style*='text-decoration']`);
            if (textDecoration) {
                setStyle(textDecoration, 'text-decoration-color', data.value);
            }
        }
    }
    const Rules = [
        ColorTextDecorationRule
    ]
    Rules.forEach(rule=>rule(data));
}