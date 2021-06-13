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

console.log("!");

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
    console.log(data);
    
    Blockly.JavaScript.addReservedWords('call_block');
    Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
    Blockly.JavaScript.addReservedWords('highlightBlock');
    
    let categories = {};
    data.methods.forEach(blockDef => {
     
        Blockly.Blocks[blockDef.name] = {
            init: function() {
                this.appendDummyInput()
                .appendField(blockDef.name);
                blockDef.parameters.forEach(param => {
                    // this.appendDummyInput()
                    if (param.type.isEnum) {
                        let dropdown = [];
                        param.type.options.forEach(option => dropdown.push([option, option]));
                        this.appendDummyInput()
                            .appendField(param.name + ":")
                            .appendField(new Blockly.FieldDropdown(dropdown), param.name);
                    } else {
                        this.appendValueInput(param.name)
                            .appendField(param.name + ":");
                    }
                });
                
                if (blockDef.returnType) {
                    // TODO: Add type
                    this.setOutput(true);
                } else if (blockDef.isEvent) {
                    this.setPreviousStatement(false);
                    this.setNextStatement(true);
                } else {
                    this.setPreviousStatement(true);
                    this.setNextStatement(true);
                }
                // TODO: Base on category
                this.setColour(290);
                this.setTooltip('');
            }
        };
        Blockly.JavaScript[blockDef.name] = function(block) {
            // console.log('Defining: ', block);
            return `call_block('${blockDef.name}');\n`;
        };
                
        if (!(blockDef.category in categories)) {
            categories[blockDef.category] = [];
        }
        categories[blockDef.category].push(blockDef.name);
    });

    console.log('Categories: ', categories);
    let xml = '';
    data.categories.forEach(category => {
        xml += `<category name="${category.name}" colour="${category.color}">`;
        categories[category.name].forEach(block => {
            xml += '<block type="' + block + '"></block>';
        });
        xml += '</category>';
    });
    var toolbox = document.getElementById('toolbox');
    toolbox.innerHTML += xml;
    initBlockly();
    // console.log(toolbox.innerHTML);
    // Blockly.updateToolbox(toolbox);  
 }
