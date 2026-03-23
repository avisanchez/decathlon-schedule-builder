import ExcelJS from 'exceljs';
import { DaySchedule } from '../algo/types';
import { writeFile } from '@tauri-apps/plugin-fs';
import { BaseDirectory, downloadDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';


export async function exportDayScheduleToWorkbook(daySchedule?: DaySchedule): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Avi Sanchez";
    workbook.lastModifiedBy = "decathlon_schedule_builder.app";
    workbook.created = new Date();
    workbook.modified = new Date();

    // const schedule = daySchedule.getSchedule();
    // const groups = daySchedule.getGroups();

    const sheet = workbook.addWorksheet(`Group -1`);

    sheet.getRow(1).values = ["This", "is", "a", "test", "of", "excel", "js"]

    const path = await save({ defaultPath: 'output.xlsx' });

    const buffer = new Uint8Array(await workbook.xlsx.writeBuffer());
    await writeFile(path!, buffer);
}