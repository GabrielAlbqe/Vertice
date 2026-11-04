function cell(value){let text=String(value ?? '');if(/^\s*[=+\-@]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';}
function csv(rows){return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n')+'\r\n';}
module.exports={cell,csv};
