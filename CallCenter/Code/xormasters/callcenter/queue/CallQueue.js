'use strict'

var xormasters = xormasters || {};

xormasters.queue = {

  CallQueue = function(masterNode) {
    this.isMasterNode = masterNode;
    this.session = xormasters.transport.Session();
    this.call_queue = new Array();
  }
}

xormasters.queue.CallQueue.prototype = {
  start: function() {
    this.session.addTransport('call_queue');
    this.session.on('connected') {
      console.log('Connected to call queue session');
    }
    
    var thi$ = this;
    this.session.transport.on('data', function(data) {
      var message = JSON.parse(data);
      if( message.type === 'update' ) {
        thi$.call_queue = message.payload;
      } else if( message.type === 'take' ) {
        if(!thi$.isMasterNode) {
          console.error('Take request sent to non-master node');
          return;
        }
        var idx = thi$.call_queue.indexOf(message.payload);
        thi$.call_queue.splice(idx, 1);
      } else {
        console.error("Unexpected message type: ", message )
      }
    });
  },
  
  stop: function() {
    this.session.removeTransport('call_queue');
  },
  
  sendUpdate: function() {
    var message = {
      type: 'update',
      payload: this.call_queue
    }
    
    this.session.transport.sendData(JSON.stringify(message));
  },
  
  take: function(entry) {
    var message = {
      type: 'take',
      payload: entry
    }
    
    this.session.transport.sendData(JSON.stringify(message));
  }
}

xormasters.queue.CallQueue.prototype.__proto__ = EventEmitter.prototype;