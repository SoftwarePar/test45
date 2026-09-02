/* DS Parts · Exportador VCF para nueva linea WhatsApp Business
   Exporta contactos de la base operativa excluyendo Zona Oeste y telefonos duplicados. */
(()=>{
  'use strict';

  const WEST_LOCALITIES=[
    'MORON','CASTELAR','HAEDO','EL PALOMAR','ITUZAINGO','HURLINGHAM','VILLA TESEI','WILLIAM MORRIS',
    'RAMOS MEJIA','SAN JUSTO','LA MATANZA','LOMAS DEL MIRADOR','VILLA LUZURIAGA','LA TABLADA','TAPIALES',
    'ALDO BONZI','CIUDAD EVITA','ISIDRO CASANOVA','RAFAEL CASTILLO','GREGORIO DE LAFERRERE','LAFERRERE',
    'GONZALEZ CATAN','VIRREY DEL PINO','MERLO','LIBERTAD','SAN ANTONIO DE PADUA','PADUA','PARQUE SAN MARTIN',
    'MARIANO ACOSTA','PONTEVEDRA','MORENO','PASO DEL REY','LA REJA','FRANCISCO ALVAREZ','TRUJUI','CUARTEL V',
    'GENERAL RODRIGUEZ','MARCOS PAZ'
  ];

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
  const escV=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');

  function isZonaOeste(c){
    const zone=norm(c?.zona||c?.region||c?.zona_comercial||'');
    if(zone.includes('OESTE')||zone==='ZO'||zone==='Z/O')return true;
    const loc=norm(c?.localidad||'');
    return WEST_LOCALITIES.some(x=>loc===x||loc.includes(x));
  }

  function phoneDigits(raw){return String(raw||'').replace(/\D/g,'')}
  function normalizePhone(raw){
    let p=phoneDigits(raw);
    if(!p)return'';
    if(p.startsWith('0054'))p=p.slice(2);
    if(p.startsWith('549'))return'+'+p;
    if(p.startsWith('54')){
      const rest=p.slice(2).replace(/^0/,'');
      if(rest.startsWith('9'))return'+54'+rest;
      return'+549'+rest.replace(/^15/,'');
    }
    p=p.replace(/^0/,'');
    if(p.startsWith('9')&&p.length===11)return'+54'+p;
    if(p.length>=10&&p.length<=11)return'+549'+p.replace(/^15/,'');
    return'+'+p;
  }

  window.exportVCF=function(){
    if(!window.DATA&&typeof DATA==='undefined')return alert('La base todavia no esta abierta.');
    const contacts=(typeof DATA!=='undefined'?DATA.contacts:window.DATA.contacts)||[];
    const seen=new Set();
    let cards='',included=0,excludedWest=0,duplicates=0,noPhone=0;

    contacts.map(x=>typeof rec==='function'?rec(x.id):x).forEach(c=>{
      if(isZonaOeste(c)){excludedWest++;return}
      const raw=c.whatsapp||c.telefono||'';
      const tel=normalizePhone(raw);
      if(!tel){noPhone++;return}
      const key=phoneDigits(tel);
      if(seen.has(key)){duplicates++;return}
      seen.add(key);
      included++;
      const name=`DS Parts - ${c.localidad||'Sin localidad'} - ${c.nombre||'Contacto'}`;
      cards+='BEGIN:VCARD\r\n';
      cards+='VERSION:3.0\r\n';
      cards+=`FN:${escV(name)}\r\n`;
      cards+=`N:${escV(c.nombre||'Contacto')};;;;\r\n`;
      cards+=`TEL;TYPE=CELL:${tel}\r\n`;
      if(c.email)cards+=`EMAIL;TYPE=INTERNET:${escV(c.email)}\r\n`;
      cards+=`NOTE:${escV(['DS Parts Argentina',c.rubro,c.localidad].filter(Boolean).join(' | '))}\r\n`;
      cards+='END:VCARD\r\n';
    });

    if(!included)return alert('No se encontraron contactos para exportar despues de excluir Zona Oeste.');
    dl('DS_Parts_WhatsApp_Sin_Zona_Oeste.vcf',cards,'text/vcard;charset=utf-8');
    setTimeout(()=>alert(`VCF generado: ${included} contactos. Zona Oeste excluida: ${excludedWest}. Duplicados omitidos: ${duplicates}. Sin telefono: ${noPhone}.`),150);
  };
})();
