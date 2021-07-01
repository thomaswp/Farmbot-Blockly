class Target {

    static targets = {};

    static getTarget(id, name, code) {
        let target = this.targets[id];
        if (target) return target;
        
        this.targets[id] = new Target(id, name, code);
        return this.targets[id];
    }

    constructor(id, name, code) {
        this.id = id;
        this.name = name;
        // TODO: load code

        this.threads = {};
    }

    trigger(name) {
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

        let blocks = demoWorkspace.getBlocksByType(name);
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