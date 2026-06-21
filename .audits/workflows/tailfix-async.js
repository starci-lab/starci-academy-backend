const fs = require("fs");
const base = "D:/Repositories/starci-academy-backend/.mount/data/courses/1-system-design-mastery/modules/3-communication-patterns/contents/2-asynchronous-event-driven/bodies";
const files = ["0-typescript", "1-java", "2-csharp", "3-go"].flatMap(d => [d + "/vi.md", d + "/en.md"]);
for (const f of files) {
  const vi = f.endsWith("vi.md");
  const tail = vi ? "— mở từng luồng để chạy." : "— expand a flow to run it.";
  const path = base + "/" + f;
  let t = fs.readFileSync(path, "utf8");
  t = t.split(" " + tail + "\n").join("\n");
  t = t.split(tail + "\n").join("");
  t = t.replace("\n::::accordion\n", "\n" + tail + "\n\n::::accordion\n");
  fs.writeFileSync(path, t);
  console.log("fixed", f);
}
