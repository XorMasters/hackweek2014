'use strict'

define(
    ["EventEmitter",
     "WebRtcAdapter",
     "xormasters/callcenter/transport/Transport"],
    function (EventEmitter, WebRtcAdapter, Transport) {

        var findEntry = function (entry, queue) {
            var idx = -1;
            for (var i = 0; i < queue.length; i++) {
                console.log("i = " + i + ", entry.time = " + entry.timestamp + ", " + ", queue[i].time = " + queue[i].timestamp)
                if (entry.timestamp == queue[i].timestamp) {
                    idx = i;
                    break;
                }
            }
            return idx;
        }

        var CallQueue = function (isMasterNode, session) {
            this.isMasterNode = isMasterNode;
            this.session = session;
            this.call_queue = new Array();
        }


        CallQueue.prototype = {

            start: function () {

                var thi$ = this;

                this.session.transport.on('data', function (data) {
                    var message = JSON.parse(data);
                    if (message.type === 'update') {
                        console.log( "payload: ", message.payload);
                        thi$.call_queue = message.payload;
                        thi$.emit('update', thi$.call_queue);
                    } else if (message.type === 'take') {
                        if (!thi$.isMasterNode) {
                            console.error('Take request sent to non-master node');
                            return;
                        }
                        console.log(thi$.call_queue[0]);
                        var idx = findEntry(message.payload, thi$.call_queue);
                        if (idx < 0) {
                            console.error("Could not find entry in call queue", message.payload);
                            return;
                        }

                        var payload = null;

                        if (thi$.call_queue[idx].status === 'waiting') {
                            thi$.call_queue[idx].status = 'taken';
                            payload = thi$.call_queue[idx];
                        }

                        var messageResult = {
                            type: 'takenResult',
                            payload: payload
                        }
                        var str = JSON.stringify(messageResult);
                        thi$.session.transport.sendData(str);
                        thi$.sendUpdate();
                    } else if (message.type === 'takenResult') {
                        thi$.emit('takenResult', message.payload);
                    } else {
                        console.error("Unexpected message type: ", message)
                    }
                });
            },

            stop: function () {
                this.session.close();
            },

            update: function (entry) {
                this.call_queue.push(entry);
                this.sendUpdate();
            },

            sendUpdate: function () {
                var queue = new Array();
                for( var i = 0; i < this.call_queue.length; ++i ) {
                  var entry = this.call_queue[i];
                  queue.push( { content: {
                                  name: entry.content.name,
                                  summary: entry.content.summary
                                },
                                source: {
                                  description: entry.source.description,
                                  name: entry.source.name
                                },
                                status: entry.status,
                                timestamp: entry.timestamp
                              });
                }
       
                var message = {
                    type: 'update',
                    from: 'master',
                    payload: queue
                }

                var data = JSON.stringify(message);
                console.log("Sending RTC data with length " + data.length);
                console.log("Sending RTC data: " + data);
                this.session.transport.sendData(data);
            },

            take: function (entry) {
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