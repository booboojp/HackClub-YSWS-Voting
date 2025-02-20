const { spawn } = require(`child_process`);
const path = require(`path`);

const pbPath = path.join(__dirname, `../pocketbase/pocketbase.exe`);
const pbProcess = spawn(pbPath, [`serve`, `--dir`, `../pb_data`]);

pbProcess.stdout.on(`data`, (data) => { console.log(`[PocketBase]: ${data}`); });

pbProcess.stderr.on(`data`, (data) => { console.error(`[PocketBase Error]: ${data}`); });

pbProcess.on(`close`, (code) => {console.log(`PocketBase exited with code ${code}`); });
