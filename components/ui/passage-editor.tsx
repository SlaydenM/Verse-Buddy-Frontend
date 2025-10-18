import { BibleReference } from "@/types/bible";
import { useCallback, useMemo, useState } from "react";
import { createEditor, Descendant, Text, Transforms } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";

interface PassageDataDTO { 
  text: string[]; 
  headings: { [verseNum: number]: string };
  startVerse: number;
}

interface PassageEditorProps {
  className?: string;
  onPassageDataChange?: (data: PassageDataDTO) => void;
  initReference: Partial<BibleReference>;
}

export default function StudyEditor({ className, onPassageDataChange, initReference }: PassageEditorProps) {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState<Descendant[]>(generateSlate());
  
  function generateSlate(): Descendant[] {    
    const text = initReference?.text
    const headings = initReference?.headings
    
    if (!text || !headings) {
      return [{ type: "paragraph", children: [{ text: "" }] }]
    }
    
    const result: Descendant[] = [];
    let children: any = [];
    for (let i = 0; i < text.length; i++) {
      // Insert heading if present for this verse
      if (headings[i + 1]) {
        // Add prev paragraph
        if (children.length) {
          result.push({
            type: "paragraph",
            children: children
          });
          children = []
        }
        
        // Add new heading
        result.push({
          type: "heading",
          children: [{ text: headings[i + 1] }]
        });
      }
      
      // Insert verse paragraph
      const chunks = text[i].split('\n')
      const newLineStart = !chunks.at(0)
      const fc = i + 1
      
      // Remove newline character if new paragraph
      if (newLineStart || fc in headings) {
        chunks.shift();
      }

      if (length === 1) {
        children.push({ text: fc + text[i].trim() })
      } else {
        if (newLineStart && children.length) {
          // Add paragraph
          result.push({
            type: "paragraph",
            children: children
          });
          children = []
        }
        children.push({ text: fc + chunks[0].trim() })
        for (let j = 1; j < chunks.length; j++) {
          // Add paragraph
          result.push({
            type: "paragraph",
            children: children
          });
          
          // Add chunk
          children = [{ text: chunks[j].trim() }]
        }
      }
    }
    
    // Add last paragraph
    result.push({
        type: "paragraph",
        children: children
      });
    
    return result;
  }
  
  const processSlate = (value: Descendant[]) => {    
    const headings: {[verseNum: number]: string} = {}
    const text: string[] = []
    var startVerse: number = 0;
    
    var prevVerseNum = 0
    value.forEach((block: any) => {      
      if (block.type === "heading") {
        // Add to headers using key
        headings[prevVerseNum + 1] = block.children.map((child: any) => child.text).join(" ");
      } else {
        block.children.forEach((child: any) => {
          // Find last verse number
          const matches = child.text.match(/\d+/g);
          if (!matches) { // No verse numbers
            text[text.length - 1] += "\n" + child.text // Merge with previous verse
            return
          }
          const verseNum = matches.length > 0 ? parseInt(matches[matches.length - 1], 10) : prevVerseNum;
          prevVerseNum = verseNum; // Update prev
          
          // Find first verse num
          if (!startVerse) {
            startVerse = parseInt(matches.at(0), 10) || 1; 
          }
          
          // Split by verse number
          const newVerses: string[] = child.text.split(/\d{1,3}/).filter((part: string) => part !== "")
          if (newVerses) { // Add details
            newVerses[0] = "\n" + newVerses[0] // Add line break
            if (!/^[0-9]/.test(child.text[0])) { // First verse in block has no verse number
              text[text.length - 1] += newVerses[0] // Merge with previous verse
              newVerses.shift() // Remove merged verse from block
            }
          }
            
          // Add verses to text
          text.push(...newVerses)
          
          // If verse number does not follow previous chunk
          if (verseNum !== text.length)
            console.log("WRONG VERSE NUMBERS")
        });
      }
    });
    
    // Default first verse num
    if (!startVerse) {
      startVerse = 1; 
    }
    
    return { text, headings, startVerse } as PassageDataDTO;
  }
  
  // Decorate: tag numbers as superscript and headings
  const decorate = useCallback(([node, path]: any) => {
    const ranges: any[] = [];
    if (!Text.isText(node)) return ranges;
    
    // Superscript logic
    const regex = /\d+/g; // Any number
    let match;
    while ((match = regex.exec(node.text)) !== null) {
      ranges.push({
        superscript: true,
        anchor: { path, offset: match.index },
        focus: { path, offset: match.index + match[0].length },
      });
    }
    
    return ranges;
  }, [editor]);

  // Render leaf: show superscript and heading
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children, leaf, attributes } = props;
    if (leaf.superscript) {
      children = <span className="px-[0.15rem] text-xs text-gray-400 align-super">{children}</span>;
    }
    return <span {...attributes}>{children}</span>;
  }, []);
  
  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    switch (element.type) {
      case 'heading':
        return <h1 className="font-bold text-xl py-2">{children}</h1>
      case 'paragraph':
      default:
        return <p className="indent-5 my-3">{children}</p>
    }
  }, [])
  
  const handleChange = (newValue: Descendant[]) => {
    newValue.forEach((node, i) => {
      if ("children" in node) {
        const text = node.children.map((c: any) => c.text).join("");
        let prevText = "";
        let nextText = "";

        // Get previous block's text
        if (i > 0) {
          const prevNode = newValue[i - 1];
          prevText = "children" in prevNode ? prevNode.children.map((c: any) => c.text).join("") : "";
        }

        // Get next block's text
        if (i < newValue.length - 1) {
          const nextNode = newValue[i + 1];
          nextText = "children" in nextNode ? nextNode.children.map((c: any) => c.text).join("") : "";
        }

        const isHeading =
          !/\d/.test(text) &&                                                          // 1. No numbers in current text
          /[A-Za-z]$/.test(text) &&                                                    // 2. Ends with a letter
          /^\d/.test(nextText) &&                                                      // 3. Next line starts with a number
          (!prevText || [".", "?", "!", "\""].some(e => prevText.trim().endsWith(e))); // 4. Previous line ends with punctuation
        
        const newType = isHeading ? "heading" : "paragraph";

        if (node.type !== newType) {
          Transforms.setNodes(editor, { type: newType }, { at: [i] });
        }
      }
    });
    
    const passageData = processSlate(newValue);
    console.log("D:", passageData.text, passageData.headings, value);
    if (onPassageDataChange) {
      onPassageDataChange(passageData);
    }
  };
  
  return (
    <Slate 
      editor={editor} 
      initialValue={value} 
      onChange={handleChange}
      onValueChange={setValue}
    >
      <Editable
        decorate={decorate}
        renderLeaf={renderLeaf}
        renderElement={renderElement}
        placeholder="Paste here..."
        className={"p-5 border border-gray-800 rounded-lg " + (className ?? "")}
        spellCheck
        autoFocus
      />
    </Slate>
  );
}
