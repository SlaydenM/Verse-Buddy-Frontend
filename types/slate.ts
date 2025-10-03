// types.ts
import { BaseEditor } from "slate";
import { ReactEditor } from "slate-react";

// Inline text node
export type CustomText = {
  text: string;
  superscript?: boolean;
  heading?: boolean;
};

// Block-level elements
export type ParagraphElement = {
  type: "paragraph";
  children: CustomText[];
};

export type HeadingElement = {
  type: "heading";
  children: CustomText[];
};

// Union types
export type CustomElement = ParagraphElement | HeadingElement;
export type CustomEditor = BaseEditor & ReactEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}
