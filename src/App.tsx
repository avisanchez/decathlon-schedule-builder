import { useEffect } from "react";
import MultiDayWorkspace from "./schedule/MultiDayWorkspace";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

function App() {
    useEffect(() => {
        // Create an async function inside the effect
        const setupUpdater = async () => {
            try {
                const update = await check();
                if (update) {
                    console.log(`Update found: ${update.version}`);
                    await update.downloadAndInstall();
                    await relaunch();
                }
            } catch (error) {
                // This will catch the "Could not fetch" error 
                // and allow your app to keep running in dev mode
                console.error("Updater failed or no release found:", error);
            }
        };

        // Only run the updater in production, not during 'tauri dev'
        // unless you are specifically testing the update flow.
        if (!import.meta.env.DEV) {
            setupUpdater();
        }
    }, []);

    return (
        <>
            <MultiDayWorkspace />
        </>
    );
}

export default App;