import { useEffect } from "react";
import MultiDayWorkspace from "./schedule/MultiDayWorkspace";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

function App() {
    useEffect(() => {
        async function setupUpdater() {
            const update = await check();
            if (update) {
                console.log(
                    `found update ${update.version} from ${update.date} with notes ${update.body}`
                );
                let downloaded = 0;
                let contentLength: number | undefined = 0;
                // alternatively we could also call update.download() and update.install() separately
                await update.downloadAndInstall((event) => {
                    switch (event.event) {
                        case 'Started':
                            contentLength = event.data.contentLength;
                            console.log(`started downloading ${event.data.contentLength} bytes`);
                            break;
                        case 'Progress':
                            downloaded += event.data.chunkLength;
                            console.log(`downloaded ${downloaded} from ${contentLength}`);
                            break;
                        case 'Finished':
                            console.log('download finished');
                            break;
                    }
                });

                console.log('update installed');
                await relaunch();
            }
            console.log("no update found");
        }

        try {
            setupUpdater();
        } catch (error) {
            alert(`Fetching updated failed.\n\n${error}`);
            console.error("setupUpdater failed with error: ", error);
        }
    }, []);

    return (
        <>
            <MultiDayWorkspace />
        </>
    );
}

export default App;