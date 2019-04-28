const EventEmitter = require('events').EventEmitter;
const MongoClient = require('mongodb').MongoClient;
const connectionString = require('../config').mongoConnection;

class Database extends EventEmitter {

    constructor() {
        super();

        /**@type Db */
        this.db = null;
        this.isConnected = false;

        setInterval(() => {
            this.connect();
        }, 20000);
    }

    connect() {
        if (this.isConnected)
            return null;

        return (new Promise((res, rej) => {
            MongoClient.connect(connectionString, { useNewUrlParser: true }, (err, client) => {
                if (err) {
                    this.isConnected = false;
                    rej(err);
                    return;
                }

                this.db = client.db("pm");
                this.emit('connected');
                this.isConnected = true;
                res();
            });
        }));
    }

    /**
     * insert `data` into `collectionName` and returns a number of inserted `_id` in the resolve function
     * @param {string} collectionName 
     * @param {} data 
     */
    insert(collectionName, data) {
        return (new Promise((res, rej) => {
            if (this.db == null) {
                this.isConnected = false;
                rej(new Error('cannot insert, db is null.'))
            }

            // override mongodb auto _id
            if (!data._id)
                data._id = Date.now();

            this.db.collection(collectionName)
                .insertOne(data, (err) => {
                    if (err)
                        rej(new Error(`cannot insert: ${err}`));

                    res(data._id);
                });
        }));
    }

    /**
     * delete records from all collections older than `fromTime` value
     * @param {number} fromTime
     */
    delete(collectionName, fromTime) {
        return (new Promise((res, rej) => {
            if (this.db == null) {
                this.isConnected = false;
                rej(new Error('unable to delete, db is null.'))
            }

            this.db.collection(collectionName)
                .deleteMany({
                    "_id": {
                        $lt: fromTime
                    }
                }, (err) => {
                    if (err)
                        rej(err)
                    res();
                });
        }));
    }

    /**
     * get a cursor of all records of the given `collectionName` in the give date range.
     * @param {string} collectionName 
     * @param {number} fromDate 
     * @param {number} toDate 
     */
    find(collectionName, fromDate, toDate) {
        if (fromDate == undefined)
            fromDate = 0;
        if (toDate == undefined)
            toDate = 9999999999999;


        return (new Promise((res, rej) => {
            if (this.db == null) {
                this.isConnected = false;
                rej(new Error('unable to read, db is null.'))
            }

            res(
                this.db.collection(collectionName).find({
                    "_id": {
                        $gte: fromDate,
                        $lt: toDate
                    }
                })
            );
        }));
    }

}

module.exports = new Database();