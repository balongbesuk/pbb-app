const fs = require('fs');
const { PDFDocument, PDFName, PDFDict, PDFStream } = require('pdf-lib');
const jsQR = require('jsqr');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

async function extractQR() {
  const buf = fs.readFileSync('public/arsip-pbb/351704001900100100.pdf');
  const doc = await PDFDocument.load(buf);
  const imagesInDoc = [];
  
  const enumerateImages = (dict) => {
    if (!dict) return;
    const xobjs = dict.get(PDFName.of('XObject'));
    if (xobjs instanceof PDFDict) {
      for (const [key, value] of xobjs.dict.entries()) {
        const stream = doc.context.lookup(value);
        if (stream instanceof PDFStream) {
          const subtype = stream.dict.get(PDFName.of('Subtype'));
          if (subtype === PDFName.of('Image')) {
            const filter = stream.dict.get(PDFName.of('Filter'))?.name;
            const width = stream.dict.get(PDFName.of('Width'));
            const height = stream.dict.get(PDFName.of('Height'));
            imagesInDoc.push({
              name: key.name,
              filter,
              width: width,
              height: height,
              stream
            });
          }
        }
      }
    }
  };

  const pages = doc.getPages();
  pages.forEach(p => {
    enumerateImages(p.node.Resources);
  });

  console.log(`Found ${imagesInDoc.length} images`);
  
  for (let img of imagesInDoc) {
     console.log(`- Image: ${img.name}, filter: ${img.filter}, size: ${img.width}x${img.height}`);
     try {
       const bytes = img.stream.getContentsString ? Buffer.from(img.stream.getContentsString(), 'binary') : img.stream.contents;
       if (!bytes) continue;
       
       let imageData;
       if (img.filter === 'DCTDecode') {
         // JPEG
         const rawImageData = jpeg.decode(bytes, { useTArray: true });
         imageData = { data: rawImageData.data, width: rawImageData.width, height: rawImageData.height };
       } else if (img.filter === 'FlateDecode') {
         // Try to parse raw pixels or PNG? FlateDecode usually means deflated raw pixels.
         // We might need to handle raw colorspace depending on ColorSpace dict.
         console.log('Skipping FlateDecode for now unless we know format');
       }
       if (imageData) {
         const code = jsQR(imageData.data, imageData.width, imageData.height);
         if (code) {
           console.log(`FOUND QR:`, code.data);
         }
       }
     } catch (e) {
       console.log("Error processing", img.name, e.message);
     }
  }
}

extractQR().catch(console.error);
