import { useCallback, useMemo, useState } from "react";
import { createEditor, Descendant, Editor, Element, Node, Text } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";

interface PassageEditorProps {
  className?: string
}

export default function PassageEditor({ className }: PassageEditorProps) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState([
    {
      type: "paragraph",
      children: [{ text: "" }],
    } as Descendant
  ]);

  /*[
    {
      type: "paragraph",
      children: [{
          type: "heading",
          children: [{ text: "Chapter one" }],
        } as HeadingElement,
        {
          type: "paragraph",
          children: [
            { text: "In the beginning " },
            { text: "1", superscript: true },
            { text: " God created the heavens and the earth." },
          ],
        } as ParagraphElement,
      ]
    } as Descendant
  ]*/
  
  type Headings = { [verse: number]: string };
  type Result = { text: string[]; headings: Headings };
  /*
  function processValue(value: any): Result {
    const headings: Headings = {};
    const textChunks: string[] = [];
    
    let currentHeading = "";
    let currentTextChunk = "";
    let prevVerseNumber = 0;
    
    // Flatten all text leaves in order
    console.log("V:", value)
    const leaves = value.flatMap((block: any) =>
      block.children.map((child: any) => {
        console.log("C:", child)
        return ({
        text: child.text,
        header: !!child.header,
        superscript: !!child.superscript,
      })})
    );
    
    console.log("L:", leaves)

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      
      if (leaf.header) {
        // Start collecting heading text
        headings[prevVerseNumber] = leaf.text;
        console.log("HEAD")
      } else if (leaf.superscript) {
        // Superscript found: if waiting for verse number, assign heading
        const verseNum = parseInt(leaf.text, 10);
        // if (waitingForVerseNumber && !isNaN(verseNum)) {
        //   headings[verseNum] = currentHeading.trim();
        //   currentHeading = "";
        prevVerseNumber = verseNum
        // } else {
          // Superscript not tied to heading: flush current text chunk first
          // if (currentTextChunk.trim()) {
          //   textChunks.push(currentTextChunk.trim());
          // }
          // currentTextChunk = "";
        // }
      } else {
        // Normal text: if we're waiting for verse number but got normal text, flush heading
        // if (waitingForVerseNumber) {
          // Heading did not get paired with a superscript, treat heading text as normal text
          // currentTextChunk += currentHeading;
          // currentHeading = "";
          // waitingForVerseNumber = false;
        // }
        // currentTextChunk += leaf.text;
        textChunks.push(leaf.text)
      }
    }

    // Flush leftover text chunk if any
    if (currentTextChunk.trim()) {
      textChunks.push(currentTextChunk.trim());
    }
    
    return { text: textChunks, headings };
  }
  */

  function extract(editor: Editor) {
    const headings: Record<number, string> = {};
    const textChunks: string[] = [];
    
    const visit = (node: any) => {
      if (Element.isElement(node)) {
        if (node.type === "heading") {
          headings[0] = node.children.map((c: any) => c.text).join("");
        }
        node.children.forEach(visit);
      } else if (Text.isText(node)) {
        if (node.superscript) {
          textChunks.push(`{sup:${node.text}}`);
        } else {
          textChunks.push(node.text);
        }
      }
    };
    
    editor.children.forEach(visit);
    
    return { headings, text: textChunks.join(" ") };
  }

  const handleChange = (newValue: any) => {
    setValue(newValue);
    
    const processed = extract(editor);
    console.log("Text chunks:", processed.text);
    console.log("Headings:", processed.headings);
    
    // Only run your own logic when there's an actual selection
    // const { selection } = editor;
    // if (selection) {
    //   // put side effects here if needed
    // }
  };
  
  const decorate = useCallback(([node, path]: any) => {
    const ranges: any[] = [];
    
    if (!Text.isText(node)) return ranges;
    const text = node.text;
    
    let prevText = "";
    let nextText = "";
    
    // Get block-level info
    const blockEntry = Editor.above(editor, {
      at: path,
      match: (n: any) => Editor.isBlock(editor, n),
    });
    if (!blockEntry) return ranges;
      
    const [, blockPath] = blockEntry;
  
    // Get previous block's text
    try {
      const prevEntry = Editor.previous(editor, { at: blockPath });
      prevText = prevEntry ? Node.string(prevEntry[0]) : "";
    } catch {
      prevText = "";
    }
    
    // Get next block's text
    try {
      const nextEntry = Editor.next(editor, { at: blockPath });
      nextText = nextEntry ? Node.string(nextEntry[0]) : "";
    } catch {
      nextText = "";
    }
    
    // Superscript numbers
    const numberRegex = /\d+/g;
    let match;
    while ((match = numberRegex.exec(text)) !== null) {
      ranges.push({
        superscript: true,
        anchor: { path, offset: match.index },
        focus: { path, offset: match.index + match[0].length },
      });
    }
    
    // Bold headers
    const isHeader =
      !/\d/.test(text) &&                                                         // 1. No numbers in current text
      /[A-Za-z]$/.test(text) &&                                                   // 2. Ends with a letter
      /^\d/.test(nextText) &&                                                     // 3. Next line starts with a number
      (!prevText || [".", "?", "!", "\""].some(e => prevText.trim().endsWith(e))) // 4. Previous line ends with a punctuation
    
    if (isHeader) {
      ranges.push({
        header: true,
        anchor: { path, offset: 0 },
        focus: { path, offset: text.length },
      });
    }
    console.log(ranges)
    return ranges;
  }, []);
  
  // const renderLeaf = useCallback(({ attributes, children, leaf }: any) => {
  //   if (leaf.superscript) {
  //     children = <sup style={{ color: "gray", padding: "0 0.2rem" }}>{children}</sup>;
  //   }
  //   if (leaf.header) {
  //     children = <span style={{ fontWeight: "bold", fontSize: "1.35em" }}>{children}</span>;
  //   }
  //   return <span {...attributes}>{children}</span>;
  // }, []);
  
  // editor.normalizeNode = decorate
  /*
  function toggleHeading(editor: Editor) {
    const isActive = Editor.nodes(editor, {
      match: (n: any) => n.type === "heading",
    });
    
    Transforms.setNodes(
      editor,
      { type: isActive ? "paragraph" : "heading" },
      { match: (n: any) => Editor.isBlock(editor, n) }
    );
  }
  
  function toggleSuperscript(editor: Editor) {
    const [match] = Editor.nodes(editor, {
      match: n => Text.isText(n) && n.superscript === true,
      universal: true,
    });
    
    Transforms.setNodes(
      editor,
      { superscript: !match },
      { match: Text.isText, split: true }
    );
  }*/
  
  const renderElement = (props: RenderElementProps) => {
    const { attributes, children, element } = props;
    return (element.type === "heading")
      ? <div style={{ fontWeight: "bold", fontSize: "1.35em" }} {...attributes}>{children}</div>
      : <div {...attributes}>{children}</div>
  };
  
  const renderLeaf = (props: RenderLeafProps) => {
    const { attributes, children, leaf } = props;
    
    let modified = children;
    if (leaf.superscript) {
      modified = <sup style={{ color: "gray", padding: "0 0.2rem" }}>{modified}</sup>;
    }
    
    return <span {...attributes}>{modified}</span>;
  };
  
  return (
    <Slate 
      editor={editor} 
      initialValue={value} 
      onChange={handleChange}
    >
      <Editable
        decorate={decorate}
        renderLeaf={renderLeaf}
        renderElement={renderElement}
        placeholder="Paste here..."
        renderPlaceholder={({ attributes, children }) =>      
          <span
            {...attributes}
            // className="py-5"
            style={{
              fontWeight: "normal",
              fontSize: "1rem",
              color: "gray",
            }}
          >
            {children}
          </span>
        }
        className={"p-5 border border-gray-800 rounded-lg " + className}
        spellCheck
        autoFocus
      />
    </Slate>
  );
}
