const EventEmitter = require('events').EventEmitter;
const Db = require('mongodb').Db;

class Database extends EventEmitter {

    constructor() {
        super();
        var self = this;
        /**@type Db */
        this.db = null;
        self.init();
    }

    init() {
        var self = this;
        var connectionInterval = setInterval(function () {
            if (self.db == null) {
                self.connect();
            } else {
                clearInterval(connectionInterval);
            }
        }, 10000)
    }

    connect() {
        var self = this;
        var MongoClient = require('mongodb').MongoClient;

        MongoClient.connect(require('../config').mongoConnection, function (err, client) {
            if (err) {
                console.log('error in connecting to mongo:', err);
                return;
            }
            self.db = client.db("pm");
            self.emit('connected');
        });
    }

    insert(collectionName, data, callback) {
        var self = this;
        if (self.db == null) {
            console.log('unable to insert, db is null');
            return;
        }
        var collection = self.db.collection(collectionName);
        collection.insert(data, callback);
    }

    delete(fromTime, callback) {
        var self = this;

        if (self.db == null) {
            console.log('unable to delete, db is null');
            return;
        }

        self.db.collections((collection) => {
            var collection = db.collection(collection.name);
            collection.deleteMany({
                op: '<=',
                val: fromTime
            }, callback);
        });
    }

    getRegister(pm, fromDate, toDate) {
        if (fromDate == undefined)
            fromDate = 0;
        if (toDate == undefined)
            toDate = 9999999999999;

        var self = this;

        if (self.db == null) {
            console.log('unable to read, db is null');
            return;
        }

        var collection = self.db.collection(pm);

        return collection.find({
            "_id": {
                $gte: fromDate,
                $lt: toDate
            }
        })
    }

}

module.exports = new Database();