/*import React, { useState } from "react";

export default function ScriptureInput() {
  // ... (same as before)
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div className="max-w-xl space-y-4 p-4 bg-white shadow-md rounded-lg">
      {/* Same as before /}

      <button
        onClick={openModal}
        className="text-blue-600 underline"
      >
        Open Verse on Bible.com ↗
      </button>

      {/* Modal /}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Open Scripture</h2>
            <p className="mb-4 text-sm">
              To view this verse, click below to open the official Bible.com site. Copy and paste the text into this app once you're done.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-3 py-1 text-sm rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <a
                href={bibleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open Bible.com
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}*/

import React, { useState } from "react";

const books = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "John", "Romans", "Psalms"
];

const versions = [
  { name: "KJV (Public Domain)", id: 1, publicDomain: true },
  { name: "NKJV", id: 114, publicDomain: false },
];

const getBibleDotComUrl = (book: string, chapter: number, verse: number, versionId: number) => {
  const abbr = book.slice(0, 3).toUpperCase(); // crude abbreviation fallback
  return `https://www.bible.com/bible/${versionId}/${abbr}.${chapter}.${verse}`;
};

const publicDomainTexts: Record<string, string> = {
  "John 3:16 (KJV)": "For God so loved the world, that he gave his only begotten Son...",
};

export default function ScriptureInput() {
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(3);
  const [startVerse, setStartVerse] = useState(16);
  const [endVerse, setEndVerse] = useState(16);
  const [version, setVersion] = useState(versions[0]);
  const [text, setText] = useState("");

  const bibleUrl = getBibleDotComUrl(book, chapter, startVerse, version.id);
  const isPublicDomain = version.publicDomain;

  const handleAutoFill = () => {
    const key = `${book} ${startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`} (${version.name.split(" ")[0]})`;
    const found = publicDomainTexts[key];
    if (found) setText(found);
    else alert("This verse is not available for autofill.");
  };

  return (
    <div className="max-w-xl space-y-4 p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold">Enter Scripture Reference</h2>

      <div className="flex flex-col gap-2">
        <label>Book</label>
        <select value={book} onChange={e => setBook(e.target.value)} className="border rounded p-1">
          {books.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <label>Chapter</label>
        <input type="number" min={1} value={chapter} onChange={e => setChapter(+e.target.value)} className="border rounded p-1" />

        <label>Start Verse</label>
        <input type="number" min={1} value={startVerse} onChange={e => setStartVerse(+e.target.value)} className="border rounded p-1" />

        <label>End Verse</label>
        <input type="number" min={startVerse} value={endVerse} onChange={e => setEndVerse(+e.target.value)} className="border rounded p-1" />

        <label>Version</label>
        <select value={version.name} onChange={e => {
          const selected = versions.find(v => v.name === e.target.value);
          if (selected) setVersion(selected);
        }} className="border rounded p-1">
          {versions.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
        </select>
      </div>

      <a
        href={bibleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        Open Verse on Bible.com ↗
      </a>

      <textarea
        placeholder="Paste the scripture text here..."
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full border rounded p-2"
      />

      {isPublicDomain && (
        <button
          onClick={handleAutoFill}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Auto-Fill with KJV (Public Domain)
        </button>
      )}

      <p className="text-xs text-gray-600 italic">
        ⚠️ This app does not distribute copyrighted scripture. Please paste content from an official source (e.g., Bible.com). You are responsible for the use of entered text.
      </p>
    </div>
  );
}
