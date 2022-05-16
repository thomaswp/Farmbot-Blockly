class BlocklyConstructor {

    constructor() {
        this.categories = {};
        this.categoryColors = {};
        this.stackableEvents = [];
    }

    isEventStackable(name) {
        return this.stackableEvents.includes(name);
    }

    defineBlocks(data) {
        console.log(data);
    
        Blockly.JavaScript.addReservedWords('call_block');
        Blockly.JavaScript.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
        Blockly.JavaScript.STATEMENT_SUFFIX = 'highlightBlock(null);\n';
        Blockly.JavaScript.addReservedWords('highlightBlock');
        
        this.getCategoryColors(data);

        data.methods.forEach(blockDef => {
            this.defineBlock(blockDef, false);    
        });

        data.events.forEach(eventDef => {
            this.defineBlock(eventDef, true);    
        });
    
        this.defineCategories(data);
        
        window.mainWorkspace = Blockly.inject('blocklyDiv', {
            media: 'https://unpkg.com/blockly/media/',
            toolbox: document.getElementById('toolbox')
        });
    }

    getCategoryColors(data) {
        data.categories.forEach(category => {
            this.categoryColors[category.name] = category.color;
        });
    }

    defineCategories(data) {
        console.log('Categories: ', this.categories);
        let xml = '';
        data.categories.forEach(category => {
            xml += `<category name="${category.name}" colour="${category.color}">`;
            this.categories[category.name].forEach(block => {
                xml += '<block type="' + block + '"></block>';
            });
            xml += '</category>';
        });
        var toolbox = document.getElementById('toolbox');
        toolbox.innerHTML += xml;
    }

    static convertType(type) {
        switch (type) {
            case "Boolean": return "Boolean";
            // TODO: Some of these may need casting on return...
            case "Byte":
            case "SByte":
            case "Decimal":
            case "Double":
            case "Single":
            case "Int32":
            case "UInt32":
            case "IntPtr":
            case "UIntPtr":
            case "Int64":
            case "UInt64":
            case "Int16":
            case "UInt16": return "Number";
            case "Char":
            case "String": return "String";
        }
    }

    defineBlock(blockDef, isEvent) {
        var constructor = this;
        Blockly.Blocks[blockDef.name] = {
            init: function() {
                this.appendDummyInput()
                .appendField(blockDef.name);
                if (blockDef.parameters) {
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
                                .setCheck(BlocklyConstructor.convertType(param.type.type))
                                .appendField(param.name + ":");
                        }
                    });
                }
                
                if (blockDef.returnType) {
                    // TODO: Add type
                    this.setOutput(true, BlocklyConstructor.convertType(blockDef.returnType));
                } else if (isEvent) {
                    this.setPreviousStatement(false);
                    this.setNextStatement(true);
                    if (blockDef.isStackable) {
                        constructor.stackableEvents.push(blockDef.name);
                    }
                } else {
                    this.setPreviousStatement(true);
                    this.setNextStatement(true);
                }
                // TODO: Base on category
                this.setColour(constructor.categoryColors[blockDef.category]);
                this.setTooltip('');
            }
        };
        Blockly.JavaScript[blockDef.name] = function(block) {
            // console.log(block);
            // const args = [];
            
            const nArgs = blockDef.parameters ? blockDef.parameters.length : 0;
            let code = `call_block('${blockDef.name}', ${nArgs}`;
            if (blockDef.parameters) {
                blockDef.parameters.forEach(param => {
                    let value;
                    if (param.type.isEnum) {
                        value = block.getFieldValue(param.name);
                    } else {
                        // TODO: Handle default values
                        value = Blockly.JavaScript.valueToCode(block, param.name, Blockly.JavaScript.ORDER_NONE) || 'null';
                    }
                    console.log('Adding arg', param.name, value);
                    // args.push(value);
                    code += ", " + value;
                });
            }
            code += ")";

            // const escaped = JSON.stringify(args).replace("'", "\\'");
            // console.log('Defining: ', block);

            if (blockDef.returnType) {
                return [code, Blockly.JavaScript.ORDER_NONE];
            }
            return code + ';\n';
        };
                
        if (!(blockDef.category in this.categories)) {
            this.categories[blockDef.category] = [];
        }
        this.categories[blockDef.category].push(blockDef.name);
    }

};