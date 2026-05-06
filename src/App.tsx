
import { useEffect, useState } from "react";
import MultiDayWorkspace from "./schedule/MultiDayWorkspace";
import { Menu, MenuItem, Submenu } from "@tauri-apps/api/menu";

function App() {

    // useEffect(() => {
    //     async function setupMenu() {
    //         const aboutSubmenu = await Submenu.new({
    //             text: 'About',
    //             items: [
    //                 await MenuItem.new({
    //                     id: 'quit',
    //                     text: 'Quit',
    //                     action: () => console.log('Quit pressed'),
    //                 }),
    //             ],
    //         });

    //         const fileSubmenu = await Submenu.new({
    //             text: 'File',
    //             items: [
    //                 await MenuItem.new({
    //                     id: 'new',
    //                     text: 'New Project',
    //                     action: () => console.log('New clicked'),
    //                 }),
    //                 await MenuItem.new({
    //                     id: 'open',
    //                     text: 'Open',
    //                     action: () => console.log('Open clicked'),
    //                 }),
    //                 await MenuItem.new({
    //                     id: 'save_as',
    //                     text: 'Save As...',
    //                     action: () => console.log('Save As clicked'),
    //                 }),
    //             ],
    //         });

    //         const editSubmenu = await Submenu.new({
    //             text: 'Edit',
    //             items: [
    //                 await MenuItem.new({
    //                     id: 'undo',
    //                     text: 'Undo',
    //                     action: () => console.log('Undo clicked'),
    //                 }),
    //                 await MenuItem.new({
    //                     id: 'redo',
    //                     text: 'Redo',
    //                     action: () => console.log('Redo clicked'),
    //                 }),
    //             ],
    //         });

    //         const m = await Menu.new({
    //             items: [aboutSubmenu, fileSubmenu, editSubmenu],
    //         });

    //         await m.setAsAppMenu();
    //     }

    //     setupMenu();
    // }, []);

    return (
        <>
            <MultiDayWorkspace />
        </>
    );
}

export default App;
