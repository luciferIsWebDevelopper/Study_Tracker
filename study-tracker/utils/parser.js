export const parseTasksFromText = (text) => {
  const lines = text.split("\n");

  let data = [];
  let currentSection = null;

  lines.forEach((line) => {
    const clean = line.trim();
    if (!clean) return;

    // 🟢 Detect section
    if (clean.startsWith("~~~")) {
      currentSection = clean.replace("~~~", "").trim();

      data.push({
        type: "section",
        title: currentSection,
      });

      return;
    }

    // 🟡 Task
    if (clean.startsWith("[ ]")) {
      if (!currentSection) return;

      data.push({
        type: "task",
        section: currentSection,
        text: clean.replace("[ ]", "").trim(),
        done: false,
        id: Date.now() + Math.random(),
      });

      return;
    }

    // 🔵 Notes / Motivation / Goals
    if (currentSection) {
      data.push({
        type: "note",
        section: currentSection,
        text: clean,
        id: Date.now() + Math.random(),
      });
    }
  });

  return data;
};