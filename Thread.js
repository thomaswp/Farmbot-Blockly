class Thread {
    
    constructor(target) {
        this.target = target;
        this.interpreter = null;
        this.callback = null;
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
                interpreter.createAsyncFunction(function(name, callback) {
                  console.log('Calling: ', name);
                  // TODO: handle arguments
                  socket.send(JSON.stringify({
                      methodName: name,
                      target: thread.interpreter.target,
                      threadID: thread.id,
                  }));
                  thread.callback = callback;
                // setTimeout(callback, 1000);
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
}