'use strict'

define(
    ["EventEmitter",
     "WebRtcAdapter",
     "xormasters/callcenter/transport/Transport"],
    function (EventEmitter, WebRtcAdapter, Transport) {

  var findEntry = function(entry, queue) {
    var idx = -1;
    for( var i = 0; i < queue.length; i++ ) {
      console.log( "i = " + i + ", entry.time = " + entry.time + ", " + ", queue[i].time = " + queue[i].time)
      if(entry.time == queue[i].time) {
        idx = i;
        break;
      }
    }
    return idx;
  }
  
  var CallQueue = function(masterNode) {
    this.isMasterNode = masterNode;
    this.session = new Transport.Session();
    this.call_queue = new Array();
  }


CallQueue.prototype = {
  start: function() {
    this.session.addTransport('call_queue');
    
    var thi$ = this;
    
    this.session.on('connected', function() {
      console.log('Connected to call queue session');
      thi$.emit('started');
    });
    
    this.session.transport.on('data', function(data) {
      var message = JSON.parse(data);
      if( message.type === 'update' ) {
        thi$.call_queue = message.payload;
        thi$.emit('update', thi$.call_queue);
      } else if( message.type === 'take' ) {
        if(!thi$.isMasterNode) {
          console.error('Take request sent to non-master node');
          return;
        }
        console.log( thi$.call_queue[0] );
        var idx = xormasters.queue.findEntry(message.payload, thi$.call_queue);
        if( idx < 0 ) {
          console.error( "Could not find entry in call queue", message.payload);
          return;
        }
        
        var payload = null;
        
        if(thi$.call_queue[idx].status === 'waiting') {
          thi$.call_queue[idx].status = 'taken';
          payload = thi$.call_queue[idx];
        }
        
        var message = {
          type: 'takenResult',
          payload: payload
        }
        thi$.session.transport.sendData(JSON.stringify(message));
        thi$.sendUpdate();
      } else if( message.type === 'takenResult' ) {
        thi$.emit('takenResult', message.payload);
      } else {
        console.error("Unexpected message type: ", message )
      }
    });
  },
  
  stop: function() {
    this.session.removeTransport('call_queue');
  },
  
  update: function(entry) {
    this.call_queue.push(entry);
    this.sendUpdate();
  },
  
  sendUpdate: function() {
    var message = {
      type: 'update',
      from: 'master',
      payload: this.call_queue
    }
    
    this.session.transport.sendData(JSON.stringify(message));
  },
  
  take: function(entry) {
    var message = {
      type: 'take',
      from: 'agent',
      payload: entry
    }
    
    this.session.transport.sendData(JSON.stringify(message));
  }
}

CallQueue.prototype.__proto__ = EventEmitter.prototype;

return {
  CallQueue: CallQueue
  };
}
);