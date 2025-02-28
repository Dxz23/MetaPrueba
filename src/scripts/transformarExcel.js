import XLSX from 'xlsx';
import path from 'path';

function transformarTelefonos() {
  try {
    const inputFile = path.join(process.cwd(), 'listado_numeros.xlsx');
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (let row of data) {
      if (row.TELEFONO) {
        const rawPhone = String(row.TELEFONO).trim();
        if (!rawPhone.startsWith('+52')) {
          row.TELEFONO = `+52${rawPhone}`;
        }
      }
    }

    const newWorksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[sheetName] = newWorksheet;
    const outputFile = path.join(process.cwd(), 'listado_numeros_transformado.xlsx');
    XLSX.writeFile(workbook, outputFile);

    console.log('Archivo transformado y guardado como listado_numeros_transformado.xlsx');
  } catch (error) {
    console.error('Error en transformarTelefonos:', error);
  }
}

transformarTelefonos();
