class Thread {
    
    constructor(target, triggeringBlock) {
        this.target = target;
        this.interpreter = null;
        this.callback = null;
        if (triggeringBlock) {
            this.triggeringEvent = triggeringBlock.type;
            this.triggeringBlockID = triggeringBlock.id;
        }
        this.id = Thread.uuidv4();
    }

    static uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    blockCallback(returnValue) {
        if (!this.callback) {
            console.warn("Unset block callback for thread: " + this.id);
            return;
        }

        // highlightBlock(null);
        this.callback(returnValue);
        this.callback = null;
        this.step();
    }


    step() {
        console.log(`Stepping thread: ${this.id}`);
        var hasMore = this.interpreter.run();
        if (!hasMore) this.die();
    }

    die() {
        this.target.removeThread(this.id);
    }

    run(code) {
        let thread = this;
        function initApi(interpreter, globalObject) {      
            interpreter.setProperty(globalObject, 'call_block',
                interpreter.createAsyncFunction(function(name, argsJSON, callback) {
                    const args = JSON.parse(argsJSON);
                    // console.log('Calling: ', name, args);
                    Thread.callBlock({
                        methodName: name,
                        args: args,
                        targetID: thread.target.id,
                        threadID: thread.id,
                    });
                    thread.callback = callback;
            }));
      
            // Add an API function for highlighting blocks.
            var wrapper = function(id) {
              id = String(id || '');
              return interpreter.createPrimitive(highlightBlock(id));
            };
            interpreter.setProperty(globalObject, 'highlightBlock',
                interpreter.createNativeFunction(wrapper));
        }
        
        this.interpreter = new Interpreter(code, initApi);
        // TODO: Should step so its interruptable
        this.step();
    }

    static callBlock(data) {
        console.log('Calling', data);
        window.socket.send(JSON.stringify({
            'type': 'call',
            'data': data,
        }));

    }
}