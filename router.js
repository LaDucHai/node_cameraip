const express = require('express');
const router = express.Router();
const gzlib = require('./src/gzlib/gzlib');
const sql = require('msnodesqlv8');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const {upload} = require('./model/multer');
// const { MongoClient, ObjectId } = require('mongodb');

const GetPost = require('getpost-mycameraip');

const stream = require('stream');
const zlib = require('zlib'); 
const fs = require('fs');  


const gzFile = new gzlib();
//gzFile.createUnzip('./data/data2/billGate.jpg.gz');
//gzFile.createGzip('./data/data2/billGate.jpg');


// Set up Global configuration access
dotenv.config();

// connect mongodb
// const mongoClient = new MongoClient('mongodb://localhost:27017');
// mongoClient.connect();
// const db = mongoClient.db('cameraip');

// connect mssql
// const SQL_connect = "server=127.0.0.1;Database=CameraIP;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";
const SQL_connect = "server=127.0.0.1;Database=CameraIP;Trusted_Connection=Yes;Driver={SQL Server Native Client 11.0}";

router.get("/", (req, res) =>{
    const head = {
        'Content-Type': 'image',
    }
    res.writeHead(200, head);
    // const gzip = zlib.createGzip(); 
    // const inp = fs.createReadStream('./data/data2/billGate.jpg');  
    // const out = fs.createWriteStream('./data/data2/billGate.jpg.gz');
    // inp.pipe(gzip).pipe(out);  
    // const unzip = zlib.createUnzip(); 
    // fs.createReadStream('./data/data2/billGate.jpg.gz').pipe(unzip).pipe(res);
    gzFile.createUnzip('./data/data2/billGate.jpg.gz', (url) => {
        fs.createReadStream(url).pipe(res);
    });
    //res.send('laduchai');
});

router.get('/login', (req, res) => {
    const account = req.query.account;
    const password = req.query.password

    const queryLogin = `SELECT * FROM dbo.AccountManager, dbo.PasswordManager 
                        WHERE dbo.AccountManager.AccountId = dbo.PasswordManager.AccountId AND dbo.AccountManager.Account = '${account}' 
                        AND dbo.PasswordManager.Stt = (SELECT MAX(dbo.PasswordManager.Stt) FROM dbo.AccountManager, dbo.PasswordManager 
                        WHERE dbo.AccountManager.AccountId = dbo.PasswordManager.AccountId AND dbo.AccountManager.Account = '${account}')`;
    sql.query(SQL_connect, queryLogin, (err, [inforLogin]) => {
        if(err) console.error(err);
        try {
            if(password===inforLogin.Password) {
                const queryInfor = `SELECT * FROM dbo.UserInformationManager 
                                    WHERE AccountId = '${inforLogin.AccountId}' AND Stt = (SELECT MAX(Stt) FROM dbo.UserInformationManager WHERE AccountId = '${inforLogin.AccountId}')`;
                sql.query(SQL_connect, queryInfor, (err, [inforUser]) => {
                    if(err) console.error(err);
                    try {
                        const inforUserObj = {
                            AccountId: inforUser.AccountId,
                            UserInformationManagerId: inforUser.UserInformationManagerId,
                            FirstName: inforUser.FirstName,
                            LastName: inforUser.LastName,
                            Avatar: inforUser.Avatar
                        };
                        res.send({
                            authentication: true,
                            token: jwt.sign(inforUserObj, process.env.tokenLogin_JWT_SECRET_KEY)
                        });
                    } catch (error) {
                        return res.status(401).send(error);
                    }
                });
            } else {
                res.send({
                    authentication: false,
                    token: null
                });
            }
        } catch (error) {
            return res.send('Account NOT exact');
        };
    });
});

router.get('/getUserInfor/:id', jwtVeryfication, (req, res) => {
    const verified = getJwtVerify(req, res);
    const query = `SELECT * FROM dbo.UserInformationManager WHERE UserInformationManagerId = '${req.params.id}'`;
    sql.query(SQL_connect, query, (err, [userInfor]) => {
        if(err) console.error(err);
        if(verified.UserInformationManagerId = req.params.id) {
            res.send(userInfor);
        } else {
            res.send('not')
        }
    });
});

// router.get('/getUserInfor/:id', async (req, res) => {
//     try {
//         const collection = db.collection('userManager');
//         const filteredDocs = await collection.find(ObjectId(req.params.id)).toArray();
//         res.send(filteredDocs);
//     } catch (error) {
//         return res.status(401).send(error);
//     }
// });

