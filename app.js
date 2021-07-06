const express = require("express");
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server: server });
const fs = require('fs');

let CLIENTS = [];
let log = [];
const logPath = __dirname + '/log.txt';
wss.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + s4();
};

const makeMsg = (type, payload) => {
    return JSON.stringify({
        type,
        payload,
    });
};
 
wss.on("connection", function connection(ws, req) {
 
    ws.on('message', msg => {
        // console.log(msg)
        const convertedMsg = JSON.parse(msg);
        const { clientId, createdAt } = convertedMsg.payload;

        const logContent = `${clientId}\t|\t${createdAt}`
        
        ws.id = clientId
        const currentTarget = CLIENTS.filter(c => c.id === clientId);
        if(currentTarget.length == 0){
            CLIENTS.push(ws);
            log.push({ clientId, createdAt })
            if(fs.existsSync(logPath)){
                fs.appendFileSync(logPath, '\n' + logContent)
            }else{
                fs.writeFileSync(logPath, logContent)
            }
        }

        console.table(log)
        if(CLIENTS.length === 25) CLIENTS = [];
        ws.send(makeMsg("msg", `You are connected ${convertedMsg.payload.clientId}`));
        // ws.send(msg)
    }) 
}); 


// ?msg={string}
app.get("/updateNotice", (req, res) => {
    // console.log(req.query.msg, "???");
    const msg = JSON.parse(req.query.msg);
    CLIENTS.map((c) => {
        c.send(makeMsg("data", msg));
    });

    res.send({
        status: "ojbk",
        message: `message "${req.query.msg}" has been sent to ${CLIENTS.map(
            (c) => c.id
        )}`,
    });
});

// ?id={string}&msg={string}  
app.get("/sendTo", (req, res) => {
    const targetId = req.query.id;
    // console.log(targetId, 'targetId')
    
    if (CLIENTS.length > 0) {
        const target = CLIENTS.filter((c) => c.id == targetId);
        if (target.length === 0) {
            res.send({
                status: 404,
                msg: "client not found",
            });
            return;
        } 
        const msg = JSON.parse(req.query.msg);
        target[0].send(makeMsg("data", msg));
        res.send({
            status: "ojbk",
            message: `message "${req.query.msg}" has been sent to ${targetId}`,
            sent: makeMsg("data", msg),
        });
    } else {
        res.send({
            status: 403,
            msg: "no clients connected.",
        });
    }
});

app.get("/test", (req, res) => {
    const targetId = req.query.id;
    if (CLIENTS.length > 0) {
        const target = CLIENTS.filter((c) => c.id == targetId);
        if (target.length === 0) {
            res.send({
                status: 404,
                msg: "client not found",
            });
            return;
        } 
        // const msg = JSON.parse(req.query.msg);
        // console.log(target[0], '???')
        target[0].send(new Error('sb'));
        res.send({
            status: "ojbk",
            message: `message "${req.query.msg}" has been sent to ${targetId}`,
        });
    } else {
        res.send({
            status: 403,
            msg: "no clients connected.",
        });
    }
}); 

app.get("/", (req, res) => {
    res.send({ status: "OJBK" });
});
 
server.listen(3000, () => console.log(`Lisening on port :3000`));
 