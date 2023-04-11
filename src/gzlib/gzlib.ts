const zlib = require('zlib'); 
const fs = require('fs');  


class gzlid{
    createGzip(url: string, callback: any) {
        const gzip = zlib.createGzip(); 
        let inp: any;
        let out: any;
        fs.exists(url, async (exists: boolean) => {
            if(exists) {
                inp = await fs.createReadStream(url); 
                out = await fs.createWriteStream(`${url}.gz`);
                // inp.pipe(gzip).pipe(out); 
                return inp.pipe(gzip);
            } else {
                callback(exists);
            }
        });
    }

    async createUnzip(url: string, callback) {
        const unzip = zlib.createUnzip(); 
        const inp = await fs.createReadStream(url); 
        const out = await fs.createWriteStream(stringCut(url));
        await inp.pipe(unzip).pipe(out); 
        callback(stringCut(url));
    }
};

function stringCut (url: string): string {
    return url.slice(0, url.length-3);
};

module.exports = gzlid;