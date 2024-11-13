import { ScalableProps } from "../../../types/three-components";
// Text Component
export interface TextObjectProps extends ScalableProps {
    textContent: string;
    defaultFont: string;
    threeObjectPlugin: string;
    textColor: string;
}

declare const  TextObject: React.FC<TextObjectProps>;
export default TextObject;