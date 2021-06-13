var socket = new WebSocket("ws://127.0.0.1:8000");

var Commands = {};
var Targets = {};

socket.onopen = function (event) {
    socket.send('Testing!');
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
    var id = data.targetID;
    
};

Commands['TriggerEvent'] = (data) => {
    let blocks = demoWorkspace.getBlocksByType(data.name);
    blocks.forEach(block => {
        let code = Blockly.JavaScript.blockToCode(block);
        console.log('Running:', code);
        myInterpreter = new Interpreter(code, initApi);
        myInterpreter.run();
        console.log(block);
    });
};

Commands['DefineBlocks'] = (data) => {
    console.log(data);
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
    Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'),
                               demoWorkspace);
    // console.log(toolbox.innerHTML);
    // Blockly.updateToolbox(toolbox);  
 }
