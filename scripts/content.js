console.log("IAM CopyPaste Helper: load websocket wrap")

const nativeWebSocket = window.WebSocket;

class WebSocket extends nativeWebSocket {
    nativeSend = nativeWebSocket.prototype.send
    nativeConstructor = nativeWebSocket.prototype.constructor
    latestClipBoard = "";
    watched = 0;

    constructor(e) {
        console.log("IAM CopyPaste Helper: start to wrap websocket")
        super(e)
    }

    watch() {
        setInterval(this.readClipBoard, 1000, this)
    }

    // TODO: huge clipboard content
    readClipBoard(wsconnection) {
        var text = document.createElement("input");
        text.setAttribute("id", "helper");
        text.style.position = "fixed"
        document.body.appendChild(text);
        text.focus();
        navigator.clipboard.readText().then((value) => {
            wsconnection.send("9.clipboard,1.0,10.text/plain;")
            if (value === this.latestClipBoard){
                return
            }
            this.latestClipBoard = value;
            let d = Base64.encode(value);
            let newmsg = "4.blob,1.0," + d.length + "." + d + ";";
            wsconnection.send(newmsg);
            wsconnection.send("3.end,1.0;")
            wsconnection.send("message 3.nop;")
        })
    }

    send(msg) {
        if (this.watched === 0) {
            this.watched = 1;
            console.log("IAM CopyPaste Helper: run watch");
            this.watch();
        }
        if (!msg.includes("ping") && !msg.includes("sync") && !msg.includes("mouse") && !msg.includes("keyboard")) {
            // console.log("send message", msg)
        }
        this.nativeSend(msg)
        this.addEventListener("message", messageReceived)
    }
}

function messageReceived(message) {
    if (message.data.includes("9.clipboard,1.0,10.text/plain")) {
        return
    }
    msgs = message.data.split(";")
    for (let i = 0; i < msgs.length; i++) {
        if (!msgs[i].includes("4.blob,1.0,")) {
            continue;
        }
        contents = msgs[i].split(".")
        let data = contents[contents.length - 1];
        let copiedData = Base64.decode(data);
        console.log("IAM CopyPaste Helper: receive raw data", copiedData);
        let helper = document.getElementById("helper");
        helper.value = copiedData;
        helper.focus();
        navigator.clipboard.writeText(copiedData).then(() => {
            console.log("IAM CopyPaste Helper: copy success")
        })
    }
}
