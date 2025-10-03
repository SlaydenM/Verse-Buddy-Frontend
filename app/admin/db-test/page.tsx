"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import dbAdmin from "@/db-admin.json";

const tests = [
  {
    name: "Sign Up (dummy)",
    fn: () => apiClient.signUp("test+signup@example.com", "Test1234!", "Test User"),
  },
  {
    name: "Sign In (dummy)",
    fn: () => apiClient.signIn("test+signup@example.com", "Test1234!"),
  },
  {
    name: "Sign Out",
    fn: () => apiClient.signOut(),
  },
  {
    name: "Reset Password (dummy)",
    fn: () => apiClient.resetPassword("test+signup@example.com"),
  },
  {
    name: "Get Profile",
    fn: () => apiClient.getProfile(),
  },
  {
    name: "Update Profile (dummy)",
    fn: () => apiClient.updateProfile({ display_name: "Test User Updated" }),
  },
  {
    name: "Get All References",
    fn: () => apiClient.getAllReferences(),
  },
  {
    name: "Create Reference (dummy)",
    fn: () => apiClient.createReference({ version: "KJV", book: "Genesis", chapter: 1, startVerse: 1, endVerse: 1, text: ["In the beginning..."] }),
  },
  {
    name: "Get Favorite References",
    fn: () => apiClient.getFavoriteReferences(),
  },
  {
    name: "Get Recent References",
    fn: () => apiClient.getRecentReferences(5),
  },
  {
    name: "Get Books With Counts",
    fn: () => apiClient.getBooksWithCounts(),
  },
  {
    name: "Get References By Book (Genesis)",
    fn: () => apiClient.getReferencesByBook("Genesis"),
  },
  {
    name: "Get Chapters With Counts (Genesis)",
    fn: () => apiClient.getChaptersWithCounts("Genesis"),
  },
  {
    name: "Get References By Chapter (Genesis 1)",
    fn: () => apiClient.getReferencesByChapter("Genesis", 1),
  },
  {
    name: "Save Verse Text (dummy id)",
    fn: () => apiClient.saveVerseText("dummy-id", ["Test verse text."]),
  },
  {
    name: "Health Check",
    fn: () => apiClient.healthCheck(),
  },
];

export default function DbTestPage() {
  const [results, setResults] = useState<(string | object)[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const newResults: (string | object)[] = [];
    for (const test of tests) {
      try {
        const res = await test.fn();
        newResults.push({ name: test.name, status: "success", result: res });
      } catch (err: any) {
        newResults.push({ name: test.name, status: "error", error: err?.message || String(err) });
      }
    }
    setResults(newResults);
    setLoading(false);
  };

  // Example: use credentials in a test (for demonstration)
  console.log("DB Admin Credentials:", dbAdmin);
  
  return (
    <div style={{ padding: 24 }}>
      <h1>Supabase API Endpoint Test</h1>
      <button onClick={runTests} disabled={loading} style={{ margin: "16px 0", padding: 8 }}>
        {loading ? "Running..." : "Run All Tests"}
      </button>
      <ul>
        {results.map((res: any, i) => (
          <li key={i} style={{ marginBottom: 16 }}>
            <strong>{res.name}:</strong> {res.status === "success" ? "✅ Success" : "❌ Error"}
            <pre style={{ color: "black", background: "#f4f4f4", padding: 8, borderRadius: 4, overflowX: "auto" }}>
              {JSON.stringify(res.status === "success" ? res.result : res.error, null, 2)}
            </pre>
          </li>
        ))}
      </ul>
    </div>
  );
}

