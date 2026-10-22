const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

// Render backend ka URL (Claude Desktop config se aata hai)
const API_URL =
  process.env.API_URL || "https://student-backend-i6bj.onrender.com/api/students";

async function callApi(path = "", options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(90000), // Render free tier so jata hai
    ...options,
  });
  return res.json();
}

const reply = (data, isError = false) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  isError,
});

const safe = (fn) => async (args) => {
  try {
    return await fn(args);
  } catch (e) {
    return reply({ error: e.message }, true);
  }
};

function buildServer() {
  const server = new McpServer({ name: "student-db", version: "1.0.0" });

  server.registerTool(
    "list_students",
    { title: "List all students", description: "Get all student records from the database.", inputSchema: {} },
    safe(async () => {
      const json = await callApi();
      return reply(json.data ?? json, !json.success);
    })
  );

  server.registerTool(
    "search_students",
    {
      title: "Search students",
      description: "Search by studentId, name, email or department (partial match).",
      inputSchema: { query: z.string().describe("e.g. 'computer', 'Rahul', 'ST101'") },
    },
    safe(async ({ query }) => {
      const json = await callApi();
      const q = query.toLowerCase();
      const students = (json.data || []).filter((s) =>
        [s.studentId, s.name, s.email, s.department].some((v) =>
          String(v || "").toLowerCase().includes(q)
        )
      );
      return reply({ count: students.length, students });
    })
  );

  server.registerTool(
    "get_student",
    {
      title: "Get student by ID",
      description: "Get one student using the exact studentId (e.g. ST101).",
      inputSchema: { studentId: z.string() },
    },
    safe(async ({ studentId }) => {
      const json = await callApi(`/${encodeURIComponent(studentId)}`);
      return reply(json.data ?? json, !json.success);
    })
  );

  server.registerTool(
    "add_student",
    {
      title: "Add student",
      description: "Insert a new student record into the database.",
      inputSchema: {
        studentId: z.string().describe("Unique ID, e.g. ST101"),
        name: z.string(),
        email: z.string(),
        department: z.string(),
        semester: z.number().int().min(1).max(12),
        contact: z.string().optional(),
      },
    },
    safe(async (student) => {
      const json = await callApi("", { method: "POST", body: JSON.stringify(student) });
      return reply(json, !json.success);
    })
  );

  server.registerTool(
    "update_student",
    {
      title: "Update student",
      description: "Update an existing student by studentId. Send only the fields to change.",
      inputSchema: {
        studentId: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        department: z.string().optional(),
        semester: z.number().int().min(1).max(12).optional(),
        contact: z.string().optional(),
      },
    },
    safe(async ({ studentId, ...changes }) => {
      const json = await callApi(`/${encodeURIComponent(studentId)}`, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      return reply(json, !json.success);
    })
  );

  server.registerTool(
    "delete_student",
    {
      title: "Delete student",
      description: "Permanently delete a student record by studentId.",
      inputSchema: { studentId: z.string() },
    },
    safe(async ({ studentId }) => {
      const json = await callApi(`/${encodeURIComponent(studentId)}`, { method: "DELETE" });
      return reply(json, !json.success);
    })
  );

  return server;
}

// MODE 1 (default): Claude Desktop ke liye, koi deploy nahi
// MODE 2: MCP_SECRET set ho to website ke liye HTTP server (optional, Step 6)
if (process.env.MCP_SECRET) {
  const express = require("express");
  const app = express();
  app.use(express.json());
  app.get("/", (req, res) => res.send("Student MCP server is running"));
  app.post(`/mcp/${process.env.MCP_SECRET}`, async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });
  app.listen(process.env.PORT || 3000, () => console.error("MCP HTTP server running"));
} else {
  (async () => {
    await buildServer().connect(new StdioServerTransport());
    console.error("student-db MCP server running (stdio)");
  })();
}