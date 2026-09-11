// Load the per-type people files and movements, merged for the map.
// Fetches each source in parallel, verifies the responses, parses them as
// JSON, and returns a single people array plus the movements list.
export async function loadData() {
  // One file per category, merged into a single people array so the map still
  // shows everyone together. Order here defines the merge order below.
  // NOTE: philosophers are disabled for now (Lao Tzu stretched the timeline
  // back too far); the file stays in /data and can be re-added here later.
  const sources = {
    artists: "/data/artists.json",
    authors: "/data/authors.json",
    movements: "/data/movements.json",
  };
  try {
    const entries = Object.entries(sources);
    const responses = await Promise.all(entries.map(([, url]) => fetch(url)));
    responses.forEach((res, i) => {
      if (!res.ok) throw new Error(`${entries[i][0]}.json: HTTP ${res.status}`);
    });

    const [artists, authors, movements] = await Promise.all(
      responses.map((res) => res.json())
    );
    const people = [...artists, ...authors];

    console.log("✅ Data loaded");
    console.log(`people (${people.length}):`, people);
    console.log(`movements (${movements.length}):`, movements);

    return { people, movements };
  } catch (err) {
    console.error("❌ Failed to load data:", err);
  }
}
