function highlightBlock(id) {
    window.mainWorkspace.highlightBlock(id);
}

class Target {

    static targets = {};
    static currentEditing = null;

    static getTarget(id, name, code) {
        let target = this.targets[id];
        if (target) {
            if (code) target.code = Blockly.Xml.textToDom(code);
            if (name) target.name = name;
            return target;
        }
        
        this.targets[id] = new Target(id, name, code);
        return this.targets[id];
    }

    static reset() {
        if (this.currentEditing) this.currentEditing.unsetAsEditing();
        this.targets = {};
        this.currentEditing = null;
    }

    constructor(id, name, code) {
        this.id = id;
        this.name = name;
        
        if (code) {
            this.code = Blockly.Xml.textToDom(code)
        } else {
            this.code = document.getElementById('startBlocks');
        }

        this.threads = {};
        this.isEditing = false;
        this.updateListener = event => this.onUpdate(event);
        this.saveCallback = null;

        this.workspace = new Blockly.Workspace();
        Blockly.Xml.domToWorkspace(this.code, this.workspace);
    }

    onUpdate(event) {
        this.saveCodeDelayed();
    }

    unsetAsEditing() {
        this.saveCode();
        this.isEditing = false;
        window.mainWorkspace.removeChangeListener(this.updateListener);
    }

    saveCodeDelayed() {
        clearTimeout(this.saveCallback);
        this.saveCallback = setTimeout(() => this.saveCode(), 2000);
    }

    saveCode() {
        clearTimeout(this.saveCallback);
        if (!this.isEditing) return;
        this.code = Blockly.Xml.workspaceToDom(window.mainWorkspace);
        this.workspace.clear();
        Blockly.Xml.domToWorkspace(this.code, this.workspace);
        const data = {
            'type': 'save',
            'data': {
                targetID: this.id,
                code: this.code ? this.code.outerHTML : null,
            },
        };
        // console.log('saving', data);
        window.socket.send(JSON.stringify(data));
    }

    setAsEditing() {
        this.isEditing = true;
        Target.currentEditing = this;
        window.mainWorkspace.clear();
        Blockly.Xml.domToWorkspace(this.code, window.mainWorkspace);

        window.mainWorkspace.addChangeListener(this.updateListener);
    }

    trigger(name) {
        this.saveCode();
        // Threads already running for this event that shouldn't be re-run
        var runningBlocks = []
        if (!window.blocklyConstructor.isEventStackable(name)) {
            Object.keys(this.threads).forEach(threadID => {
                let thread = this.threads[threadID];
                if (thread.triggeringEvent == name) {
                    runningBlocks.push(thread.triggeringBlockID);
                }
            });
        }

        Blockly.JavaScript.init(this.workspace);
        let blocks = this.workspace.getBlocksByType(name);
        // console.log(this.isEditing);
        // console.log(blocks);
        // console.log(Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(this.workspace)));
        blocks.forEach(block => {
            // Skip already running event blocks
            if (runningBlocks.includes(block.id)) return;
            let code = Blockly.JavaScript.blockToCode(block);
            
            let thread = new Thread(this, block);
            console.log(`Running ${code} on thread ${thread.id}`);
            this.threads[thread.id] = thread;
            thread.run(code);
        });
    }

    blockCallback(threadID, returnValue) {
        if (!this.threads[threadID]) {
            console.log(`Call to dead thread: ${threadID}`);
            return;
        }
        this.threads[threadID].blockCallback(returnValue)
    }

    step() {

    }

    removeThread(id) {
        delete this.threads[id];
    }

    
}