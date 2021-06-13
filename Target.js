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
        // TODO: get code from variable
        let blocks = demoWorkspace.getBlocksByType(name);
        blocks.forEach(block => {
            let code = Blockly.JavaScript.blockToCode(block);
            
            let thread = new Thread(this);
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