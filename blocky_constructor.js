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
        Blockly.JavaScript.addReservedWords('highlightBlock');
        
        this.getCategoryColors(data);

        data.methods.forEach(blockDef => {
            this.defineBlock(blockDef, false);    
        });

        data.events.forEach(eventDef => {
            this.defineBlock(eventDef, true);    
        });
    
        this.defineCategories(data);
        initBlockly();
        // console.log(toolbox.innerHTML);
        // Blockly.updateToolbox(toolbox);  
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
                                .appendField(param.name + ":");
                        }
                    });
                }
                
                if (blockDef.returnType) {
                    // TODO: Add type
                    this.setOutput(true);
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
            // console.log('Defining: ', block);
            return `call_block('${blockDef.name}');\n`;
        };
                
        if (!(blockDef.category in this.categories)) {
            this.categories[blockDef.category] = [];
        }
        this.categories[blockDef.category].push(blockDef.name);
    }

};