router.get('/getPost/:id', (req, res) => {
    const id = req.params.id;
    const getPost = new GetPost(id, 'null');
    try {
        getPost.GetPost(([Post]) => {
            GetUserInformation(Post.AccountId, null, (UserInformation) => {
                if(UserInformation) {
                    getPost.GetTextOverview(([TextOverview]) => {
                        getPost.GetImageVideo((ImageVideo) => {
                            res.send({
                                ...UserInformation,
                                TextOverview,
                                ImageVideo
                            });
                        });
                    });
                } else {
                    res.status(404).send('Not Found');
                }
            });
        });
    } catch (error) {
        res.status(404).send(error);
    };
});

router.get('/getImageVideo', (req, res) => {
    const accountId = req.query.accountId;
    const type = req.query.type;
    const pageIndex = req.query.pageIndex;
    const pageSize = req.query.pageSize;
    const query = `EXEC GetImageVideo ${accountId}, ${type}, ${pageIndex}, ${pageSize}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            res.send(data);
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.get('/getOverviewInformationOfProfile', (req, res) => {
    const accountId = req.query.accountId;
    const loginInfor = getJwtVerify(req, res);
    const reqUserId = loginInfor.AccountId;
    const query = `proc_OverviewInformationOfProfile ${accountId}, ${reqUserId}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.get('/getImageVideoOfProfile', (req, res) => {
    const accountId = req.query.accountId;
    const type = req.query.type;
    const pageIndex = req.query.pageIndex;
    const pageSize = req.query.pageSize;
    const loginInfor = getJwtVerify(req, res);
    const reqUserId = loginInfor.AccountId;
    const query = `EXEC proc_GetImageVideoOfProfile ${accountId}, ${type}, ${pageIndex}, ${pageSize}, ${reqUserId}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.get('/getImageVideoInteractiveAmount', (req, res) => {
    const imageVideoId = req.query.imageVideoId;
    const query = `EXEC proc_GetImageVideoInteractiveAmount ${imageVideoId}`;
    let json = {};
    let i = 0;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            json = Object.assign(json, data[0]);
            i++;
            if(i===4) {
                res.send(json);
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.post('/postFollow', (req, res) => {
    const data = req.body.data;
    const loginInfor = postJwtVerify(req, res);
    const followUser = loginInfor.AccountId;
    const query = `EXEC proc_PostFollow ${data.UnFollowOrFollow}, ${data.FollowedUser}, ${followUser}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.get('/getFollow', (req, res) => {
    const amount = req.query.amount;
    const followedUser = req.query.followedUser;
    const loginInfor = getJwtVerify(req, res);
    const followUser = loginInfor.AccountId;

    // amount = 1 if get follow amount of followedUser
    const query = `EXEC proc_GetFollow ${amount}, ${followedUser}, ${followUser}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.post('/postImageVideoLike', (req, res) => {
    const data = req.body.data;
    const loginInfor = postJwtVerify(req, res);
    const accountId = loginInfor.AccountId;
    const query = `EXEC proc_PostImageVideoLike ${data.postImageVideoId}, ${accountId}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

router.get('/getImageVideoLike', (req, res) => {
    const postImageVideoId = req.query.postImageVideoId;
    const loginInfor = getJwtVerify(req, res);
    const accountId = loginInfor.AccountId;

    const query = `EXEC proc_GetImageVideoLike ${postImageVideoId}, ${accountId}`;
    try {
        sql.query(SQL_connect, query, (err, data) => {
            if(err) console.error(err);
            if(Array.isArray(data)) {
                if(data.length>0) {
                    res.send(data);
                }
            }
        });
    } catch (error) {
        res.status(404).send('Not Found');
    };
});

// upload Files
router.post('/upload', jwtVeryfication, upload.array('photo', 50), (req, res) => {
    const verified = getJwtVerify(req);
    let fileArr = [];
    for(let i = 0; i < req.files.length; i++) {
        const path = req.files[i].path;
        const filename = req.files[i].filename;
        const mimetype = req.files[i].mimetype;
        const gzip = zlib.createGzip();
        const source = fs.createReadStream(path);
        const destination = fs.createWriteStream(`${path}.gz`);   
        stream.pipeline(source, gzip, destination, (err) => {
            if(err) {
                console.error('An error occurred:', err);
            }
            fs.unlink(path, (err) => {
                if (err) throw err;  
            });
        });
        fileArr.push({
            stt: i,
            filename: filename,
            mimetype: mimetype
        });
        if(i===(req.files.length-1)) {
            res.status(200).json({
                message: 'success!',
                fileArr: fileArr,
                id: verified.AccountId,
            });
        }
    }
});

router.post('/normalPost', postJwtVeryfication, (req, res) => {
    console.log(req.body, req.body.data.imageVideoArr)
    res.status(200).json({
        message: 'success!'
    });
})

router.get('/photo', (req, res) => {
    const id = req.query.id;
    const mimetype = req.query.mimetype;
    const filename = req.query.filename;
    try {
        if((mimetype==='image/jpeg')||(mimetype==='image/png')||(mimetype==='image/jpg')) {
            const path = `./photo/images/${id}/${filename}.gz`;
            const gunzip = zlib.createGunzip();
            fs.exists(path, (exists) => {
                if(exists) {
                    const head = {
                        "Content-Type": 'image/jpeg'
                    }    
                    res.writeHead(200, head);
                    const source = fs.createReadStream(path);
                    source.pipe(gunzip).pipe(res);
                }
            });
        } else if(mimetype==='video/mp4') {
            const gunzip = zlib.createGunzip();
            const path = `./photo/videos/${id}/${filename}.gz`;
            const stat = fs.statSync(path)
            const fileSize = stat.size
            const range = req.headers.range;
        
            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize-1
        
                // console.log({
                //     'start': start,
                //     'end': end
                // });
        
                if(start >= fileSize) {
                    res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
                    return
                }
                
                const chunksize = (end-start)+1
                const file = fs.createReadStream(path, {start, end})
                const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
                }
        
                res.writeHead(206, head)
                file.pipe(gunzip).pipe(res);
            } else {
                const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
                }
                res.writeHead(200, head);
                fs.createReadStream(path).pipe(gunzip).pipe(res);
            }
        } 
    } catch (error) {
        res.status(404).send('Not Found');
    }
});



function GetUserInformation(accountId, id, callback) {
    if(id===null) {
       if(accountId===null) {
        callback();
       } else {
        const queryMax = `SELECT MAX(Stt) FROM dbo.UserInformationManager WHERE AccountId = '${accountId}'`;
        const query = `SELECT * FROM dbo.UserInformationManager WHERE AccountId = '${accountId}' AND Stt = (${queryMax})`;
        sql.query(SQL_connect, query, (err, [UserInformation]) => {
            if(err) console.error(err);
            try {
                callback(UserInformation);
            } catch (error) {
                console.error(error);
            }
        });
       }
    } else {
        const query = `SELECT * FROM dbo.UserInformationManager WHERE UserInformationManagerId = '${id}'`;
        sql.query(SQL_connect, query, (err, [UserInformation]) => {
            if(err) console.error(err);
            try {
                callback(UserInformation);
            } catch (error) {
                console.error(error);
            }
        });
    }
};
  
function jwtVeryfication(req, res, next) {  
    try {
        const verified = getJwtVerify(req, res); 
        if(verified){
            next();
        }else{
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
};

function getJwtVerify(req, res) {
    try {
        const authHeader = req.headers[process.env.tokenLogin_TOKEN_HEADER_KEY];
        const token = authHeader && authHeader.split(" ")[1];
        // if (token == null) return res.sendStatus(401);
        if (token == null) return console.log('Token cant is NULL');
        const verified = jwt.verify(token, process.env.tokenLogin_JWT_SECRET_KEY);
        return verified;
    } catch (error) {
        res.status(401).send(error);
    }
};


function postJwtVeryfication(req, res, next) {  
    try {
        const verified = postJwtVerify(req, res); 
        if(verified){
            next();
        }else{
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
};
function postJwtVerify(req, res) {
    try {
        const authHeader = req.body.headers.Authorization;
        const token = authHeader && authHeader.split(" ")[1];
        // if (token == null) return res.sendStatus(401);
        if (token == null) return console.log('Token cant is NULL');
        const verified = jwt.verify(token, process.env.tokenLogin_JWT_SECRET_KEY);
        return verified;
    } catch (error) {
        res.status(401).send(error);
    }
};

module.exports = router;