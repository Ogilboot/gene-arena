import { existsSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import { app } from "./app.js";

const PORT = Number(process.env.PORT ?? 3001);

const dist = join(process.cwd(), "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(join(dist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Gene Arena server listening on http://localhost:${PORT}`);
});
