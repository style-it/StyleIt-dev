import { setStyle } from "../services/style.service";
import { splitHTML } from "../utilis/splitHTML";

//TODO:review
//question: should i add all the rules in one array or dispatch by css keys..
export function UseRules (data) {
    const ColorTextDecorationRule = (data) =>{
        if (data.key === "color") {
            const textDecoration = data.element.closest(`[style*='text-decoration']`);
            if (textDecoration) {
               const splits =  splitHTML(data.element,textDecoration);
               if(splits) {
                setStyle(splits.center, 'text-decoration',`${textDecoration.style.textDecoration} ${data.value}`);
               }
            }
        }
    }
    const Rules = [
        ColorTextDecorationRule
    ]
    Rules.forEach(rule=>rule(data));
}