// get-column-ids.js
// Run once with: node get-column-ids.js
// Prints your board's real column IDs so you can update api/monday.js COL map.

const TOKEN    = '';  // <-- paste your token here, run locally, then DELETE it again
const BOARD_ID = '18414985004';

const query = `{
  boards(ids: [${BOARD_ID}]) {
    name
    columns {
      id
      title
      type
    }
  }
}`;

fetch('https://api.monday.com/v2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': TOKEN },
  body: JSON.stringify({ query })
})
  .then(r => r.json())
  .then(d => {
    const cols = d.data.boards[0].columns;
    console.log(`\nBoard: ${d.data.boards[0].name}\n`);
    console.log('Copy these IDs into api/monday.js COL map:\n');
    console.log('const COL = {');
    cols.forEach(c => {
      console.log(`  // "${c.title}" (${c.type})`);
      console.log(`  ${c.title.toLowerCase().replace(/[^a-z0-9]+/g,'_')}: '${c.id}',`);
    });
    console.log('};');
  })
  .catch(console.error);
