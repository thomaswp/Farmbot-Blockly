var socket = new WebSocket("ws://127.0.0.1:8000");

var Commands = {};
var Interpreters = {};

socket.onopen = function (event) {
    
};

socket.onmessage = function (event) {
    console.log(event.data);

    let message = event.data;
    if (message.length < 2 || message[0] !== '{' || message[message.length - 1] != '}') {
        console.log(message);
    }

    try {
        let command = JSON.parse(message);
        if (Commands[command.type]) {
            Commands[command.type](command.data);
        } else {
            console.log("Unknown comamnd: " + command.type);
        }
    } catch (e) {
        console.log(e);
    }
}

window.onbeforeunload = function(){
    socket.send("Disconnect");
}

Commands['SetTarget'] = (data) => {
    // TODO: load code for target
    Target.getTarget(data.targetID, data.targetName, data.code);
    Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), demoWorkspace);
};

Commands['TriggerEvent'] = (data) => {
    Target.getTarget(data.targetID).trigger(data.eventName);
};

Commands['BlockFinished'] = (data) => {
    Target.getTarget(data.targetID).blockCallback(data.threadID, data.returnValue);
};

Commands['DefineBlocks'] = (data) => {
    if (!window.blocklyConstructor) {
        window.blocklyConstructor = new BlocklyConstructor();
    }
    window.blocklyConstructor.defineBlocks(data);
};
